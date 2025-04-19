import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Court from '@/models/Court';
import Reservation from '@/models/Reservation';
import User from '@/models/User';
import mongoose from 'mongoose';

export async function GET() {
  try {
    await dbConnect();
    
    // Get current date in PST and start of day
    const now = new Date();
    const pstDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
    const startOfDay = new Date(pstDate);
    startOfDay.setHours(0, 0, 0, 0);

    // Clean up expired users (from previous days)
    await User.deleteMany({
      createdAt: { $lt: startOfDay }
    });
    
    // Start a session for atomic operations
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // First, ensure all courts exist (1 through 20)
      const existingCourts = await Court.find().sort({ name: 1 }).session(session);
      const existingCourtMap = new Map(existingCourts.map(c => [c.name, c]));
      
      // Create any missing courts
      const courtsToCreate = [];
      for (let i = 1; i <= 20; i++) {
        const courtName = `Court ${i}`;
        if (!existingCourtMap.has(courtName)) {
          courtsToCreate.push({
            _id: new mongoose.Types.ObjectId(),
            name: courtName,
            isAvailable: true,
            currentReservation: null
          });
        }
      }
      
      if (courtsToCreate.length > 0) {
        await Court.create(courtsToCreate, { session });
      }

      // Clean up expired reservations
      const expiredReservations = await Reservation.find({
        endTime: { $lte: now }
      }).session(session);

      // Update courts that had expired reservations
      if (expiredReservations.length > 0) {
        const expiredCourtIds = expiredReservations.map(res => res.courtId);
        await Court.updateMany(
          { _id: { $in: expiredCourtIds } },
          { $set: { isAvailable: true, currentReservation: null } },
          { session }
        );
        
        // Delete expired reservations
        await Reservation.deleteMany({
          _id: { $in: expiredReservations.map(res => res._id) }
        }, { session });
      }
      
      // Get all active reservations
      const activeReservations = await Reservation.find({
        startTime: { $lte: now },
        endTime: { $gt: now }
      }).session(session);

      // Create a map of active reservations by courtId
      const activeReservationMap = new Map(
        activeReservations.map(res => [res.courtId.toString(), res])
      );
      
      // Get all courts and sync their status with active reservations
      const courts = await Court.find().sort({ name: 1 }).session(session);

      // Process each court and sync with reservations
      await Promise.all(courts.map(async (court) => {
        const activeReservation = activeReservationMap.get(court._id.toString());
        
        if (activeReservation) {
          // Court has an active reservation
          if (!court.currentReservation || court.currentReservation.toString() !== activeReservation._id.toString()) {
            // Update court to reflect active reservation
            await Court.findByIdAndUpdate(court._id, {
              isAvailable: false,
              currentReservation: activeReservation._id
            }, { session });
            court.isAvailable = false;
            court.currentReservation = activeReservation;
          }
        } else {
          // No active reservation for this court
          if (!court.isAvailable || court.currentReservation) {
            // Update court to be available
            await Court.findByIdAndUpdate(court._id, {
              isAvailable: true,
              currentReservation: null
            }, { session });
            court.isAvailable = true;
            court.currentReservation = null;
          }
        }
      }));

      // Commit the transaction
      await session.commitTransaction();

      // Return cleaned court data
      const safeCourtData = courts.map(court => ({
        _id: court._id,
        name: court.name,
        isAvailable: court.isAvailable,
        currentReservation: court.currentReservation ? {
          _id: court.currentReservation._id,
          startTime: court.currentReservation.startTime,
          userIds: court.currentReservation.userIds || [],
          type: court.currentReservation.type,
          option: court.currentReservation.option
        } : null
      }));

      return NextResponse.json({ 
        success: true,
        courts: safeCourtData
      });
    } catch (error) {
      // Rollback the transaction on error
      await session.abortTransaction();
      throw error;
    } finally {
      // End the session
      session.endSession();
    }
  } catch (error) {
    console.error('Error fetching courts:', error);
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 });
  }
} 