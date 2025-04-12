import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Court from '@/models/Court';
import Reservation from '@/models/Reservation';

export async function GET() {
  try {
    await dbConnect();
    
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
          isAvailable: true
        });
      }
    }
    
    if (courtsToCreate.length > 0) {
      await Court.create(courtsToCreate);
    }
    
    // Fetch all courts with populated reservation data
    const courts = await Court.find()
      .populate('currentReservation')
      .sort({ name: 1 });

    const currentTime = new Date();

    // Transform the data and update expired games in database
    const safeCourtData = await Promise.all(courts.map(async court => {
      // Check if the court has an active reservation
      if (court.currentReservation) {
        const startTime = new Date(court.currentReservation.startTime);
        const timeDifferenceMinutes = (currentTime - startTime) / (1000 * 60);
        
        // If 60 minutes have passed, update the database
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

          return {
            _id: court._id,
            name: court.name,
            isAvailable: true,
            currentReservation: null
          };
        }
      }

      // Return court data with current reservation if game is still active
      return {
        _id: court._id,
        name: court.name,
        isAvailable: court.isAvailable,
        currentReservation: court.currentReservation ? {
          startTime: court.currentReservation.startTime,
          userIds: court.currentReservation.userIds || [],
          type: court.currentReservation.type,
          option: court.currentReservation.option
        } : null
      };
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