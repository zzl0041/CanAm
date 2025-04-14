# CanAm Court Reservation System

A modern web application for managing badminton court reservations at CanAm. Built with Next.js, MongoDB, and React.

## Features

### Court Management
- Real-time court status monitoring for 20 courts
- Support for both full and half court reservations
- Automatic court cleanup after 60 minutes
- Court merging capability for half-court to full-court conversion
- Real-time updates with 60-second refresh intervals

### User System
- Phone number-based registration
- Unique animal name assignment for each user
- Daily registration system (PST timezone)
- Automatic user expiration at end of day
- Active user tracking and status monitoring

### Reservation System
- Real-time court availability checking
- Conflict prevention for double bookings
- Support for single and double games
- Automatic reservation expiration after 60 minutes
- Transaction-based reservation system to prevent race conditions

### Queue Management
- Dynamic queue system for court assignments
- Support for both half and full court queuing
- Real-time queue position updates
- Automatic queue cleanup for expired entries

### Admin Features
- Protected admin panel with password authentication
- Court status management
- Manual court reset capability
- User activity monitoring
- System-wide status overview

## Technical Stack

### Frontend
- Next.js 13+ with App Router
- React for UI components
- Tailwind CSS for styling
- Real-time updates using polling

### Backend
- Next.js API Routes
- MongoDB with Mongoose ODM
- Transaction support for data integrity
- PST timezone handling

### Database Models

#### User Model
```javascript
{
  phoneNumber: String (required),
  animalName: String (required, unique for the day),
  createdAt: Date,
  expiresAt: Date (end of day PST)
}
```

#### Court Model
```javascript
{
  name: String (required),
  isAvailable: Boolean,
  currentReservation: Reference to Reservation
}
```

#### Reservation Model
```javascript
{
  courtId: Reference to Court,
  userIds: Array of usernames,
  type: String (half/full),
  option: String (merge/queue/null),
  startTime: Date,
  endTime: Date (60 minutes after start)
}
```

## Setup and Installation

1. **Prerequisites**
   - Node.js 14+
   - MongoDB instance
   - Git

2. **Environment Setup**
   ```bash
   # Clone the repository
   git clone [repository-url]
   cd court-reserve-app

   # Install dependencies
   npm install
   ```

3. **Configuration**
   Create a `.env.local` file with:
   ```
   MONGODB_URI=mongodb+srv://[username]:[password]@[cluster].mongodb.net/canam
   ```

4. **Development**
   ```bash
   npm run dev
   ```
   Access the application at `http://localhost:3000`

## API Endpoints

### Public Endpoints
- `GET /api/courts` - Get all court statuses
- `POST /api/reserve` - Make a court reservation
- `GET /api/queue` - View current queue status
- `POST /api/queue/join` - Join the queue

### Admin Endpoints
- `GET /api/admin/users` - View all users
- `POST /api/admin/reset-court` - Reset court status
- `GET /api/cron/cleanup` - Cleanup expired reservations

## Security Features
- Protected admin routes
- Transaction-based operations
- Rate limiting on API endpoints
- Validation for all user inputs
- Secure environment variable handling

## Contributing
Please read our contributing guidelines before submitting pull requests.

## Support
For technical support or feature requests, please contact the development team.

## License
[MIT License] (or your chosen license)