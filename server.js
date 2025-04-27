

// === server.js ===
require('dotenv').config();

const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const path = require('path');
const connectDB = require('./config/database'); // Use centralized connection

const User = require('./models/User');
const QuizResult = require('./models/QuizResult');
const Mood = require('./models/Mood');
const Journal = require('./models/Journal');

const app = express();

// ✅ Connect to MongoDB
connectDB();

// ✅ Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');

// ✅ Session Setup
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: false
}));

// ✅ Routes Start

app.get('/', (req, res) => res.render('index'));

// Register
app.get('/register', (req, res) => res.render('register'));
app.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });

    if (existingUser) return res.send("Email already registered. Please login.");

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword, hasCompletedQuiz: false });

    await newUser.save();
    req.session.userId = newUser._id;

    return res.redirect('/quiz');
});

// Login
app.get('/login', (req, res) => res.render('login'));
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.send("User not found. Please register.");

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.send("Incorrect password. Try again.");

    req.session.userId = user._id;
    return res.redirect('/dashboard');
});

// Logout
app.get('/logout', (req, res) => {
    req.session.destroy(() => res.redirect('/'));
});

// Quiz
app.get('/quiz', async (req, res) => {
    if (!req.session.userId) return res.redirect('/login');

    const user = await User.findById(req.session.userId);
    if (user.hasCompletedQuiz) return res.redirect('/dashboard');

    res.render('quiz');
});

app.post('/submit-quiz', async (req, res) => {
    if (!req.session.userId) return res.redirect('/login');

    try {
        const { answers } = req.body;
        if (!answers || !Array.isArray(answers)) {
            return res.status(400).send("Error: No answers received.");
        }

        let totalScore = answers.reduce((sum, value) => sum + parseInt(value), 0);

        let diagnosis = totalScore <= 5 ? "No significant issues." :
                        totalScore <= 10 ? "Mild anxiety/stress." :
                        totalScore <= 15 ? "Moderate mental health concerns." :
                        "High risk of anxiety/depression.";

        const quizResult = new QuizResult({ userId: req.session.userId, answers, score: totalScore, diagnosis });
        await quizResult.save();

        return res.redirect('/dashboard');
    } catch (error) {
        console.error("❌ Quiz Submission Error:", error);
        return res.status(500).send("Internal Server Error");
    }
});

// Dashboard
app.get('/dashboard', async (req, res) => {
    if (!req.session.userId) return res.redirect('/login');

    const user = await User.findById(req.session.userId);
    const quizResult = await QuizResult.findOne({ userId: req.session.userId }).sort({ createdAt: -1 }).lean() || null;
    const latestMood = await Mood.findOne({ userId: req.session.userId }).sort({ date: -1 }).lean() || null;

    res.render('dashboard', { user, quizResult, latestMood });
});

// Mood Tracker
app.get('/mood-tracker', async (req, res) => {
    if (!req.session.userId) return res.redirect('/login');
    const moods = await Mood.find({ userId: req.session.userId }).sort({ date: -1 });
    res.render('mood-tracker', { moods });
});

app.post('/mood-tracker', async (req, res) => {
    if (!req.session.userId) return res.redirect('/login');
    const { mood, note } = req.body;
    const user = await User.findById(req.session.userId);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingMood = await Mood.findOne({
        userId: user._id,
        date: { $gte: today }
    });

    if (existingMood) return res.send("You have already logged your mood today!");

    if (user.lastMoodDate) {
        const lastMoodDate = new Date(user.lastMoodDate);
        lastMoodDate.setHours(0, 0, 0, 0);
        const diffDays = Math.floor((today - lastMoodDate) / (1000 * 60 * 60 * 24));
        user.streakCount = (diffDays === 1) ? user.streakCount + 1 : 1;
    } else {
        user.streakCount = 1;
    }

    user.lastMoodDate = today;
    await user.save();

    const newMood = new Mood({ userId: user._id, mood, note, date: today });
    await newMood.save();

    return res.redirect('/mood-tracker');
});

// Meditation, Selfcare, Journal, Resources, Food & Diet, Books, Music, About Us pages
// (Code for these pages remains unchanged)

// ✅ Server Startup
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
