import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Court from '@/models/Court';
import Reservation from '@/models/Reservation';
import User from '@/models/User';

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
    
    // First, ensure all courts exist (1 through 20)
    const existingCourts = await Court.find().sort({ name: 1 });
    const existingCourtNames = new Set(existingCourts.map(c => c.name));
    
    // Create any missing courts
    const courtsToCreate = [];
    for (let i = 1; i <= 20; i++) {
      const courtName = `Court ${i}`;
      if (!existingCourtNames.has(courtName)) {
        courtsToCreate.push({
          name: courtName,
          isAvailable: true,
          currentReservation: null
        });
      }
    }
    
    if (courtsToCreate.length > 0) {
      await Court.create(courtsToCreate);
    }

    const currentTime = new Date();
    
    // Clean up expired reservations
    const expiredReservations = await Reservation.find({
      endTime: { $lte: currentTime }
    });

    // Update courts that had expired reservations
    if (expiredReservations.length > 0) {
      const expiredCourtIds = expiredReservations.map(res => res.courtId);
      await Court.updateMany(
        { _id: { $in: expiredCourtIds } },
        { $set: { isAvailable: true, currentReservation: null } }
      );
      
      // Delete expired reservations
      await Reservation.deleteMany({
        _id: { $in: expiredReservations.map(res => res._id) }
      });
    }
    
    // Get all active reservations
    const activeReservations = await Reservation.find({
      startTime: { $lte: currentTime },
      endTime: { $gt: currentTime }
    });

    // Create a map of active reservations by courtId
    const activeReservationMap = new Map(
      activeReservations.map(res => [res.courtId.toString(), res])
    );
    
    // Get all courts and sync their status with active reservations
    const courts = await Court.find().sort({ name: 1 });

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
          });
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
          });
          court.isAvailable = true;
          court.currentReservation = null;
        }
      }
    }));

    // Return cleaned court data
    const safeCourtData = courts.map(court => ({
      _id: court._id,
      name: court.name,
      isAvailable: court.isAvailable,
      currentReservation: court.currentReservation ? {
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
    console.error('Error fetching courts:', error);
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 });
  }
} 