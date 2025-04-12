import { useEffect, useState } from 'react';
import { fetchQueue, joinQueue } from '../utils/api';

export default function QueueList({ currentUser }) {
  const [queue, setQueue] = useState([]);

  useEffect(() => {
    loadQueue();
  }, []);

  const loadQueue = async () => {
    const res = await fetchQueue();
    setQueue(res.data);
  };

  const handleJoinQueue = async (type) => {
    await joinQueue([currentUser], type);
    loadQueue();
  };

  return (
    <div>
      <button
        onClick={() => handleJoinQueue('half')}
        className="bg-yellow-500 text-white py-2 px-4 rounded mr-2"
      >
        Queue for Half
      </button>
      <button
        onClick={() => handleJoinQueue('full')}
        className="bg-purple-500 text-white py-2 px-4 rounded"
      >
        Queue for Full
      </button>

      <div className="mt-4">
        {queue.map((entry) => (
          <div key={entry.id} className="border p-2 rounded my-1">
            {entry.userIds.join(', ')} - Waiting for {entry.type} court
          </div>
        ))}
      </div>
    </div>
  );
}
