const Note = require('../models/Note');

// 获取所有笔记（只获取当前用户的笔记）
exports.getAllNotes = async (req, res) => {
  try {
    const notes = await Note.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: notes.length,
      data: notes
    });
  } catch (error) {
    console.error('获取笔记错误:', error);
    res.status(500).json({
      success: false,
      error: '服务器错误'
    });
  }
};

// 获取单个笔记
exports.getNoteById = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    
    if (!note) {
      return res.status(404).json({
        success: false,
        error: '未找到笔记'
      });
    }
    
    // 确保只能访问自己的笔记
    if (note.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: '没有权限访问此笔记'
      });
    }
    
    res.status(200).json({
      success: true,
      data: note
    });
  } catch (error) {
    console.error('获取笔记详情错误:', error);
    res.status(500).json({
      success: false,
      error: '服务器错误'
    });
  }
};

// 创建笔记
exports.createNote = async (req, res) => {
  try {
    const { title, content, completed, createdAt } = req.body;
    
    if (!title) {
      return res.status(400).json({
        success: false,
        error: '请提供笔记标题'
      });
    }
    
    const noteData = {
      title,
      content,
      completed: completed || false,
      user: req.user.id  // 添加用户ID
    };
    
    // 如果提供了createdAt字段，则使用它
    if (createdAt) {
      try {
        noteData.createdAt = new Date(createdAt);
        // 检查日期是否有效
        if (isNaN(noteData.createdAt.getTime())) {
          throw new Error('Invalid date');
        }
      } catch (e) {
        console.error('日期解析错误:', e);
        // 如果日期无效，使用当前时间
        noteData.createdAt = new Date();
      }
    }
    
    const note = await Note.create(noteData);
    
    res.status(201).json({
      success: true,
      data: note
    });
  } catch (error) {
    console.error('创建笔记错误:', error);
    res.status(500).json({
      success: false,
      error: '服务器错误'
    });
  }
};

// 更新笔记
exports.updateNote = async (req, res) => {
  try {
    const { title, content, completed, createdAt } = req.body;
    
    // 首先检查笔记是否存在
    let note = await Note.findById(req.params.id);
    
    if (!note) {
      return res.status(404).json({
        success: false,
        error: '未找到笔记'
      });
    }
    
    // 检查是否是笔记的所有者
    if (note.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: '没有权限修改此笔记'
      });
    }
    
    let noteFields = {};
    
    if (title !== undefined) noteFields.title = title;
    if (content !== undefined) noteFields.content = content;
    if (completed !== undefined) noteFields.completed = completed;
    
    if (createdAt !== undefined) {
      try {
        noteFields.createdAt = new Date(createdAt);
      } catch (e) {
        console.error('Invalid date format for createdAt:', e);
        // 如果日期无效，不更新createdAt字段
      }
    }
    
    note = await Note.findByIdAndUpdate(
      req.params.id,
      { $set: noteFields },
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      data: note
    });
  } catch (error) {
    console.error('更新笔记错误:', error);
    res.status(500).json({
      success: false,
      error: '服务器错误'
    });
  }
};

// 删除笔记
exports.deleteNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    
    if (!note) {
      return res.status(404).json({
        success: false,
        error: '未找到笔记'
      });
    }
    
    // 检查是否是笔记的所有者
    if (note.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: '没有权限删除此笔记'
      });
    }
    
    await note.deleteOne();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('删除笔记错误:', error);
    res.status(500).json({
      success: false,
      error: '服务器错误'
    });
  }
}; 