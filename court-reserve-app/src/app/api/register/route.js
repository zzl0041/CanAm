import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { getUniqueAnimalName } from '@/utils/animals';
import { validatePhoneNumber } from '@/utils/validation';

export async function POST(request) {
  console.log('Register API called');
  
  try {
    const body = await request.json();
    console.log('Request body:', body);

    if (!body.phoneNumber) {
      return NextResponse.json({ 
        success: false, 
        error: 'Phone number is required' 
      }, { status: 400 });
    }

    // Validate phone number
    const validation = validatePhoneNumber(body.phoneNumber);
    if (!validation.isValid) {
      return NextResponse.json({ 
        success: false, 
        error: validation.error 
      }, { status: 400 });
    }

    await dbConnect();
    const cleanedPhone = validation.cleaned;

    // Get current date in PST
    const now = new Date();
    const pstDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
    const startOfDay = new Date(pstDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    try {
      // Check if user already exists and registered today
      let user = await User.findOne({ 
        phoneNumber: cleanedPhone,
        createdAt: { $gte: startOfDay }
      });
      
      if (user) {
        console.log('Existing user found:', user);
        return NextResponse.json({ 
          success: true,
          user: {
            phoneNumber: user.phoneNumber,
            animalName: user.animalName,
            createdAt: user.createdAt
          },
          isExisting: true
        });
      }

      // Delete any old registrations for this phone number
      await User.deleteMany({ 
        phoneNumber: cleanedPhone,
        createdAt: { $lt: startOfDay }
      });

      // Get a unique animal name
      const animalName = await getUniqueAnimalName(User);

      // Create new user
      user = await User.create({
        phoneNumber: cleanedPhone,
        animalName,
        createdAt: now
      });

      console.log('Created new user:', user);

      return NextResponse.json({
        success: true,
        user: {
          phoneNumber: user.phoneNumber,
          animalName: user.animalName,
          createdAt: user.createdAt
        },
        isExisting: false
      });

    } catch (error) {
      console.error('Database operation error:', error);
      return NextResponse.json({ 
        success: false, 
        error: `Database operation failed: ${error.message}` 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ 
      success: false,
      error: `Registration failed: ${error.message}` 
    }, { status: 500 });
  }
} 