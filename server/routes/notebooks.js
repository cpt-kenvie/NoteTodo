const express = require('express');
const router = express.Router();
const { 
  getAllNotebooks, 
  getNotebookById, 
  createNotebook, 
  updateNotebook, 
  deleteNotebook,
  addNoteToNotebook,
  removeNoteFromNotebook
} = require('../controller/notebookController');
const { protect } = require('../middleware/auth');

// 保护所有笔记本路由
router.use(protect);

// 获取所有笔记本和创建笔记本
router.route('/')
  .get(getAllNotebooks)
  .post(createNotebook);

// 获取、更新和删除单个笔记本
router.route('/:id')
  .get(getNotebookById)
  .put(updateNotebook)
  .delete(deleteNotebook);

// 添加和移除笔记
router.route('/:id/notes/:noteId')
  .put(addNoteToNotebook)
  .delete(removeNoteFromNotebook);

module.exports = router; 