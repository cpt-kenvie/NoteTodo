const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const NotebookSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
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
  },
  // 笔记本中的笔记引用
  notes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Note'
  }]
});

// 在保存前更新updatedAt
NotebookSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// 在更新前设置updatedAt
NotebookSchema.pre('findOneAndUpdate', function() {
  this._update = this._update || {};
  this._update.updatedAt = Date.now();
});

module.exports = mongoose.model('Notebook', NotebookSchema); 