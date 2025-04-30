import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Court from '@/models/Court';

const ADMIN_PASSWORD = 'canamadmin';

export async function POST(request) {
  try {
    const { courtId, adminPassword } = await request.json();

    // Verify admin password
    if (adminPassword !== ADMIN_PASSWORD) {
      return NextResponse.json({ 
        error: 'Invalid admin password' 
      }, { status: 401 });
    }

    await dbConnect();

    // Find the court
    const court = await Court.findById(courtId);
    if (!court) {
      return NextResponse.json({ 
        error: 'Court not found' 
      }, { status: 404 });
    }

    // Toggle visibility
    court.isVisible = !court.isVisible;
    await court.save();

    return NextResponse.json({ 
      success: true,
      court: {
        _id: court._id,
        name: court.name,
        isVisible: court.isVisible
      }
    });
  } catch (error) {
    console.error('Toggle court visibility error:', error);
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 });
  }
} 