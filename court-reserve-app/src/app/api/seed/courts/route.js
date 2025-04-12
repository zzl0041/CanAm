import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Court from '@/models/Court';

export async function GET() {
  try {
    await dbConnect();
    
    // Clear existing courts
    await Court.deleteMany({});
    
    // Create 20 courts
    const courtsToCreate = Array.from({ length: 20 }, (_, index) => ({
      name: `Court ${index + 1}`,
      type: index % 2 === 0 ? 'singles' : 'doubles',
      isAvailable: true,
    }));
    
    const courts = await Court.create(courtsToCreate);
    
    return NextResponse.json({
      success: true,
      message: 'Courts seeded successfully',
      count: courts.length,
      courts: courts
    });
  } catch (error) {
    console.error('Seeding error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
} 