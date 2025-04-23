const mongoose = require('mongoose');

const QuizResultSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    answers: { type: Array, required: true },
    score: { type: Number, required: true },
    diagnosis: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('QuizResult', QuizResultSchema);
