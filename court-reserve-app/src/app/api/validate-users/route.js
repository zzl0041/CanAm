import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Court from '@/models/Court';

export async function POST(request) {
  try {
    // Connect to database with error handling
    try {
      await dbConnect();
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      return NextResponse.json({ 
        success: false,
        error: 'Database connection failed'
      }, { status: 500 });
    }

    // Parse request body with error handling
    let usernames;
    try {
      const body = await request.json();
      usernames = body.usernames;
      
      if (!usernames || !Array.isArray(usernames)) {
        return NextResponse.json({
          success: false,
          error: 'Invalid request format: usernames must be an array'
        }, { status: 400 });
      }
    } catch (parseError) {
      console.error('Request parsing error:', parseError);
      return NextResponse.json({
        success: false,
        error: 'Invalid request format'
      }, { status: 400 });
    }
    
    console.log('Validating usernames:', usernames);

    // Format usernames to match database format
    const formattedUsernames = usernames.map(name => 
      name?.charAt(0).toUpperCase() + name?.slice(1).toLowerCase() || ''
    ).filter(name => name); // Filter out any empty names

    console.log('Formatted usernames:', formattedUsernames);

    if (formattedUsernames.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No valid usernames provided'
      }, { status: 400 });
    }

    // Update the user validation query to use createdAt instead of expiresAt
    const currentTime = new Date();
    const pstDate = new Date(currentTime.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
    const startOfDay = new Date(pstDate);
    startOfDay.setHours(0, 0, 0, 0);

    // Find existing users with error handling
    let existingUsers;
    try {
      existingUsers = await User.find({
        animalName: { $in: formattedUsernames },
        createdAt: { $gte: startOfDay }
      });
      console.log('Found users:', existingUsers);
    } catch (userQueryError) {
      console.error('User query error:', userQueryError);
      return NextResponse.json({
        success: false,
        error: 'Failed to query user database'
      }, { status: 500 });
    }

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

    // Get active courts with error handling
    let activeCourts;
    try {
      activeCourts = await Court.find({ isAvailable: false })
        .populate('currentReservation');
    } catch (courtQueryError) {
      console.error('Court query error:', courtQueryError);
      return NextResponse.json({
        success: false,
        error: 'Failed to query court database'
      }, { status: 500 });
    }

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

    // For better error messages, separate invalid and active users
    const nonExistentUsers = formattedUsernames.filter(username => 
      !validUsernames.has(username)
    );
    const busyUsers = formattedUsernames.filter(username => 
      validUsernames.has(username) && activeUsers.has(username)
    );

    const response = {
      success: true,
      valid: invalidUsernames.length === 0 && busyUsers.length === 0,
      invalidUsernames,
      nonExistentUsers,
      busyUsers,
      message: invalidUsernames.length > 0 
        ? `The following users are not registered or have expired: ${invalidUsernames.join(', ')}`
        : busyUsers.length > 0
          ? `The following users are currently in active games: ${busyUsers.join(', ')}`
          : 'All users are valid'
    };

    console.log('Validation response:', response);
    return NextResponse.json(response);
  } catch (error) {
    console.error('User validation error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to validate users'
    }, { status: 500 });
  }
} 