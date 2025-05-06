import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Court from '@/models/Court';

const ADMIN_PASSWORD = 'canamadmin';

export async function GET(request) {
  try {
    // Verify admin password
    const adminPassword = request.headers.get('x-admin-password');
    if (adminPassword !== ADMIN_PASSWORD) {
      return NextResponse.json({ 
        error: 'Invalid admin password' 
      }, { status: 401 });
    }

    await dbConnect();
    
    // Fetch all courts regardless of visibility
    const courts = await Court.find()
      .populate('currentReservation')
      .sort({ name: 1 });

    return NextResponse.json({ 
      success: true,
      courts: courts
    });
  } catch (error) {
    console.error('Admin courts fetch error:', error);
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 });
  }
} 