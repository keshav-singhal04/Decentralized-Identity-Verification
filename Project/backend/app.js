// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/identity_verification')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  documentId: { type: String, required: true },
  documentType: { type: Number, required: true },
  identityHash: { type: String, required: true, unique: true },
  walletAddress: { type: String, required: true },
  registrationDate: { type: Date, default: Date.now },
  isVerified: { type: Boolean, default: false },
  verifierAddress: String,
  verificationDate: Date
});

const User = mongoose.model('User', userSchema);

// Routes

// GET: Fetch pending registrations (not verified)
app.get('/api/pending-registrations', async (req, res) => {
  try {
    const pendingUsers = await User.find({ isVerified: false })
      .sort({ registrationDate: -1 });
    res.json(pendingUsers);
  } catch (error) {
    console.error('Error fetching pending registrations:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET: Fetch verified users
app.get('/api/verified-users', async (req, res) => {
  try {
    const verifiedUsers = await User.find({ isVerified: true })
      .sort({ verificationDate: -1 });
    res.json(verifiedUsers);
  } catch (error) {
    console.error('Error fetching verified users:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST: Register new user
app.post('/api/register-user', async (req, res) => {
  try {
    const { name, documentId, documentType, identityHash, walletAddress } = req.body;
    
    // Check if already exists
    const existingUser = await User.findOne({ identityHash });
    if (existingUser) {
      return res.status(400).json({ error: 'Identity already registered' });
    }
    
    const user = new User({
      name,
      documentId,
      documentType,
      identityHash,
      walletAddress
    });
    console.log(user)
    await user.save();
    res.status(201).json({ success: true, message: 'User registered successfully' });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST: Update verification status
app.post('/api/update-verification-status', async (req, res) => {
  try {
    const { userId, verifierAddress } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    user.isVerified = true;
    user.verifierAddress = verifierAddress;
    user.verificationDate = new Date();
    
    await user.save();
    console.log(user)
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating verification status:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
