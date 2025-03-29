const jwt = require('jsonwebtoken');
const User = require('../models/User');

// 验证用户是否登录的中间件
exports.protect = async (req, res, next) => {
  let token;

  // 检查 Authorization 头部
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    // 从 Bearer token 中获取 token
    token = req.headers.authorization.split(' ')[1];
  }

  // 如果没有 token，返回错误
  if (!token) {
    return res.status(401).json({
      success: false,
      error: '没有访问权限，请登录'
    });
  }

  try {
    // 验证 token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'notetodo_default_secret');

    // 查找用户
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: '找不到该用户'
      });
    }

    // 将用户信息附加到请求对象上
    req.user = user;
    next();
  } catch (error) {
    console.error('Token验证错误:', error);
    return res.status(401).json({
      success: false,
      error: '无效的令牌'
    });
  }
};

// 验证用户是否是管理员的中间件
exports.admin = async (req, res, next) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      error: '没有管理员权限'
    });
  }
  next();
}; 