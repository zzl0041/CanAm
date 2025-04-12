import CourtList from '../components/CourtList';
import QueueList from '../components/QueueList';
import { useState } from 'react';

export default function Reservations() {
  const [currentUser] = useState('UserPhone'); // Replace with actual user session data

  return (
    <div className="container mx-auto">
      <h1 className="text-xl font-bold">Reserve a Court</h1>
      <CourtList currentUser={currentUser} />
      <QueueList currentUser={currentUser} />
    </div>
  );
}
