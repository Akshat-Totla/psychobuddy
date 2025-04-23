const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const router = express.Router();

// Register User
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        let user = await User.findOne({ email });
        if (user) return res.send('User already exists!');

        user = new User({ name, email, password });
        await user.save();
        res.redirect('/login');
    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
});

// Login User
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        let user = await User.findOne({ email });
        if (!user) return res.send("User not found!");

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.send("Invalid credentials!");

        req.session.user = user;
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
