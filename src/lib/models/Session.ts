import mongoose from 'mongoose';

const SessionSchema = new mongoose.Schema({
  location_id: { type: String, required: true },
  queue_entry_id: { type: mongoose.Schema.Types.ObjectId, required: true },
  start_time: { type: Date, required: true },
  end_time: { type: Date },
  status: { type: String, enum: ['active', 'completed'], default: 'active' },
});

export default mongoose.models.Session || mongoose.model('Session', SessionSchema);
