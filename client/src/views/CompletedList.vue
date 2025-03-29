<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { getAllNotes, deleteNote, updateNote } from '../api'
import type { Note as NoteType } from '../api'
import EditModal from '../components/EditModal.vue'
import ViewNoteModal from '../components/ViewNoteModal.vue'
import GlobalViewModal from '../components/GlobalViewModal.vue'
import AppLayout from '../components/AppLayout.vue'
import { toast } from '../plugins/toast'

const notes = ref<NoteType[]>([])
const loading = ref(false)
const error = ref('')
const searchQuery = ref('')
const showModal = ref(false)
const currentNote = ref<NoteType | null>(null)
const showViewModal = ref(false)
const viewingNote = ref<NoteType | null>(null)

// 创建全局模态框引用
const globalModalRef = ref(null)
const appLayoutRef = ref(null)

// 从API获取已完成的笔记
const fetchCompletedNotes = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const response = await getAllNotes()
    if (response.success) {
      // 筛选已完成的笔记并按创建时间降序排序
      notes.value = response.data
        .filter(note => note.completed)
        .sort((a, b) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        })
    } else {
      error.value = response.error || '获取笔记失败'
    }
  } catch (err: any) {
    console.error('获取笔记出错:', err)
    error.value = err.message || '无法连接到服务器'
  } finally {
    loading.value = false
  }
}

// 处理搜索
const handleSearch = (query: string) => {
  searchQuery.value = query
}

// 筛选后的笔记列表
const filteredNotes = computed(() => {
  if (!searchQuery.value) return notes.value
  
  const query = searchQuery.value.toLowerCase()
  return notes.value.filter(note => {
    return note.title.toLowerCase().includes(query) || 
           (note.content && note.content.toLowerCase().includes(query))
  })
})

onMounted(() => {
  fetchCompletedNotes()
})

// 打开编辑弹窗
const openEditModal = (note?: NoteType) => {
  currentNote.value = note || null
  showModal.value = true
}

const toggleComplete = async (note: NoteType) => {
  const newStatus = !note.completed
  const actionText = newStatus ? '标记为已完成' : '标记为未完成'
  
  try {
    const response = await updateNote(note._id, {
      completed: newStatus
    })
    
    if (response.success) {
      toast.success(`事件已${newStatus ? '完成' : '恢复为未完成'}`)
      fetchCompletedNotes()
    } else {
      toast.error(response.error || `${actionText}失败`)
    }
  } catch (err: any) {
    console.error('更新事件状态出错:', err)
    toast.error(err.message || '无法连接到服务器')
  }
}

// 删除笔记
const handleDelete = (id: string) => {
  toast.confirm('确定要删除此事件吗？', {
    type: 'warning',
    onConfirm: async () => {
      try {
        const response = await deleteNote(id)
        if (response.success) {
          toast.success('事件已删除')
          fetchCompletedNotes()
        } else {
          toast.error(response.error || '删除事件失败')
        }
      } catch (err: any) {
        console.error('删除事件出错:', err)
        toast.error(err.message || '无法连接到服务器')
      }
    }
  })
}

// 获取任务的时间格式化
const formatTime = (dateString: string) => {
  const date = new Date(dateString)
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}

// 计算今天的日期（去除时间部分）
const isToday = (dateString: string) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const date = new Date(dateString)
  date.setHours(0, 0, 0, 0)
  
  return date.getTime() === today.getTime()
}

// 今日完成的任务数
const todayCompletedCount = computed(() => {
  return notes.value.filter(note => isToday(note.createdAt)).length
})

// 更早完成的任务数
const earlierCompletedCount = computed(() => {
  return notes.value.filter(note => !isToday(note.createdAt)).length
})

// 笔记保存成功后的处理
const handleSaved = () => {
  fetchCompletedNotes()
}

// 打开查看笔记内容的弹窗
const openViewModal = (note: NoteType) => {
  viewingNote.value = note
  showViewModal.value = true
  
  // 同时使用全局模态框
  if (globalModalRef.value) {
    // @ts-ignore - 类型错误可以忽略
    globalModalRef.value.showModal(note)
  }
}
</script>

<template>
  <AppLayout 
    ref="appLayoutRef"
    title="已完成事件" 
    searchPlaceholder="搜索已完成事件..."
    @search="handleSearch"
  >
    <template #header-actions>
      <button class="add-task-btn" @click="openEditModal()">
        <span class="material-icons-round">add</span>
        添加事件
      </button>
    </template>

    <div class="stats-container">
      <div class="stat-card">
        <div class="stat-value">{{ notes.length }}</div>
        <div class="stat-label">已完成总数</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ todayCompletedCount }}</div>
        <div class="stat-label">今日完成</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ earlierCompletedCount }}</div>
        <div class="stat-label">更早完成</div>
      </div>
    </div>

    <div v-if="error" class="error-message">
      {{ error }}
      <button @click="fetchCompletedNotes" class="retry-btn">重试</button>
    </div>
    
    <div v-if="loading" class="loading">
      <span class="material-icons-round loading-icon">sync</span>
      加载中...
    </div>
    
    <div v-else>
      <div v-if="notes.length === 0" class="empty-state">
        没有已完成的事件。
      </div>
      
      <div v-if="filteredNotes.length === 0 && searchQuery" class="empty-state">
        没有找到匹配的已完成事件。
      </div>

      <!-- 已完成事项列表 -->
      <div v-if="!loading && !error">
        <div class="note-list completed">
          <h3>已完成事项 ({{ notes.length }})</h3>
          
          <div v-if="notes.length === 0" class="empty-state">
            <span class="material-icons-round">inventory_2</span>
            <p>没有已完成的事项</p>
          </div>
          
          <div v-else class="note-items">
            <div 
              v-for="note in filteredNotes" 
              :key="note._id" 
              class="note-item"
            >
              <div class="note-content" @click="openViewModal(note)">
                <div class="note-status">
                  <span 
                    class="status-circle completed"
                    @click.stop="toggleComplete(note)"
                  ></span>
                </div>
                <div class="note-details">
                  <h4>{{ note.title }}</h4>
                  <div class="note-time">
                    <span class="material-icons-round">schedule</span>
                    <span>{{ formatTime(note.createdAt) }}</span>
                  </div>
                </div>
              </div>
              <div class="note-actions">
                <button class="action-btn view" @click.stop="openViewModal(note)" title="查看事件">
                  <span class="material-icons-round">visibility</span>
                </button>
                <button class="action-btn edit" @click.stop="openEditModal(note)">
                  <span class="material-icons-round">edit</span>
                </button>
                <button class="action-btn delete" @click.stop="handleDelete(note._id)">
                  <span class="material-icons-round">delete</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #modals>
      <!-- 编辑弹窗 -->
      <EditModal 
        v-model:show="showModal"
        :editing-note="currentNote"
        @saved="handleSaved"
      />

      <!-- 查看笔记内容的弹窗 -->
      <ViewNoteModal 
        v-model:show="showViewModal"
        :note="viewingNote"
      />
      
      <!-- 全局模态框组件 -->
      <GlobalViewModal ref="globalModalRef" />
    </template>
  </AppLayout>
</template>

<style scoped>
/* 注意：AppLayout已经包含了基本的容器和布局样式，这里只需保留特定内容的样式 */
.empty-state {
  text-align: center;
  padding: 20px;
  color: #6b7280;
  background-color: #f9fafb;
  border-radius: 8px;
  margin: 10px 0;
}

.date-group {
  margin-bottom: 40px;
}

.date-header {
  margin: 30px 0 15px;
  padding-bottom: 10px;
  border-bottom: 2px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.date-header h3 {
  font-size: 20px;
  font-weight: 600;
  color: #374151;
  margin: 0;
  display: flex;
  align-items: center;
}

.date-tag {
  font-size: 12px;
  font-weight: 500;
  color: white;
  background-color: #6366f1;
  padding: 2px 8px;
  border-radius: 12px;
  margin-left: 8px;
}

.date-stats {
  font-size: 14px;
  color: #6b7280;
}

.stats-container {
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  flex: 1;
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.stat-value {
  font-size: 32px;
  font-weight: 600;
  color: #6366f1;
  margin-bottom: 8px;
}

.stat-label {
  color: #6b7280;
  font-size: 14px;
}

.error-message {
  background-color: #fee2e2;
  color: #b91c1c;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.retry-btn {
  background-color: #b91c1c;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 6px 12px;
  font-size: 14px;
  cursor: pointer;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #6b7280;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.loading-icon {
  font-size: 36px;
  animation: spin 1s infinite linear;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.note-list {
  margin-bottom: 24px;
}

.note-list h3 {
  margin-bottom: 16px;
  font-size: 18px;
  font-weight: 600;
  color: #374151;
}

.note-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.note-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
}

.note-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.note-content {
  display: flex;
  align-items: center;
  flex: 1;
  padding: 14px 16px;
  cursor: pointer;
}

.note-status {
  margin-right: 14px;
}

.status-circle {
  display: block;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid #6366f1;
  cursor: pointer;
  transition: background-color 0.2s;
}

.status-circle.completed {
  background-color: #6366f1;
  position: relative;
}

.status-circle.completed::after {
  content: "";
  position: absolute;
  top: 40%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(45deg);
  width: 5px;
  height: 10px;
  border-bottom: 2px solid white;
  border-right: 2px solid white;
}

.note-details h4 {
  margin: 0 0 6px;
  font-size: 16px;
  font-weight: 500;
  color: #111827;
}

.note-time {
  display: flex;
  align-items: center;
  font-size: 13px;
  color: #6b7280;
}

.note-time .material-icons-round {
  font-size: 14px;
  margin-right: 4px;
}

.note-actions {
  display: flex;
  padding: 0 8px;
}

.action-btn {
  background: none;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #6b7280;
  transition: background-color 0.2s, color 0.2s;
}

.action-btn:hover {
  background-color: #f3f4f6;
}

.action-btn.view:hover {
  color: #10b981;
}

.action-btn.edit:hover {
  color: #6366f1;
}

.action-btn.delete:hover {
  color: #ef4444;
}

.note-list.completed .note-details h4 {
  text-decoration: line-through;
  color: #6b7280;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  color: #9ca3af;
  text-align: center;
}

.empty-state .material-icons-round {
  font-size: 48px;
  margin-bottom: 16px;
  color: #d1d5db;
}

.empty-state p {
  font-size: 16px;
  margin: 0;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .stats-container {
    flex-direction: column;
    gap: 12px;
  }
}
</style> 