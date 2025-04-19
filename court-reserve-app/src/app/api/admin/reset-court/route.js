import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Court from '@/models/Court';
import Reservation from '@/models/Reservation';
import mongoose from 'mongoose';

const ADMIN_PASSWORD = 'canamadmin';

export async function POST(request) {
  // Start a MongoDB session for transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { courtId, adminPassword } = await request.json();

    console.log('Resetting court:', courtId);

    // Verify admin password
    if (adminPassword !== ADMIN_PASSWORD) {
      return NextResponse.json({ 
        error: 'Invalid admin password' 
      }, { status: 401 });
    }

    await dbConnect();

    // Find the court and populate the reservation
    const court = await Court.findById(courtId)
      .populate('currentReservation')
      .session(session);

    if (!court) {
      await session.abortTransaction();
      return NextResponse.json({ 
        error: 'Court not found' 
      }, { status: 404 });
    }

    console.log('Found court:', court.name, 'Current reservation:', court.currentReservation?._id);

    // If there's a current reservation, delete it properly
    if (court.currentReservation) {
      try {
        // Store the reservation ID before deleting
        const reservationId = court.currentReservation._id;
        
        // Reset court status first
        await Court.findByIdAndUpdate(
          court._id,
          {
            isAvailable: true,
            currentReservation: null
          },
          { session }
        );

        // Then delete the reservation
        await Reservation.findByIdAndDelete(reservationId, { session });

        console.log('Successfully reset court and deleted reservation');
      } catch (error) {
        console.error('Error during court reset:', error);
        await session.abortTransaction();
        throw error;
      }
    } else {
      // Just reset the court status if no reservation
      await Court.findByIdAndUpdate(
        court._id,
        {
          isAvailable: true,
          currentReservation: null
        },
        { session }
      );
      console.log('Successfully reset court (no reservation to delete)');
    }

    // Commit the transaction
    await session.commitTransaction();

    return NextResponse.json({ 
      success: true,
      message: 'Court reset successfully',
      court: {
        _id: court._id,
        name: court.name,
        isAvailable: true,
        currentReservation: null
      }
    });
  } catch (error) {
    // Rollback the transaction on error
    await session.abortTransaction();
    console.error('Admin reset error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to reset court'
    }, { status: 500 });
  } finally {
    // End the session
    session.endSession();
  }
} 