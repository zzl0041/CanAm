import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Court from '@/models/Court';

export async function GET() {
  try {
    await dbConnect();
    
    // Get all courts with active reservations
    const activeCourts = await Court.find({ isAvailable: false })
      .populate('currentReservation');

    // Extract unique active users
    const activeUsers = new Set(
      activeCourts
        .filter(court => court.currentReservation)
        .flatMap(court => court.currentReservation.userIds)
    );

    return NextResponse.json({ 
      success: true,
      activeUsers: Array.from(activeUsers)
    });
  } catch (error) {
    console.error('Error fetching active users:', error);
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 });
  }
} 