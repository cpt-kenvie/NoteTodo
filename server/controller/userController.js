const User = require('../models/User');

// 获取所有用户（仅限管理员）
exports.getAllUsers = async (req, res) => {
  try {
    // 检查是否是管理员
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        error: '没有管理员权限'
      });
    }
    
    const users = await User.find().select('-password');
    
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error('获取用户列表错误:', error);
    res.status(500).json({
      success: false,
      error: '服务器错误'
    });
  }
};

// 获取单个用户信息
exports.getUserById = async (req, res) => {
  try {
    // 普通用户只能查看自己的信息，管理员可以查看所有用户
    if (!req.user.isAdmin && req.params.id !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        error: '没有权限查看其他用户信息'
      });
    }
    
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: '未找到该用户'
      });
    }
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    
    // 检查是否是无效的ID格式
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        error: '未找到该用户'
      });
    }
    
    res.status(500).json({
      success: false,
      error: '服务器错误'
    });
  }
};

// 更新用户信息（不包括密码和头像）
exports.updateUser = async (req, res) => {
  try {
    // 确保只能更新自己的信息，管理员可以更新所有用户
    if (!req.user.isAdmin && req.params.id !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        error: '只能更新自己的账户信息'
      });
    }
    
    // 不允许在这里更新密码和头像
    const { password, avatar, ...updateData } = req.body;
    
    // 普通用户不能修改isAdmin字段
    if (!req.user.isAdmin && 'isAdmin' in updateData) {
      delete updateData.isAdmin;
    }
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: '未找到该用户'
      });
    }
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('更新用户信息错误:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: '用户名已被占用'
      });
    }
    
    res.status(500).json({
      success: false,
      error: error.message || '服务器错误'
    });
  }
};

// 删除用户（仅限管理员）
exports.deleteUser = async (req, res) => {
  try {
    // 检查是否是管理员
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        error: '没有管理员权限'
      });
    }
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: '未找到该用户'
      });
    }
    
    // 防止删除自己
    if (user._id.toString() === req.user.id.toString()) {
      return res.status(400).json({
        success: false,
        error: '不能删除自己的账户'
      });
    }
    
    // 使用 deleteOne 方法替代 remove 方法
    await User.deleteOne({ _id: user._id });
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('删除用户错误:', error);
    res.status(500).json({
      success: false,
      error: '服务器错误'
    });
  }
}; 