const mongoose = require('mongoose');

const MoodSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    mood: { type: String, required: true },
    note: { type: String },
    date: { type: Date, default: Date.now, unique: false }  // Ensures each entry has a timestamp
});

// 🔥 Index to optimize queries & sort moods by date
MoodSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model('Mood', MoodSchema);
