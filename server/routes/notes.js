const express = require('express');
const router = express.Router();
const { 
  getAllNotes, 
  getNoteById, 
  createNote, 
  updateNote, 
  deleteNote 
} = require('../controller/noteController');
const { protect } = require('../middleware/auth');

// 保护所有笔记路由
router.use(protect);

// 获取所有笔记和创建笔记
router.route('/')
  .get(getAllNotes)
  .post(createNote);

// 获取、更新和删除单个笔记
router.route('/:id')
  .get(getNoteById)
  .put(updateNote)
  .delete(deleteNote);

module.exports = router; 