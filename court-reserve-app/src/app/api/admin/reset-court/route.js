import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Court from '@/models/Court';
import Reservation from '@/models/Reservation';

const ADMIN_PASSWORD = 'canamadmin';

export async function POST(request) {
  try {
    const { courtId, adminPassword } = await request.json();

    // Verify admin password
    if (adminPassword !== ADMIN_PASSWORD) {
      return NextResponse.json({ 
        error: 'Invalid admin password' 
      }, { status: 401 });
    }

    await dbConnect();

    // Find the court and populate the reservation
    const court = await Court.findById(courtId).populate('currentReservation');
    if (!court) {
      return NextResponse.json({ 
        error: 'Court not found' 
      }, { status: 404 });
    }

    // If there's a current reservation, delete it properly
    if (court.currentReservation) {
      // Store the reservation ID before deleting
      const reservationId = court.currentReservation._id;
      
      // Reset court status first
      court.isAvailable = true;
      court.currentReservation = null;
      await court.save();

      // Then delete the reservation
      await Reservation.findByIdAndDelete(reservationId);
    }

    return NextResponse.json({ 
      success: true,
      message: 'Court reset successfully'
    });
  } catch (error) {
    console.error('Admin reset error:', error);
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 });
  }
} 