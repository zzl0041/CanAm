CanAm Badminton Court Reservation System - Functionality Documentation

## Frontend Logic

### Court Management

1. **Court Display**
   - Courts are displayed in a responsive grid layout
   - Each court card shows:
     - Court number
     - Availability status
     - Current players (if occupied)
     - Time remaining (if occupied)
     - Reservation/merge options

2. **Reservation Flow**
   - User clicks "Reserve Court" on an available court
   - Modal opens with options:
     - Half court (2 players)
     - Full court (4 players)
   - User enters animal names for all players
   - System validates:
     - All names exist in system
     - No players are currently in other games
     - Correct number of players selected

3. **Merge Logic**
   - Only available for half courts
   - Shows current players on the court
   - Allows adding 2 more players
   - Validates new players
   - Converts reservation to full court

4. **Auto-Refresh**
   - Courts status updates every 60 seconds
   - Updates paused when modals are open
   - Manual refresh available
   - Queue positions update in real-time

### User Registration

1. **Registration Process**
   - User provides phone number
   - System generates unique animal name
   - Name valid for entire day
   - Phone numbers stored with PST timezone

2. **Validation Rules**
   - Phone numbers must be valid format
   - One registration per phone number per day
   - Animal names are unique within the day
   - Names reset at midnight PST

### Queue Management

1. **Queue Display**
   - Shows current position
   - Estimated wait time
   - Number of groups waiting
   - Type of court requested (half/full)

2. **Queue Logic**
   - Automatic queue entry when no courts available
   - Priority based on:
     - Time in queue
     - Court type requested
     - Group size

## Backend Logic

### Court Management

1. **Court State**
   - Properties:
     - Court ID
     - Name
     - Availability status
     - Visibility status
     - Current reservation (if any)

2. **Reservation Properties**
   - Court ID
   - User IDs array
   - Type (half/full)
   - Option (merge/queue/null)
   - Start time
   - End time

3. **Auto-Cleanup Process**
   - Checks every minute for expired games
   - Game expires after 30 minutes
   - Court automatically freed
   - Players removed from active list

### User Management

1. **User Properties**
   - Phone number
   - Animal name
   - Creation timestamp
   - Expiration timestamp

2. **Active User Tracking**
   - Currently playing users list
   - Tracks:
     - Court assignment
     - Start time
     - Game type
     - Partners

3. **Daily Reset Process**
   - Runs at midnight PST
   - Clears all user registrations
   - Resets animal name assignments
   - Maintains historical data

### Queue System

1. **Queue Entry Properties**
   - User IDs array
   - Type (half/full)
   - Join timestamp
   - Status (waiting/assigned/expired)

2. **Court Assignment Logic**
   - Priority queue based on join time
   - Matches court type to request
   - Handles court merging requests
   - Manages court transitions

### API Endpoints

1. **Court Visibility Toggle**
   ```
   POST /api/admin/toggle-court-visibility
   
   Request Headers:
   {
     'Content-Type': 'application/json',
     'x-admin-password': 'canamadmin'
   }

   Request Body:
   {
     "courtId": "string" // MongoDB ObjectId
   }

   Response:
   {
     "success": boolean,
     "court": {
       "_id": string,
       "name": string,
       "isVisible": boolean,
       "isAvailable": boolean,
       "currentReservation": object | null
     }
   }
   ```

### System Requirements

1. **User Expiration**
   - Users expire at 12:00 AM PDT daily
   - System automatically removes expired users
   - Maintains data consistency after cleanup

2. **Reservation Cleanup**
   - Reservations expire after 30 minutes
   - Automatic court status updates
   - Queue position updates
   - Player status updates

## Security Implementation

1. **Admin Authentication**
   - Password-protected admin routes
   - Required headers:
     ```
     {
       'x-admin-password': 'canamadmin',
       'Content-Type': 'application/json'
     }
     ```

2. **Rate Limiting**
   - API request limits
   - Concurrent connection limits
   - IP-based restrictions

3. **Data Validation**
   - Input sanitization
   - Type checking
   - Format validation
   - Cross-reference verification

## TODOs and Upcoming Implementations

### Priority Tasks

1. **User Management**
   - [ ] Implement PDT timezone handling for user expiration
   - [ ] Add user expiration status to admin panel
   - [ ] Create cleanup job for expired users
   - [ ] Add logging for user cleanup operations

2. **Reservation System**
   - [ ] Add automatic cleanup for expired reservations
   - [ ] Implement reservation history tracking
   - [ ] Add notification system for expiring reservations
   - [ ] Create admin override for reservation extension

3. **Court Management**
   - [ ] Implement court visibility toggle in admin panel
   - [ ] Add court status history
   - [ ] Create court maintenance schedule system
   - [ ] Implement court blocking for maintenance

4. **System Improvements**
   - [ ] Add comprehensive logging system
   - [ ] Implement backup and recovery procedures
   - [ ] Create system status dashboard
   - [ ] Add performance monitoring tools

### Testing Requirements

1. **User Expiration Tests**
   - [ ] Test user expiration at midnight PDT
   - [ ] Verify cleanup of expired users
   - [ ] Test timezone handling
   - [ ] Validate user session handling

2. **Reservation Tests**
   - [ ] Test automatic cleanup after 30 minutes
   - [ ] Verify court status updates
   - [ ] Test concurrent reservation handling
   - [ ] Validate queue system updates

3. **Court Visibility Tests**
   - [ ] Test visibility toggle functionality
   - [ ] Verify admin-only access
   - [ ] Test impact on active reservations
   - [ ] Validate frontend updates 