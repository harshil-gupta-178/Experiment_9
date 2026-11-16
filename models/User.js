const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { dbState } = require('../config/db');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please provide an email address'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email address'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const MongoUser = mongoose.model('User', userSchema);

const mockUsers = [];
let mockIdCounter = 1;

class MockUserInstance {
  constructor(data) {
    this._id = data._id || `user_${mockIdCounter++}`;
    this.name = data.name;
    this.email = data.email.toLowerCase();
    this.password = data.password;
    this.role = data.role || 'user';
    this.createdAt = data.createdAt || new Date();
  }

  async matchPassword(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
  }

  toJSON() {
    return {
      _id: this._id,
      name: this.name,
      email: this.email,
      role: this.role,
      createdAt: this.createdAt
    };
  }
}

const User = {
  async findOne(query, selectFields = '') {
    if (!dbState.isMock && dbState.connected) {
      let q = MongoUser.findOne(query);
      if (selectFields) q = q.select(selectFields);
      return await q;
    }

    const user = mockUsers.find(u => {
      if (query.email && u.email === query.email.toLowerCase()) return true;
      if (query._id && u._id === query._id) return true;
      return false;
    });

    return user || null;
  },

  async findById(id) {
    if (!dbState.isMock && dbState.connected) {
      return await MongoUser.findById(id).select('-password');
    }
    const user = mockUsers.find(u => u._id === id);
    if (!user) return null;
    return user;
  },

  async create({ name, email, password, role }) {
    if (!dbState.isMock && dbState.connected) {
      const newUser = await MongoUser.create({ name, email, password, role });
      return newUser;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const mockUser = new MockUserInstance({
      name,
      email,
      password: hashedPassword,
      role
    });
    mockUsers.push(mockUser);
    return mockUser;
  },

  MongoModel: MongoUser
};

module.exports = User;
