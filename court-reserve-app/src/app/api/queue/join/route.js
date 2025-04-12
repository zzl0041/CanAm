import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Queue from '@/models/Queue';

export async function POST(request) {
  try {
    await dbConnect();
    const { userIds, type } = await request.json();
    
    // Check if users are already in queue
    const existingQueue = await Queue.findOne({
      userIds: { $in: userIds }
    });
    
    if (existingQueue) {
      return NextResponse.json({ error: 'One or more users already in queue' }, { status: 400 });
    }
    
    const queueEntry = await Queue.create({
      userIds,
      type,
    });
    
    return NextResponse.json({ queueEntry });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 