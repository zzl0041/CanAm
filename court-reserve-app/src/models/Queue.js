import mongoose from 'mongoose';

const QueueSchema = new mongoose.Schema({
  userIds: [{
    type: String,  // phone numbers
    required: true,
  }],
  type: {
    type: String,
    enum: ['singles', 'doubles'],
    required: true,
  },
  courtNumber: {
    type: Number,
    required: true,
    min: 1,
    max: 20
  },
  joinedAt: {
    type: Date,
    default: Date.now,
    required: true
  },
});

// Add virtual for waiting time
QueueSchema.virtual('waitingTime').get(function() {
  return Date.now() - this.joinedAt.getTime();
});

// Ensure virtuals are included when converting to JSON
QueueSchema.set('toJSON', { virtuals: true });

// Index for efficient sorting
QueueSchema.index({ joinedAt: 1, courtNumber: -1 });

export default mongoose.models.Queue || mongoose.model('Queue', QueueSchema); 