import mongoose from 'mongoose';

const StaffUserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password_hash: { type: String, required: true },
  location_id: { type: String, required: true },
});

export default mongoose.models.StaffUser || mongoose.model('StaffUser', StaffUserSchema);
