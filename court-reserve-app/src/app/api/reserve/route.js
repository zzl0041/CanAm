import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Court from '@/models/Court';
import Reservation from '@/models/Reservation';
import User from '@/models/User';

export async function POST(request) {
  try {
    await dbConnect();
    const { courtId, userIds, type, option } = await request.json();
    
    console.log('Reservation request:', { courtId, userIds, type, option }); // Debug log

    // Basic validation
    if (!courtId || !userIds || !type) {
      return NextResponse.json({ 
        error: 'Missing required fields' 
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

    console.log('Found valid users:', validUsers); // Debug log

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

    // Type validation
    if (!['half', 'full'].includes(type)) {
      return NextResponse.json({ 
        error: 'Type must be either "half" or "full"' 
      }, { status: 400 });
    }

    // Option validation for half court
    if (type === 'half' && (!option || !['merge', 'queue'].includes(option))) {
      return NextResponse.json({ 
        error: 'Half court reservation requires option to be either "merge" or "queue"' 
      }, { status: 400 });
    }

    // Player count validation
    const requiredPlayers = type === 'half' ? 2 : 4;
    if (!Array.isArray(formattedUserIds) || formattedUserIds.length !== requiredPlayers) {
      return NextResponse.json({ 
        error: `${type} court requires exactly ${requiredPlayers} players` 
      }, { status: 400 });
    }

    // Check court availability
    const court = await Court.findById(courtId);
    if (!court) {
      return NextResponse.json({ 
        error: 'Court not found' 
      }, { status: 404 });
    }

    if (!court.isAvailable) {
      return NextResponse.json({ 
        error: 'Court is not available' 
      }, { status: 400 });
    }

    // Create reservation
    const reservation = await Reservation.create({
      courtId,
      userIds: formattedUserIds,
      type,
      option: type === 'half' ? option : null,
      startTime: new Date()
    });

    // Update court
    court.isAvailable = false;
    court.currentReservation = reservation._id;
    await court.save();

    return NextResponse.json({ 
      success: true,
      reservation 
    });

  } catch (error) {
    console.error('Reservation error:', error);
    return NextResponse.json({ 
      error: 'Failed to create reservation' 
    }, { status: 500 });
  }
} 