const User = require('../models/User');

// 用户注册
exports.register = async (req, res) => {
  try {
    const { username, password, avatar } = req.body;

    // 检查用户是否已存在
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: '用户名已被占用'
      });
    }

    // 检查是否是第一个用户（如果是，则设为管理员）
    const userCount = await User.countDocuments();
    const isFirstUser = userCount === 0;

    // 创建新用户
    const userData = {
      username,
      password,
      isAdmin: isFirstUser // 第一个注册的用户为管理员
    };

    // 如果提供了头像URL，则使用它
    if (avatar) {
      userData.avatar = avatar;
    }

    const user = await User.create(userData);

    // 生成token
    const token = user.generateAuthToken();

    res.status(201).json({
      success: true,
      token,
      data: {
        id: user._id,
        username: user.username,
        avatar: user.avatar,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({
      success: false,
      error: error.message || '服务器错误'
    });
  }
};

// 用户登录
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // 检查输入
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: '请提供用户名和密码'
      });
    }

    // 查找用户并包含密码
    const user = await User.findOne({ username }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        error: '用户名或密码不正确'
      });
    }

    // 检查密码
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: '用户名或密码不正确'
      });
    }

    // 生成token
    const token = user.generateAuthToken();

    res.status(200).json({
      success: true,
      token,
      data: {
        id: user._id,
        username: user.username,
        avatar: user.avatar,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({
      success: false,
      error: '服务器错误'
    });
  }
};

// 获取当前用户信息
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        username: user.username,
        avatar: user.avatar,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({
      success: false,
      error: '服务器错误'
    });
  }
};

// 更新用户头像
exports.updateAvatar = async (req, res) => {
  try {
    const { avatar } = req.body;

    if (!avatar) {
      return res.status(400).json({
        success: false,
        error: '请提供头像URL'
      });
    }

    // 验证URL格式
    try {
      new URL(avatar);
    } catch (e) {
      return res.status(400).json({
        success: false,
        error: '无效的URL格式'
      });
    }

    // 更新用户头像
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { avatar },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: '用户不存在'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        username: user.username,
        avatar: user.avatar,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    console.error('更新头像错误:', error);
    res.status(500).json({
      success: false,
      error: '服务器错误'
    });
  }
}; 