import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Court from '@/models/Court';
import Reservation from '@/models/Reservation';

export async function POST() {
  try {
    await dbConnect();
    
    // Find all courts with expired reservations
    const courts = await Court.find({ isAvailable: false })
      .populate('currentReservation');

    // Update courts with expired reservations
    for (const court of courts) {
      if (court.currentReservation && court.currentReservation.isExpired()) {
        court.isAvailable = true;
        court.currentReservation = null;
        await court.save();
      }
    }

    return NextResponse.json({ 
      success: true,
      message: 'Courts cleaned up successfully'
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 });
  }
} 