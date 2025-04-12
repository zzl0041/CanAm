import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Court from '@/models/Court';
import Reservation from '@/models/Reservation';

export async function GET() {
  try {
    await dbConnect();
    
    // Get all courts with active reservations
    const activeCourts = await Court.find({ isAvailable: false })
      .populate('currentReservation');

    const currentTime = new Date();
    
    // Process courts and update expired games
    const activeUsers = [];
    
    await Promise.all(activeCourts.map(async court => {
      if (court.currentReservation) {
        const startTime = new Date(court.currentReservation.startTime);
        const timeDifferenceMinutes = (currentTime - startTime) / (1000 * 60);
        
        if (timeDifferenceMinutes >= 60) {
          // Update the court in database
          await Court.findByIdAndUpdate(court._id, {
            isAvailable: true,
            currentReservation: null
          });

          // Delete or archive the reservation
          if (court.currentReservation._id) {
            await Reservation.findByIdAndDelete(court.currentReservation._id);
          }
        } else {
          // Only add users from active games
          court.currentReservation.userIds.forEach(userId => {
            activeUsers.push({
              username: userId,
              startTime: court.currentReservation.startTime
            });
          });
        }
      }
    }));

    return NextResponse.json({ 
      success: true,
      activeUsers
    });
  } catch (error) {
    console.error('Error fetching active users:', error);
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 });
  }
} 