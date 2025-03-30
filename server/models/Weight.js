const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// 用户个人资料模式
const UserProfileSchema = new Schema({
  height: {
    type: Number, // 身高，单位：厘米
    required: true
  },
  weight: {
    type: Number, // 初始体重，单位：斤
    required: true
  },
  age: {
    type: Number, // 年龄
    required: true
  },
  gender: {
    type: String, // 性别
    enum: ['male', 'female'],
    required: true
  },
  startDate: {
    type: Date,
    default: Date.now
  }
});

// 体重记录模式
const WeightRecordSchema = new Schema({
  date: {
    type: Date,
    required: true
  },
  weight: {
    type: Number, // 体重，单位：斤
    required: true
  },
  note: {
    type: String // 备注，可选
  }
});

// 体重跟踪数据模式
const WeightSchema = new Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  profile: {
    type: UserProfileSchema,
    required: true
  },
  records: [WeightRecordSchema],
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
WeightSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// 在更新前设置updatedAt
WeightSchema.pre('findOneAndUpdate', function() {
  this._update = this._update || {};
  this._update.updatedAt = Date.now();
});

module.exports = mongoose.model('Weight', WeightSchema); 