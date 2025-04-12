import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Court from '@/models/Court';

export async function GET() {
  try {
    await dbConnect();

    // Get current date in PST
    const now = new Date();
    const pstDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
    const startOfDay = new Date(pstDate);
    startOfDay.setHours(0, 0, 0, 0);

    // Get all active courts with their reservations
    const activeCourts = await Court.find({ isAvailable: false })
      .populate('currentReservation');

    // Get all users registered today
    const allUsers = await User.find({
      createdAt: { $gte: startOfDay }
    });

    // Create a map of active users with their court information
    const activeUsers = [];
    const activeUserSet = new Set();

    activeCourts.forEach(court => {
      if (court.currentReservation && court.currentReservation.userIds) {
        court.currentReservation.userIds.forEach(userId => {
          activeUsers.push({
            username: userId,
            courtNumber: parseInt(court.name.replace('Court ', '')),
            startTime: court.currentReservation.startTime
          });
          activeUserSet.add(userId);
        });
      }
    });

    // Filter out active users to get idle users
    const idleUsers = allUsers.filter(user => !activeUserSet.has(user.animalName));

    return NextResponse.json({
      success: true,
      activeUsers,
      idleUsers: idleUsers.map(user => ({
        animalName: user.animalName,
        phoneNumber: user.phoneNumber,
        createdAt: user.createdAt
      }))
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 });
  }
} 