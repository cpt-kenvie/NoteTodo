const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const NoteSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    trim: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// 在保存前更新updatedAt
NoteSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// 在更新前设置updatedAt
NoteSchema.pre('findOneAndUpdate', function() {
  this._update = this._update || {};
  this._update.updatedAt = Date.now();
});

module.exports = mongoose.model('Note', NoteSchema); 