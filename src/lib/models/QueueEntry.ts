import mongoose from 'mongoose';

const QueueEntrySchema = new mongoose.Schema({
  location_id: { type: String, required: true },
  name: { type: String, required: true },
  pronouns: { type: String },
  phone: { type: String }, // optional - not collected
  status: { type: String, enum: ['waiting', 'notified', 'active', 'done', 'no_show'], default: 'waiting' },
  position: { type: Number, required: true },
  notified_at: { type: Date },
  created_at: { type: Date, default: Date.now },
});

// Avoid using cached model with old schema (e.g. when phone was required)
if (mongoose.models.QueueEntry) {
  mongoose.deleteModel('QueueEntry');
}

export default mongoose.model('QueueEntry', QueueEntrySchema);
