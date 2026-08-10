// Mongoose
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// User Schema
const UserSchema = new mongoose.Schema({
  fullname: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'superadmin', 'manager', 'storekeeper'],
    required: true,
    default: 'user'
  },
  HasAdminAccess: {
    type: Boolean,
    default: false
  },
},
  {timestamps: true}// Date created and updated timestamps will be automatically added to the schema
);

// Create model from the schema
const User = mongoose.model('User', UserSchema);

module.exports = User; // Export the User model for use in other files
