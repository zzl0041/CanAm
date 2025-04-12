import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Court from '@/models/Court';

export async function GET() {
  try {
    await dbConnect();
    
    // Clear existing courts
    await Court.deleteMany({});
    
    // Create 20 sample courts
    const courts = [];
    for (let i = 1; i <= 20; i++) {
      courts.push({
        name: `Court ${i}`,
        type: i % 2 === 0 ? 'doubles' : 'singles', // alternate between singles and doubles
        isAvailable: true,
      });
    }
    
    const createdCourts = await Court.create(courts);
    
    return NextResponse.json({ 
      message: 'Courts seeded successfully!', 
      count: createdCourts.length,
      courts: createdCourts 
    });
  } catch (error) {
    console.error('Seeding error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 