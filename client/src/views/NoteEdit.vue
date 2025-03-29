<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getNoteById, createNote, updateNote } from '../api'
import type { Note as NoteType } from '../api'
import { toast } from '../plugins/toast'

const router = useRouter()
const route = useRoute()
const noteId = route.params.id as string | undefined
const sourceRoute = route.query.from as string || '/'

const note = ref<Partial<NoteType>>({
  _id: '',
  title: '',
  content: '',
  completed: false,
  createdAt: new Date().toISOString()
})

const loading = ref(false)
const saving = ref(false)
const error = ref('')
const timeValue = ref('')

// 计算当前是编辑还是创建
const isEditing = computed(() => !!noteId)

const fetchNote = async () => {
  if (!noteId) return

  loading.value = true
  error.value = ''

  try {
    const response = await getNoteById(noteId)
    if (response.success) {
      note.value = response.data
      
      // 设置时间输入框的值
      const date = new Date(response.data.createdAt)
      timeValue.value = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
    } else {
      error.value = response.error || '获取事件失败'
    }
  } catch (err: any) {
    console.error(`获取事件 ${noteId} 出错:`, err)
    error.value = err.message || '无法连接到服务器'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (noteId) {
    fetchNote()
  } else {
    // 设置默认时间为当前时间
    const now = new Date()
    timeValue.value = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
  }
})

const saveNote = async () => {
  // 验证表单
  if (!note.value.title?.trim()) {
    toast.warning('标题不能为空')
    return
  }
  
  saving.value = true
  error.value = ''
  
  // 解析时间并设置到创建日期
  if (timeValue.value) {
    try {
      const [hours, minutes] = timeValue.value.split(':').map(Number)
      const date = noteId ? new Date(note.value.createdAt || new Date()) : new Date()
      date.setHours(hours)
      date.setMinutes(minutes)
      note.value.createdAt = date.toISOString()
    } catch (e) {
      console.error('时间解析错误:', e)
    }
  }
  
  try {
    let response
    
    if (noteId) {
      // 更新现有笔记
      response = await updateNote(noteId, {
        title: note.value.title,
        content: note.value.content,
        completed: note.value.completed
      })
    } else {
      // 创建新笔记
      response = await createNote({
        title: note.value.title,
        content: note.value.content,
        completed: note.value.completed,
        createdAt: note.value.createdAt
      })
    }
    
    if (response.success) {
      // 保存成功后返回
      toast.success(isEditing.value ? '事件更新成功' : '事件创建成功')
      goBack()
    } else {
      error.value = response.error || '保存事件失败'
      toast.error(response.error || '保存事件失败')
    }
  } catch (err: any) {
    console.error('保存事件出错:', err)
    error.value = err.message || '无法连接到服务器'
    toast.error(err.message || '无法连接到服务器')
  } finally {
    saving.value = false
  }
}

const cancelEdit = () => {
  router.push(sourceRoute)
}

const toggleStatus = (status: boolean) => {
  note.value.completed = status
}

const goBack = () => {
  router.push(sourceRoute)
}
</script>

<template>
  <div class="container">
    <div class="sidebar">
      <div class="app-logo">
        <div class="logo-circle">
          <span class="material-icons-round">edit_note</span>
        </div>
        <h1>简约记事</h1>
      </div>
      <nav class="menu">
        <ul>
          <li>
            <router-link to="/">
              <span class="material-icons-round">today</span>
              <span>今日任务</span>
            </router-link>
          </li>
          <li>
            <router-link to="/completed">
              <span class="material-icons-round">done_all</span>
              <span>已完成</span>
            </router-link>
          </li>
          <li>
            <router-link to="/all">
              <span class="material-icons-round">event_note</span>
              <span>所有事件</span>
            </router-link>
          </li>
          <li>
            <router-link to="/admin/users">
              <span class="material-icons-round">admin_panel_settings</span>
              <span>用户管理</span>
            </router-link>
          </li>
        </ul>
      </nav>
    </div>
    <div class="main-content">
      <header>
        <div class="search-bar">
          <span class="material-icons-round">search</span>
          <input type="text" placeholder="搜索事件...">
        </div>
        <div class="user-profile">
          <div class="avatar">
            <img src="https://i.pravatar.cc/150?img=11" alt="用户头像">
          </div>
        </div>
      </header>
      <main>
        <div class="page-header">
          <h2>{{ isEditing ? '编辑事件' : '新建事件' }}</h2>
        </div>

        <div v-if="error" class="error-message">
          {{ error }}
          <button v-if="noteId" @click="fetchNote" class="retry-btn">重试</button>
        </div>
        
        <div v-if="loading" class="loading">
          <span class="material-icons-round loading-icon">sync</span>
          加载中...
        </div>
        
        <div v-else class="modal-content">
          <div class="modal-body">
            <div class="form-group">
              <label>时间</label>
              <input type="time" v-model="timeValue">
            </div>
            <div class="form-group">
              <label>事件内容</label>
              <input type="text" v-model="note.title" placeholder="请输入事件标题">
              <textarea rows="3" v-model="note.content" placeholder="事件详情（可选）"></textarea>
            </div>
            <div class="form-group">
              <label>状态</label>
              <div class="status-toggle">
                <button 
                  class="status-btn" 
                  :class="{ 'active': !note.completed }"
                  @click="toggleStatus(false)"
                >
                  未完成
                </button>
                <button 
                  class="status-btn" 
                  :class="{ 'active': note.completed }"
                  @click="toggleStatus(true)"
                >
                  已完成
                </button>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="cancel-btn" @click="cancelEdit">取消</button>
            <button class="save-btn" @click="saveNote" :disabled="saving">
              {{ saving ? '保存中...' : '保存' }}
            </button>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
/* 使用原HTML的样式，需要在main.ts中导入CSS文件 */
/* 以下是必要的基础样式 */
.empty-state {
  text-align: center;
  padding: 40px;
  color: #6b7280;
  background-color: #f9fafb;
  border-radius: 8px;
  margin: 20px 0;
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

/* 编辑表单样式 */
.modal-content {
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  max-width: 600px;
  margin: 0 auto;
  overflow: hidden;
}

.modal-body {
  padding: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-weight: 500;
  margin-bottom: 8px;
  color: #374151;
}

.form-group input[type="time"],
.form-group input[type="text"],
.form-group textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 16px;
  margin-bottom: 8px;
}

.form-group textarea {
  resize: vertical;
  min-height: 100px;
}

.status-toggle {
  display: flex;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
}

.status-btn {
  flex: 1;
  border: none;
  background: #f3f4f6;
  padding: 10px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s;
}

.status-btn.active {
  background-color: #6366f1;
  color: white;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  padding: 16px 24px;
  background-color: #f9fafb;
  gap: 12px;
}

.cancel-btn {
  padding: 10px 20px;
  border: none;
  background-color: #e5e7eb;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
}

.save-btn {
  padding: 10px 20px;
  border: none;
  background-color: #6366f1;
  color: white;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
}

.save-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style> 