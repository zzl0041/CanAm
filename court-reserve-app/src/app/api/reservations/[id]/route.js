import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Reservation from '@/models/Reservation';
import Court from '@/models/Court';

export async function DELETE(request, { params }) {
  try {
    await dbConnect();
    const reservation = await Reservation.findById(params.id);
    if (!reservation) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
    }
    
    // Make court available again
    await Court.findByIdAndUpdate(reservation.courtId, { isAvailable: true });
    
    await reservation.delete();
    return NextResponse.json({ message: 'Reservation cancelled successfully' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 