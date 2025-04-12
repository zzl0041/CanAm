# CanAm Court Reservation System

A modern web application for managing badminton court reservations at CanAm. Built with Next.js, MongoDB, and React.

## Features

- **Public Court Status View**: Anyone can view the current status of courts and queue without registration
- **User Registration**: 
  - Simple phone number registration
  - Unique animal name automatically assigned to each user
  - Registration valid for the current day (PST timezone)
  - Phone number format validation

- **Court Management**:
  - Real-time court availability status
  - Support for both full and half court reservations
  - Queue system for court reservations
  - Automatic court status updates

- **Queue System**:
  - Displays current queue sorted by waiting time and court number
  - Shows position number, court number, game type, and waiting time
  - Auto-refreshes every 30 seconds

## Technology Stack

- **Frontend**:
  - Next.js 13+
  - React
  - Tailwind CSS for styling

- **Backend**:
  - Next.js API Routes
  - MongoDB for database
  - Mongoose for data modeling

- **Authentication**:
  - Phone number based registration
  - Daily registration system

## Getting Started

1. **Prerequisites**:
   - Node.js 14+ installed
   - MongoDB instance
   - Git

2. **Installation**:
   ```bash
   # Clone the repository
   git clone [repository-url]
   cd court-reserve-app

   # Install dependencies
   npm install

   # Set up environment variables
   cp .env.example .env.local
   ```

3. **Environment Variables**:
   Create a `.env.local` file with:
   ```
   MONGODB_URI=your_mongodb_connection_string
   ```

4. **Run the Development Server**:
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:3000`

## Database Schema

### User Model
- `phoneNumber`: String (required)
- `animalName`: String (required)
- `createdAt`: Date
- `expiresAt`: Date

### Court Model
- `name`: String
- `isAvailable`: Boolean
- `currentReservation`: Reference to Reservation

### Reservation Model
- `courtId`: Reference to Court
- `userIds`: Array of user IDs
- `type`: String (half/full)
- `startTime`: Date
- `endTime`: Date

## Features in Detail

### Registration System
- Users register with a phone number
- System assigns a unique animal name
- Registration valid until end of day (PST)
- Automatic cleanup of expired registrations

### Court Management
- Real-time court status updates
- Support for different game types
- Queue management for busy periods
- Automatic expiration of reservations

## Contributing

Please read our contributing guidelines before submitting pull requests.

## License

[Your chosen license]

## Support

For support, please contact [contact information]