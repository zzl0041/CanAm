import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Court from '@/models/Court';
import mongoose from 'mongoose';

export async function GET() {
  try {
    await dbConnect();

    // Start a session for consistent reads
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Get current date in PST
      const now = new Date();
      const pstDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
      const startOfDay = new Date(pstDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(pstDate);
      endOfDay.setHours(23, 59, 59, 999);

      // Get all active courts with their reservations
      const activeCourts = await Court.find({ 
        isAvailable: false 
      })
      .populate('currentReservation')
      .session(session);

      // Get all users registered today
      const allUsers = await User.find({
        createdAt: {
          $gte: startOfDay,
          $lte: endOfDay
        }
      }).session(session);

      console.log('Found users for today:', allUsers.length);

      // Create a map of active users with their court information
      const activeUsers = [];
      const activeUserSet = new Set();

      // Process active courts
      activeCourts.forEach(court => {
        if (court.currentReservation && court.currentReservation.userIds) {
          // Check if the game is still within 60 minutes
          const startTime = new Date(court.currentReservation.startTime);
          const timeDifferenceMinutes = (now - startTime) / (1000 * 60);
          
          if (timeDifferenceMinutes < 60) {
            court.currentReservation.userIds.forEach(userId => {
              activeUsers.push({
                username: userId,
                courtNumber: parseInt(court.name.replace('Court ', '')),
                startTime: court.currentReservation.startTime
              });
              activeUserSet.add(userId);
            });
          }
        }
      });

      // Filter out active users to get idle users
      const idleUsers = allUsers.filter(user => !activeUserSet.has(user.animalName));

      console.log('Active users:', activeUsers.length);
      console.log('Idle users:', idleUsers.length);

      const response = {
        success: true,
        activeUsers,
        idleUsers: idleUsers.map(user => ({
          animalName: user.animalName,
          phoneNumber: user.phoneNumber,
          createdAt: user.createdAt
        }))
      };

      // Commit the transaction
      await session.commitTransaction();
      return NextResponse.json(response);
    } catch (error) {
      // Rollback the transaction on error
      await session.abortTransaction();
      throw error;
    } finally {
      // End the session
      session.endSession();
    }
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 });
  }
} 