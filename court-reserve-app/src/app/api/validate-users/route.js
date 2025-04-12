import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Court from '@/models/Court';

export async function POST(request) {
  try {
    await dbConnect();
    const { usernames } = await request.json();
    
    console.log('Validating usernames:', usernames); // Debug log

    // Format usernames to match database format
    const formattedUsernames = usernames.map(name => 
      name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()
    );

    console.log('Formatted usernames:', formattedUsernames); // Debug log

    // Update the user validation query to use createdAt instead of expiresAt
    const currentTime = new Date();
    const pstDate = new Date(currentTime.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
    const startOfDay = new Date(pstDate);
    startOfDay.setHours(0, 0, 0, 0);

    const existingUsers = await User.find({
      animalName: { $in: formattedUsernames },
      createdAt: { $gte: startOfDay }
    });

    console.log('Found users:', existingUsers); // Debug log

    // Create a set of valid usernames
    const validUsernames = new Set(existingUsers.map(user => user.animalName));

    // Find which usernames don't exist or are expired
    const invalidUsernames = formattedUsernames.filter(username => 
      !validUsernames.has(username)
    );

    // Check for duplicate usernames in the request
    const hasDuplicates = new Set(formattedUsernames).size !== formattedUsernames.length;
    if (hasDuplicates) {
      return NextResponse.json({
        success: false,
        error: 'Each player must be unique'
      }, { status: 400 });
    }

    // Get active courts with their current reservations
    const activeCourts = await Court.find({ isAvailable: false })
      .populate('currentReservation');

    // Create a set of users currently in active games (less than 60 minutes old)
    const activeUsers = new Set(
      activeCourts
        .filter(court => {
          if (!court.currentReservation) return false;
          const startTime = new Date(court.currentReservation.startTime);
          const timeDifferenceMinutes = (currentTime - startTime) / (1000 * 60);
          return timeDifferenceMinutes < 60;
        })
        .flatMap(court => court.currentReservation.userIds)
    );

    // Create a set of valid usernames (case-insensitive comparison)
    const validUsernamesSet = new Set(existingUsers.map(user => user.animalName));

    // Find which usernames don't exist or are in active games
    const invalidUsernamesInActiveGames = formattedUsernames.filter(username => 
      !validUsernamesSet.has(username) || activeUsers.has(username)
    );

    // For better error messages, separate invalid and active users
    const nonExistentUsers = formattedUsernames.filter(username => 
      !validUsernamesSet.has(username)
    );
    const busyUsers = formattedUsernames.filter(username => 
      validUsernamesSet.has(username) && activeUsers.has(username)
    );

    return NextResponse.json({
      success: true,
      valid: invalidUsernames.length === 0,
      invalidUsernames,
      nonExistentUsers,
      busyUsers,
      message: invalidUsernames.length > 0 
        ? `The following users are not registered or have expired: ${invalidUsernames.join(', ')}`
        : 'All users are valid'
    });
  } catch (error) {
    console.error('User validation error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to validate users'
    }, { status: 500 });
  }
} 