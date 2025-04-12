import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Court from '@/models/Court';
import Reservation from '@/models/Reservation';
import User from '@/models/User';

export async function POST(request) {
  try {
    await dbConnect();
    const { courtId, userIds } = await request.json();
    
    // Basic validation
    if (!courtId || !userIds || !Array.isArray(userIds) || userIds.length !== 2) {
      return NextResponse.json({ 
        error: 'Invalid request data' 
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

    // Validate users exist and are not expired
    const currentTime = new Date();
    const validUsers = await User.find({
      animalName: { $in: formattedUserIds },
      expiresAt: { $gt: currentTime }
    });

    if (validUsers.length !== formattedUserIds.length) {
      const foundUsernames = new Set(validUsers.map(u => u.animalName));
      const invalidUsers = formattedUserIds.filter(id => !foundUsernames.has(id));
      return NextResponse.json({
        error: `The following users are not registered or have expired: ${invalidUsers.join(', ')}`
      }, { status: 400 });
    }

    // Check if users are already in active games
    const activeCourts = await Court.find({ isAvailable: false })
      .populate('currentReservation');

    const activeUsers = new Set(
      activeCourts
        .filter(court => court.currentReservation)
        .flatMap(court => court.currentReservation.userIds)
    );

    const busyUsers = formattedUserIds.filter(userId => activeUsers.has(userId));
    if (busyUsers.length > 0) {
      return NextResponse.json({ 
        error: `The following users are already in active courts: ${busyUsers.join(', ')}` 
      }, { status: 400 });
    }

    // Get the target court and verify it's a half court in use
    const court = await Court.findById(courtId).populate('currentReservation');
    if (!court) {
      return NextResponse.json({ 
        error: 'Court not found' 
      }, { status: 404 });
    }

    if (court.isAvailable || !court.currentReservation) {
      return NextResponse.json({ 
        error: 'Court is not in use' 
      }, { status: 400 });
    }

    if (court.currentReservation.type !== 'half') {
      return NextResponse.json({ 
        error: 'Can only merge into a half court' 
      }, { status: 400 });
    }

    // Update the reservation with new players and change type to full
    const existingUserIds = court.currentReservation.userIds;
    const allUserIds = [...existingUserIds, ...formattedUserIds];
    
    // Update the reservation
    await Reservation.findByIdAndUpdate(court.currentReservation._id, {
      userIds: allUserIds,
      type: 'full'
    });

    return NextResponse.json({ 
      success: true,
      message: 'Successfully merged into full court'
    });

  } catch (error) {
    console.error('Merge error:', error);
    return NextResponse.json({ 
      error: 'Failed to merge into court' 
    }, { status: 500 });
  }
} 