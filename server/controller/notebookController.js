const Notebook = require('../models/Notebook');
const Note = require('../models/Note');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    获取所有笔记本（只获取当前用户的笔记本）
// @route   GET /api/notebooks
// @access  Private
exports.getAllNotebooks = asyncHandler(async (req, res, next) => {
  const notebooks = await Notebook.find({ user: req.user.id }).sort({ updatedAt: -1 });
  
  res.status(200).json({
    success: true,
    count: notebooks.length,
    data: notebooks
  });
});

// @desc    获取单个笔记本
// @route   GET /api/notebooks/:id
// @access  Private
exports.getNotebookById = asyncHandler(async (req, res, next) => {
  const notebook = await Notebook.findById(req.params.id).populate('notes');
  
  if (!notebook) {
    return next(new ErrorResponse('未找到笔记本', 404));
  }
  
  // 确保只能访问自己的笔记本
  if (notebook.user.toString() !== req.user.id) {
    return next(new ErrorResponse('没有权限访问此笔记本', 403));
  }
  
  res.status(200).json({
    success: true,
    data: notebook
  });
});

// @desc    创建笔记本
// @route   POST /api/notebooks
// @access  Private
exports.createNotebook = asyncHandler(async (req, res, next) => {
  const { title, description } = req.body;
  
  if (!title) {
    return next(new ErrorResponse('请提供笔记本标题', 400));
  }
  
  const notebookData = {
    title,
    description,
    user: req.user.id
  };
  
  const notebook = await Notebook.create(notebookData);
  
  res.status(201).json({
    success: true,
    data: notebook
  });
});

// @desc    更新笔记本
// @route   PUT /api/notebooks/:id
// @access  Private
exports.updateNotebook = asyncHandler(async (req, res, next) => {
  const { title, description } = req.body;
  
  // 首先检查笔记本是否存在
  let notebook = await Notebook.findById(req.params.id);
  
  if (!notebook) {
    return next(new ErrorResponse('未找到笔记本', 404));
  }
  
  // 检查是否是笔记本的所有者
  if (notebook.user.toString() !== req.user.id) {
    return next(new ErrorResponse('没有权限修改此笔记本', 403));
  }
  
  // 更新字段
  let notebookFields = {};
  if (title !== undefined) notebookFields.title = title;
  if (description !== undefined) notebookFields.description = description;
  
  notebook = await Notebook.findByIdAndUpdate(
    req.params.id,
    { $set: notebookFields },
    { new: true, runValidators: true }
  );
  
  res.status(200).json({
    success: true,
    data: notebook
  });
});

// @desc    删除笔记本
// @route   DELETE /api/notebooks/:id
// @access  Private
exports.deleteNotebook = asyncHandler(async (req, res, next) => {
  const notebook = await Notebook.findById(req.params.id);
  
  if (!notebook) {
    return next(new ErrorResponse('未找到笔记本', 404));
  }
  
  // 检查是否是笔记本的所有者
  if (notebook.user.toString() !== req.user.id) {
    return next(new ErrorResponse('没有权限删除此笔记本', 403));
  }
  
  // 删除前先检查是否有关联的笔记
  if (notebook.notes && notebook.notes.length > 0) {
    // 可以选择删除关联的笔记或在删除前将笔记分配到其他笔记本
    // 这里选择将笔记的笔记本引用移除
    await Note.updateMany(
      { _id: { $in: notebook.notes } },
      { $set: { notebook: null } }
    );
  }
  
  await notebook.deleteOne();
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    添加笔记到笔记本
// @route   PUT /api/notebooks/:id/notes/:noteId
// @access  Private
exports.addNoteToNotebook = asyncHandler(async (req, res, next) => {
  const { id, noteId } = req.params;
  
  // 检查笔记本和笔记是否存在
  const notebook = await Notebook.findById(id);
  const note = await Note.findById(noteId);
  
  if (!notebook) {
    return next(new ErrorResponse('未找到笔记本', 404));
  }
  
  if (!note) {
    return next(new ErrorResponse('未找到笔记', 404));
  }
  
  // 检查是否是笔记本和笔记的所有者
  if (notebook.user.toString() !== req.user.id || note.user.toString() !== req.user.id) {
    return next(new ErrorResponse('没有权限执行此操作', 403));
  }
  
  // 检查笔记是否已经在笔记本中
  if (notebook.notes.includes(noteId)) {
    return next(new ErrorResponse('笔记已存在于此笔记本中', 400));
  }
  
  // 添加笔记到笔记本
  notebook.notes.push(noteId);
  await notebook.save();
  
  // 更新笔记的笔记本引用
  note.notebook = id;
  await note.save();
  
  res.status(200).json({
    success: true,
    data: notebook
  });
});

// @desc    从笔记本中移除笔记
// @route   DELETE /api/notebooks/:id/notes/:noteId
// @access  Private
exports.removeNoteFromNotebook = asyncHandler(async (req, res, next) => {
  const { id, noteId } = req.params;
  
  // 检查笔记本和笔记是否存在
  const notebook = await Notebook.findById(id);
  const note = await Note.findById(noteId);
  
  if (!notebook) {
    return next(new ErrorResponse('未找到笔记本', 404));
  }
  
  if (!note) {
    return next(new ErrorResponse('未找到笔记', 404));
  }
  
  // 检查是否是笔记本和笔记的所有者
  if (notebook.user.toString() !== req.user.id || note.user.toString() !== req.user.id) {
    return next(new ErrorResponse('没有权限执行此操作', 403));
  }
  
  // 检查笔记是否在笔记本中
  if (!notebook.notes.includes(noteId)) {
    return next(new ErrorResponse('笔记不在此笔记本中', 400));
  }
  
  // 从笔记本中移除笔记
  notebook.notes = notebook.notes.filter(note => note.toString() !== noteId);
  await notebook.save();
  
  // 移除笔记的笔记本引用
  note.notebook = null;
  await note.save();
  
  res.status(200).json({
    success: true,
    data: notebook
  });
}); 