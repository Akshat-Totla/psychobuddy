// routes/auth.js
const express = require('express');
const bcryptjs = require('bcryptjs');
const User = require('../models/User');
const router = express.Router();

// Show login & register pages
router.get('/login', (req, res) => res.render('login'));
router.get('/register', (req, res) => res.render('register'));

// Register User
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    let existingUser = await User.findOne({ email });
    if (existingUser) return res.send('Email already registered. Please login.');

    const newUser = new User({ name, email, password }); // No manual hashing
    await newUser.save();

    req.session.userId = newUser._id;
    res.redirect('/quiz');
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// Login User
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.send("Invalid email or password.");

    const isMatch = await bcryptjs.compare(password, user.password);
    if (!isMatch) return res.send("Invalid email or password.");

    req.session.userId = user._id; // Keep it simple
    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// Logout User
router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

module.exports = router;
