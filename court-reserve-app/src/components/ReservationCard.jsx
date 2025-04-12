import { cancelReservation } from '../utils/api';

export default function ReservationCard({ reservation, onCancelled }) {
  const handleCancel = async () => {
    await cancelReservation(reservation.id);
    onCancelled();
  };

  return (
    <div className="border p-3 rounded my-2">
      <p>Court: {reservation.courtId}</p>
      <p>Type: {reservation.type}</p>
      <button onClick={handleCancel} className="bg-red-500 text-white py-1 px-3 rounded mt-2">
        Cancel Reservation
      </button>
    </div>
  );
}
