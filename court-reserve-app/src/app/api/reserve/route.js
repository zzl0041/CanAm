import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Court from '@/models/Court';
import Reservation from '@/models/Reservation';
import User from '@/models/User';
import mongoose from 'mongoose';

export async function POST(request) {
  // Start a MongoDB session for transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    await dbConnect();
    const { courtId, userIds, type, option } = await request.json();
    
    console.log('Reservation request:', { courtId, userIds, type, option });

    // Basic validation
    if (!courtId || !userIds || !type) {
      return NextResponse.json({ 
        error: 'Missing required fields' 
      }, { status: 400 });
    }

    // Format usernames
    const formattedUserIds = userIds.map(id => 
      id.charAt(0).toUpperCase() + id.slice(1).toLowerCase()
    );

    // Check for duplicate users
    if (new Set(formattedUserIds).size !== formattedUserIds.length) {
      return NextResponse.json({ 
        error: 'Each player must be unique' 
      }, { status: 400 });
    }

    // Find the court and lock it for update
    const court = await Court.findById(courtId).session(session);
    if (!court) {
      await session.abortTransaction();
      return NextResponse.json({ 
        error: 'Court not found' 
      }, { status: 404 });
    }

    // Double-check court availability (race condition protection)
    if (!court.isAvailable) {
      await session.abortTransaction();
      return NextResponse.json({ 
        error: 'Court is no longer available' 
      }, { status: 400 });
    }

    // Validate users exist and are not expired within the transaction
    const currentTime = new Date();
    const validUsers = await User.find({
      animalName: { $in: formattedUserIds },
      expiresAt: { $gt: currentTime }
    }).session(session);

    if (validUsers.length !== formattedUserIds.length) {
      await session.abortTransaction();
      const foundUsernames = new Set(validUsers.map(u => u.animalName));
      const invalidUsers = formattedUserIds.filter(id => !foundUsernames.has(id));
      return NextResponse.json({
        error: `The following users are not registered or have expired: ${invalidUsers.join(', ')}`
      }, { status: 400 });
    }

    // Check if users are already in active games within the transaction
    const activeCourts = await Court.find({ 
      isAvailable: false,
      'currentReservation.userIds': { $in: formattedUserIds }
    }).session(session);

    if (activeCourts.length > 0) {
      await session.abortTransaction();
      const busyUsers = formattedUserIds.filter(userId => 
        activeCourts.some(court => 
          court.currentReservation?.userIds.includes(userId)
        )
      );
      return NextResponse.json({ 
        error: `The following users are already in active courts: ${busyUsers.join(', ')}` 
      }, { status: 400 });
    }

    // Create reservation within the transaction
    const reservation = await Reservation.create([{
      courtId,
      userIds: formattedUserIds,
      type,
      option: type === 'half' ? option : null,
      startTime: new Date()
    }], { session });

    // Update court within the transaction
    court.isAvailable = false;
    court.currentReservation = reservation[0]._id;
    await court.save({ session });

    // Commit the transaction
    await session.commitTransaction();

    // Get the updated court with populated reservation
    const updatedCourt = await Court.findById(courtId).populate('currentReservation');

    return NextResponse.json({ 
      success: true,
      court: {
        _id: updatedCourt._id,
        name: updatedCourt.name,
        isAvailable: updatedCourt.isAvailable,
        currentReservation: updatedCourt.currentReservation ? {
          startTime: updatedCourt.currentReservation.startTime,
          userIds: updatedCourt.currentReservation.userIds,
          type: updatedCourt.currentReservation.type,
          option: updatedCourt.currentReservation.option
        } : null
      }
    });

  } catch (error) {
    // Rollback the transaction on error
    await session.abortTransaction();
    console.error('Reservation error:', error);
    return NextResponse.json({ 
      error: 'Failed to create reservation' 
    }, { status: 500 });
  } finally {
    // End the session
    session.endSession();
  }
} 