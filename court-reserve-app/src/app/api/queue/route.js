import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Court from '@/models/Court';

export async function GET() {
  try {
    await dbConnect();
    
    // Get all courts with active reservations
    const courts = await Court.find({ isAvailable: false })
      .populate('currentReservation')
      .sort({ name: 1 });  // Sort by court name

    // Transform the data to include time remaining
    const now = new Date();
    const activeReservations = courts
      .filter(court => court.currentReservation)
      .map(court => {
        const endTime = new Date(court.currentReservation.endTime);
        const timeRemaining = endTime.getTime() - now.getTime();
        const courtNumber = parseInt(court.name.replace('Court ', ''));
        
        return {
          courtNumber,
          userIds: court.currentReservation.userIds,
          type: court.currentReservation.type,
          startTime: court.currentReservation.startTime,
          endTime: court.currentReservation.endTime,
          timeRemaining: Math.max(0, timeRemaining), // Don't show negative time
        };
      })
      .filter(res => res.timeRemaining > 0) // Only show active reservations
      .sort((a, b) => a.timeRemaining - b.timeRemaining); // Sort by time remaining

    return NextResponse.json({ 
      success: true,
      queue: activeReservations
    });
  } catch (error) {
    console.error('Queue error:', error);
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 });
  }
} 