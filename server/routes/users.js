const express = require('express');
const router = express.Router();
const { getAllUsers, getUserById, updateUser, deleteUser } = require('../controller/userController');
const { protect, admin } = require('../middleware/auth');

// 获取所有用户 (管理员专用)
router.get('/', protect, admin, getAllUsers);

// 获取单个用户
router.get('/:id', protect, getUserById);

// 更新用户信息
router.put('/:id', protect, updateUser);

// 删除用户 (管理员专用)
router.delete('/:id', protect, admin, deleteUser);

module.exports = router;
