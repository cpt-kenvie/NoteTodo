<script setup lang="ts">
import { ref } from 'vue'
import type { Note as NoteType } from '../api'

// 全局状态引用
const isVisible = ref(false)
const currentNote = ref<NoteType | null>(null)

// 显示模态框的方法
const showModal = (note: NoteType) => {
  currentNote.value = note
  isVisible.value = true
}

// 关闭模态框的方法
const hideModal = () => {
  isVisible.value = false
}

// 暴露给外部的方法
defineExpose({
  showModal,
  hideModal
})

// 获取任务的时间格式化
const formatTime = (dateString: string) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}

// 格式化日期
const formatDate = (dateString: string) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  })
}
</script>

<template>
  <teleport to="body">
    <div v-if="isVisible" class="modal-overlay" @click="hideModal">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <h3>{{ currentNote?.title }}</h3>
          <span class="material-icons-round close-btn" @click="hideModal">close</span>
        </div>
        
        <div class="modal-content">
          <div class="note-meta">
            <div class="meta-item">
              <span class="material-icons-round">event</span>
              <span>{{ formatDate(currentNote?.createdAt || '') }}</span>
            </div>
            <div class="meta-item">
              <span class="material-icons-round">schedule</span>
              <span>{{ formatTime(currentNote?.createdAt || '') }}</span>
            </div>
            <div class="meta-item status">
              <span class="material-icons-round">{{ currentNote?.completed ? 'check_circle' : 'pending' }}</span>
              <span>{{ currentNote?.completed ? '已完成' : '进行中' }}</span>
            </div>
          </div>
          
          <div class="note-content">
            <h4>事件内容</h4>
            <div class="content-text">{{ currentNote?.content || '无内容描述' }}</div>
          </div>
        </div>
      </div>
    </div>
  </teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.modal-container {
  background-color: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  color: #111827;
}

.close-btn {
  cursor: pointer;
  color: #6b7280;
  transition: color 0.2s;
}

.close-btn:hover {
  color: #111827;
}

.modal-content {
  padding: 20px;
}

.note-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 20px;
  background-color: #f9fafb;
  border-radius: 8px;
  padding: 12px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #4b5563;
  font-size: 14px;
}

.meta-item .material-icons-round {
  font-size: 18px;
}

.status {
  font-weight: 500;
}

.status .material-icons-round {
  color: #6366f1;
}

.note-content h4 {
  font-size: 16px;
  color: #374151;
  margin-bottom: 10px;
}

.content-text {
  line-height: 1.6;
  white-space: pre-wrap;
  color: #4b5563;
  background-color: #f9fafb;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 10px;
  border-left: 3px solid #6366f1;
}

@media (max-width: 640px) {
  .modal-container {
    width: 95%;
  }
  
  .note-meta {
    flex-direction: column;
    gap: 8px;
  }
}
</style> 