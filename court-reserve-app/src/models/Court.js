import mongoose from 'mongoose';

const CourtSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
  currentReservation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reservation',
    default: null
  }
});

// Drop existing model if it exists to ensure schema updates
if (mongoose.models.Court) {
  delete mongoose.models.Court;
}

export default mongoose.model('Court', CourtSchema); 