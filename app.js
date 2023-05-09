require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('./db');

// Add session middleware
const session = require('express-session');
const app = express();
const User = require('./models/user');
const saltRounds = 10;
const secret = process.env.JWT_SECRET;

// Middleware
app.use(express.json());
app.use(cors({ origin: 'http://localhost:5173' }));

// Add session configuration
const sess = {
  secret: 'keyboard cat',
  cookie: {}
};

// Use session middleware
app.use(session(sess));

const port = process.env.PORT;
mongoose.connect(process.env.MONGODBURI);

// GET /users ⇒ return all users
app.get('/users', async (req, res) => {
  try {
    const users = await User.find({});
    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Failed to get users' });
  }
});

// GET /users/:id ⇒ return a single user
app.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(404).json({ error: 'User not found' });
  }
});

// POST /users ⇒ create a new user
app.post('/users', async (req, res) => {
  if (!req.body.username || !req.body.password) {
    return res.status(400).json({ error: 'Missing username or password' });
  }
  try {
    const hash = await bcrypt.hash(req.body.password, saltRounds);
    const newUser = new User({ username: req.body.username, password: hash });
    const user = await newUser.save();
    const token = jwt.sign({ id: user._id }, secret);
    res.cookie('token', token, { httpOnly: true });
    res.status(201).json(user);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Failed to create user' });
  }
});

// PUT /users/:id ⇒ update a specific user
app.put('/users/:id', async (req, res) => {
  if (!req.body.username || !req.body.password) {
    return res.status(400).json({ error: 'Missing username or password' });
  }
  try {
    const hash = await bcrypt.hash(req.body.password, saltRounds);
    const user = await User.findByIdAndUpdate(req.params.id, {
      username: req.body.username,
      password: hash,
    });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(404).json({ error: 'User not found' });
  }
});

// DELETE /users/:id ⇒ delete a specific user
app.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.continue('/login')
      .status(404)
      .json({ error: 'User not found' });
      }
      res.status(200).json(user);
      } catch (error) {
      console.error(error);
      res.status(404).json({ error: 'User not found' });
      }
      });

// POST /login ⇒ login and return
app.post('/login', async (req, res) => {
    try {
    const user = await User.findOne({ username: req.body.username });
    if (!user) {
    return res.status(401).json({ error: 'Invalid username or password' });
    }
    const match = await bcrypt.compare(req.body.password, user.password);
    if (!match) {
    return res.status(401).json({ error: 'Invalid username or password' });
    }
    const token = jwt.sign({ id: user._id }, secret);
    req.session.user = user; // Store the user in the session
    res.cookie('token', token, { httpOnly: true });
    res.status(200).json({ message: 'Logged in successfully', token });
    } catch (error) {
    console.error(error);
    res.status(401).json({ error: 'Invalid username or password' });
    }
});

// POST /signup ⇒ create a new user
app.post('/signup', async (req, res) => {
    const { username, password } = req.body;
    
    try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
    return res.status(400).send('Username already exists');
    }

    const hash = await bcrypt.hash(password, saltRounds);
    
    const user = await User.create({ username, password: hash.toString() });
    if (!user) {
      return res.status(500).send('Failed to create user');
    }
    
    const token = jwt.sign({ id: user._id }, secret);
    req.session.user = user; // Store the user in the session
    res.cookie('token', token, { httpOnly: true });
    res.status(201).json(user);
    } catch (error) {
    console.log(error);
    res.status(500).send('Internal server error');
    }
});

// GET /logout ⇒ logout and clear JWT cookie
app.get('/logout', (req, res) => {
    req.session.destroy(); // Destroy the session
    res.clearCookie('token');
    res.status(200).json({ message: 'Logged out successfully' });
  });
  

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});