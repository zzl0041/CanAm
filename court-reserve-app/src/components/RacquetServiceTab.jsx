"use client";

import { useState } from 'react';

// Simple client-side ID generation (for frontend-only use)
const generateSimpleId = () => {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export default function RacquetServiceTab() {
  const [requests, setRequests] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    stringType: '',
    tension: '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleAddRequest = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.stringType || !formData.tension) {
      alert('Please fill in all fields');
      return;
    }
    const newRequest = {
      id: generateSimpleId(), // Use simple ID generation
      name: formData.name,
      stringType: formData.stringType,
      tension: formData.tension,
      status: 'Not Ready',
    };
    setRequests([...requests, newRequest]);
    setFormData({ name: '', stringType: '', tension: '' }); // Clear form
  };

  const handleChangeStatus = (id) => {
    setRequests(requests.map(request => 
      request.id === id 
        ? { ...request, status: request.status === 'Not Ready' ? 'Ready' : 'Not Ready' }
        : request
    ));
  };

  const handleDeleteRequest = (id) => {
    setRequests(requests.filter(request => request.id !== id));
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Racquet Service Requests</h2>

      {/* Add New Request Form */}
      <form onSubmit={handleAddRequest} className="mb-6 p-4 border rounded-md space-y-4">
        <h3 className="text-lg font-medium">Add New Request</h3>
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
          <input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required />
        </div>
        <div>
          <label htmlFor="stringType" className="block text-sm font-medium text-gray-700">String Type</label>
          <input type="text" id="stringType" name="stringType" value={formData.stringType} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required />
        </div>
        <div>
          <label htmlFor="tension" className="block text-sm font-medium text-gray-700">Tension (lbs)</label>
          <input type="text" id="tension" name="tension" value={formData.tension} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required />
        </div>
        <button type="submit" className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600">Add Request</button>
      </form>

      {/* Requests List */}
      <div>
        <h3 className="text-lg font-medium mb-4">Open Requests ({requests.filter(req => req.status === 'Not Ready').length})</h3>
        <ul className="divide-y divide-gray-200">
          {requests.map(request => (
            <li key={request.id} className="py-4 flex items-center justify-between">
              <div>
                <p className="text-gray-900 font-semibold">{request.name}</p>
                <p className="text-gray-600 text-sm">{request.stringType} at {request.tension} lbs</p>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${request.status === 'Ready' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                  {request.status}
                </span>
              </div>
              <div className="flex space-x-2">
                <button onClick={() => handleChangeStatus(request.id)} className={`py-1 px-3 rounded text-sm ${request.status === 'Ready' ? 'bg-yellow-500 hover:bg-yellow-600 text-white' : 'bg-green-500 hover:bg-green-600 text-white'}`}>
                  {request.status === 'Ready' ? 'Mark Not Ready' : 'Mark Ready'}
                </button>
                <button onClick={() => handleDeleteRequest(request.id)} className="py-1 px-3 rounded text-sm bg-red-500 text-white hover:bg-red-600">
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
        {requests.length === 0 && (
          <p className="text-center text-gray-500">No racquet service requests yet.</p>
        )}
      </div>
    </div>
  );
} 