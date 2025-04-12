import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Court from '@/models/Court';
import Reservation from '@/models/Reservation';

export async function GET() {
  try {
    await dbConnect();
    
    // Find all courts with expired reservations
    const courts = await Court.find({ isAvailable: false })
      .populate('currentReservation');

    let cleanedCount = 0;
    
    // Update courts with expired reservations
    for (const court of courts) {
      if (court.currentReservation && court.currentReservation.isExpired()) {
        // Store the reservation ID before deleting
        const reservationId = court.currentReservation._id;
        
        // Reset court status
        court.isAvailable = true;
        court.currentReservation = null;
        await court.save();

        // Delete the expired reservation
        await Reservation.findByIdAndDelete(reservationId);
        cleanedCount++;
      }
    }

    return NextResponse.json({ 
      success: true,
      message: `Cleaned up ${cleanedCount} expired reservations`,
      cleanedCount
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 });
  }
} 