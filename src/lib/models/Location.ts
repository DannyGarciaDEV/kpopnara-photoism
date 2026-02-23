import mongoose from 'mongoose';

const LocationSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  city: { type: String, required: true },
  is_active: { type: Boolean, default: true },
});

export default mongoose.models.Location || mongoose.model('Location', LocationSchema);
