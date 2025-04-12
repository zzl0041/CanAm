import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Court from '@/models/Court';

export async function GET() {
  try {
    await dbConnect();
    
    // Fetch courts with populated reservation data
    const courts = await Court.find()
      .populate('currentReservation')
      .sort({ name: 1 });

    // Transform the data to ensure safe access
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