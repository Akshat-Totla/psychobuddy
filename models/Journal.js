const mongoose = require("mongoose");

const journalSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    mood: { type: String, enum: ["Happy", "Sad", "Excited", "Anxious", "Neutral"], required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Journal", journalSchema);
