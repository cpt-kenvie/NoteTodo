const express = require('express');
const router = express.Router();
const { 
  getWeightData, 
  createOrUpdateWeightData,
  addWeightRecord,
  deleteWeightRecord,
  resetWeightData
} = require('../controller/weightController');
const { protect } = require('../middleware/auth');

// 所有路由都需要认证
router.use(protect);

// 获取和创建/更新用户的体重数据
router.route('/')
  .get(getWeightData)
  .post(createOrUpdateWeightData)
  .delete(resetWeightData);

// 添加体重记录
router.route('/record')
  .post(addWeightRecord);

// 删除体重记录
router.route('/record/:id')
  .delete(deleteWeightRecord);

module.exports = router; 