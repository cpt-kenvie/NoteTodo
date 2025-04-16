<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { createNote, updateNote } from '../api'
import type { Note as NoteType } from '../api'
import { toast } from '../plugins/toast'

const props = defineProps<{
  show: boolean
  editingNote: Partial<NoteType> | null
}>()

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void
  (e: 'saved'): void
}>()

const note = ref<Partial<NoteType>>({
  _id: '',
  title: '',
  content: '',
  completed: false,
  createdAt: new Date().toISOString()
})

const dateValue = ref('')
const timeValue = ref('')
const saving = ref(false)
const error = ref('')

// 计算当前是编辑还是创建
const isEditing = computed(() => !!note.value._id)

// 重置表单函数必须在watch之前定义
const resetForm = () => {
  note.value = {
    _id: '',
    title: '',
    content: '',
    completed: false,
    createdAt: new Date().toISOString()
  }
  dateValue.value = ''
  timeValue.value = ''
  error.value = ''
}

// 监听props变化，更新本地数据
watch(() => props.editingNote, (newVal) => {
  if (newVal) {
    note.value = { ...newVal }
    
    // 设置日期和时间输入框的值
    const date = new Date(newVal.createdAt || new Date())
    dateValue.value = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`
    timeValue.value = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
  } else {
    resetForm()
  }
}, { immediate: true })

// 监听show属性，当弹窗关闭时重置表单
watch(() => props.show, (newVal) => {
  if (!newVal) {
    resetForm()
  } else if (!props.editingNote) {
    // 如果是新建笔记，设置默认时间为当前时间
    const now = new Date()
    dateValue.value = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`
    timeValue.value = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    note.value = {
      _id: '',
      title: '',
      content: '',
      completed: false,
      createdAt: now.toISOString()
    }
  }
})

const saveNote = async () => {
  // 验证表单
  if (!note.value.title?.trim()) {
    toast.warning('标题不能为空')
    return
  }
  
  if (!dateValue.value) {
    toast.warning('请选择日期')
    return
  }
  
  saving.value = true
  error.value = ''
  
  // 解析日期和时间并设置到创建日期
  try {
    const [year, month, day] = dateValue.value.split('-').map(Number)
    const [hours, minutes] = timeValue.value ? timeValue.value.split(':').map(Number) : [0, 0]
    
    const date = new Date()
    date.setFullYear(year, month - 1, day)
    date.setHours(hours || 0, minutes || 0, 0, 0)
    
    // 验证日期是否有效
    if (isNaN(date.getTime())) {
      throw new Error('无效的日期时间')
    }
    
    note.value.createdAt = date.toISOString()
  } catch (e) {
    console.error('日期/时间解析错误:', e)
    error.value = '日期格式无效，请重新选择'
    toast.error('日期格式无效，请重新选择')
    saving.value = false
    return
  }
  
  try {
    let response
    
    if (isEditing.value) {
      // 更新现有笔记
      response = await updateNote(note.value._id!, {
        title: note.value.title,
        content: note.value.content,
        completed: note.value.completed,
        createdAt: note.value.createdAt
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
      // 保存成功后关闭弹窗并通知父组件
      toast.success(isEditing.value ? '事件更新成功' : '事件创建成功')
      closeModal(true)
      emit('saved')
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

const closeModal = (event?: MouseEvent | boolean) => {
  const fromSave = event === true

  if (!fromSave && (isEditing.value || note.value.title?.trim() || note.value.content?.trim())) {
    // 如果不是保存操作，且有内容修改，则显示确认框
    toast.confirm('确定要放弃当前编辑吗？', {
      onConfirm: () => {
        emit('update:show', false)
      }
    })
  } else {
    // 如果是保存后关闭或没有内容，直接关闭
    emit('update:show', false)
  }
}

const toggleStatus = (status: boolean) => {
  note.value.completed = status
}
</script>

<template>
  <div v-if="show" class="modal" @click.self="closeModal">
    <div class="modal-content">
      <div class="modal-header">
        <h3>{{ isEditing ? '编辑事件' : '新建事件' }}</h3>
        <span class="material-icons-round close-btn" @click="closeModal">close</span>
      </div>
      
      <div v-if="error" class="error-message">
        {{ error }}
      </div>
      
      <div class="modal-body">
        <div class="form-group">
          <label>日期</label>
          <input type="date" v-model="dateValue" required>
        </div>
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
        <button class="cancel-btn" @click="closeModal">取消</button>
        <button class="save-btn" @click="saveNote" :disabled="saving">
          {{ saving ? '保存中...' : '保存' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  max-width: 600px;
  width: 90%;
  overflow: hidden;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #374151;
  margin: 0;
}

.close-btn {
  cursor: pointer;
  color: #6b7280;
}

.error-message {
  background-color: #fee2e2;
  color: #b91c1c;
  padding: 16px 24px;
  font-size: 14px;
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

.form-group input[type="date"],
.form-group input[type="time"],
.form-group input[type="text"],
.form-group textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 16px;
  margin-bottom: 8px;
  box-sizing: border-box;
}

.form-group textarea {
  resize: vertical;
  min-height: 100px;
  max-height: 300px;
  overflow-y: auto;
}

/* 自定义滚动条样式 */
.form-group textarea::-webkit-scrollbar {
  width: 8px;
}

.form-group textarea::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.form-group textarea::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.form-group textarea::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
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
</style> 