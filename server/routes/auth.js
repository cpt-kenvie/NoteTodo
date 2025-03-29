const express = require('express');
const router = express.Router();
const { register, login, getCurrentUser, updateAvatar } = require('../controller/authController');
const { protect } = require('../middleware/auth');

// 注册路由
router.post('/register', register);

// 登录路由
router.post('/login', login);

// 获取当前用户信息
router.get('/me', protect, getCurrentUser);

// 更新用户头像
router.put('/avatar', protect, updateAvatar);

module.exports = router; 