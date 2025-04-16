const Weight = require('../models/Weight');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    获取用户的体重记录
// @route   GET /api/weights
// @access  Private
exports.getWeightData = asyncHandler(async (req, res, next) => {
  console.log('getWeightData');
  // 查找当前用户的体重记录
  const weightData = await Weight.findOne({ user: req.user.id });
  
  if (!weightData) {
    return res.status(200).json({
      success: true,
      data: null // 没有数据时返回null
    });
  }
  
  res.status(200).json({
    success: true,
    data: weightData
  });
});

// @desc    创建或更新用户的体重记录
// @route   POST /api/weights
// @access  Private
exports.createOrUpdateWeightData = asyncHandler(async (req, res, next) => {
  console.log('createOrUpdateWeightData');
  // 检查请求体中是否包含必要的字段
  if (!req.body.profile) {
    return next(new ErrorResponse('请提供用户个人资料信息', 400));
  }
  
  // 查找当前用户是否已有记录
  let weightData = await Weight.findOne({ user: req.user.id });
  
  if (weightData) {
    // 如果已存在记录，更新它
    weightData = await Weight.findOneAndUpdate(
      { user: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );
  } else {
    // 如果不存在，创建新记录
    req.body.user = req.user.id; // 添加用户ID
    weightData = await Weight.create(req.body);
  }
  
  res.status(200).json({
    success: true,
    data: weightData
  });
});

// @desc    添加体重记录
// @route   POST /api/weights/record
// @access  Private
exports.addWeightRecord = asyncHandler(async (req, res, next) => {
  console.log('addWeightRecord');
  // 检查请求体中是否包含必要的字段
  if (!req.body.date || !req.body.weight) {
    return next(new ErrorResponse('请提供日期和体重信息', 400));
  }
  
  // 查找当前用户的体重记录
  const weightData = await Weight.findOne({ user: req.user.id });
  
  if (!weightData) {
    return next(new ErrorResponse('请先创建个人资料', 404));
  }
  
  // 使用中国时区（UTC+8）处理日期比较
  // 将输入日期转换为中国时区的日期字符串（YYYY-MM-DD格式）
  const inputDate = new Date(req.body.date);
  const chinaInputDate = new Date(inputDate.getTime());
  const chinaInputDateString = chinaInputDate.toISOString().split('T')[0];
  
  // 检查是否已存在同一天的记录
  const existingRecordIndex = weightData.records.findIndex(record => {
    const recordDate = new Date(record.date);
    const chinaRecordDate = new Date(recordDate.getTime());
    return chinaRecordDate.toISOString().split('T')[0] === chinaInputDateString;
  });
  
  if (existingRecordIndex !== -1) {
    // 更新现有记录
    weightData.records[existingRecordIndex].weight = req.body.weight;
    if (req.body.note) {
      weightData.records[existingRecordIndex].note = req.body.note;
    }
  } else {
    // 添加新记录
    weightData.records.push({
      date: req.body.date,
      weight: req.body.weight,
      note: req.body.note
    });
  }
  
  // 按日期降序排序记录
  weightData.records.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  await weightData.save();
  
  res.status(200).json({
    success: true,
    data: weightData
  });
});

// @desc    删除体重记录
// @route   DELETE /api/weights/record/:id
// @access  Private
exports.deleteWeightRecord = asyncHandler(async (req, res, next) => {
  console.log('deleteWeightRecord');
  // 查找当前用户的体重记录
  const weightData = await Weight.findOne({ user: req.user.id });
  
  if (!weightData) {
    return next(new ErrorResponse('未找到体重记录', 404));
  }
  
  // 寻找要删除的记录
  const recordId = req.params.id;
  const recordIndex = weightData.records.findIndex(record => record._id.toString() === recordId);
  
  if (recordIndex === -1) {
    return next(new ErrorResponse('未找到指定的记录', 404));
  }
  
  // 删除记录
  weightData.records.splice(recordIndex, 1);
  await weightData.save();
  
  res.status(200).json({
    success: true,
    data: weightData
  });
});

// @desc    重置用户的所有体重数据
// @route   DELETE /api/weights
// @access  Private
exports.resetWeightData = asyncHandler(async (req, res, next) => {
  console.log('resetWeightData');
  // 删除当前用户的所有体重记录
  await Weight.findOneAndDelete({ user: req.user.id });
  
  res.status(200).json({
    success: true,
    data: {}
  });
}); 