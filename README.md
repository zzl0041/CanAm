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
- `POST /api/register` - Register a new user with phone number
- `POST /api/reserve` - Make a court reservation
- `GET /api/queue` - View current queue status
- `POST /api/queue/join` - Join the queue
- `POST /api/merge` - Merge players into a full court game

### Admin Endpoints
- `GET /api/admin/users` - View all users (active and idle)
- `POST /api/admin/reset-court` - Reset court status and remove current reservation
  ```json
  {
    "courtId": "string",
    "adminPassword": "canamadmin"
  }
  ```
- `POST /api/admin/toggle-court-visibility` - Toggle court visibility
- `DELETE /api/reservations/:id` - Cancel a specific reservation
- `GET /api/active-users` - Get list of currently active players
- `POST /api/validate-users` - Validate list of usernames

### Request Headers
All admin endpoints require:
```
'Content-Type': 'application/json'
'x-admin-password': 'canamadmin'
```

### Response Format
All endpoints return responses in the format:
```json
{
  "success": boolean,
  "error"?: string,
  "data"?: any
}
```

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

## Queue System Tutorials

### For Clients: How to Use the Queue System

1. **Registering for Play**
   - Upon arrival, register at the front desk to receive your unique animal name
   - Your registration is valid for the entire day
   - Keep track of your assigned animal name - you'll need it for reservations

2. **Making a Reservation**
   - Check the court availability display screen
   - If courts are available:
     - Select an available court
     - Enter your animal name(s)
     - Choose half court (2 players) or full court (4 players)
   - If no courts are available:
     - Your group will be automatically added to the queue
     - The system will display your position in the queue

3. **Queue Position and Notifications**
   - Monitor your position in the queue on the display screen
   - When it's your turn:
     - Your animal names will be displayed
     - You have 2 minutes to claim your court
     - If you don't claim your court, you'll lose your spot

4. **Playing Time**
   - Each session is 30 minutes
   - A timer will show your remaining time
   - When your time is up, please finish your game promptly

5. **Tips**
   - Stay near the courts when you're in the top 3 positions
   - Keep your phone handy - staff may call out animal names
   - If you need to leave the queue, inform the front desk

### For Front Desk Staff: Managing the Queue System

1. **User Registration Process**
   - Access the admin panel using your provided password
   - For new players:
     - Click "Register New User"
     - Enter their phone number
     - The system will generate a unique animal name
     - Inform the player of their animal name
   - Animal names reset daily at midnight PST

2. **Queue Management**
   - Monitor the queue status in the admin panel
   - The system automatically:
     - Updates court availability
     - Manages queue positions
     - Tracks playing time
     - Handles court assignments

3. **Court Control**
   - To reset a court manually:
     - Find the court in the admin panel
     - Click "Reset Court" if players have finished early
     - Confirm the action
   - To merge half courts:
     - Select the occupied half court
     - Click "Merge Into Full Court"
     - Enter the new players' animal names

4. **Common Scenarios and Solutions**

   a) **Players Miss Their Turn**
      - Wait 2 minutes for players to claim their court
      - Use the "Skip" function in the queue
      - The group moves to the end of the queue

   b) **Early Court Reset**
      - Verify players have finished
      - Use "Reset Court" in the admin panel
      - The next group in queue gets automatically assigned

   c) **Queue Disputes**
      - Check the queue history in the admin panel
      - Verify animal names and registration times
      - Use the "Queue Log" for reference

5. **System Maintenance**
   - The system automatically:
     - Cleans up expired sessions
     - Removes inactive users
     - Updates court status
   - For technical issues:
     - Check the system status page
     - Contact technical support if needed

6. **Best Practices**
   - Regularly monitor the queue display
   - Announce animal names clearly
   - Keep the admin panel open for quick access
   - Help players understand their queue position
   - Document any unusual incidents

7. **Emergency Procedures**
   - If the system is down:
     - Switch to manual queue management
     - Record player names and times
     - Contact technical support
     - Keep players informed

Remember: The queue system is designed to ensure fair play time for all players. Consistent application of these procedures helps maintain an organized and enjoyable environment for everyone.