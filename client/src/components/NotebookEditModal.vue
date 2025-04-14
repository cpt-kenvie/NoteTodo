<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { createNotebook, updateNotebook } from '../api'
import type { Notebook as NotebookType } from '../api'
import { toast } from '../plugins/toast'
import MarkdownEditor from './MarkdownEditor.vue'

const props = defineProps<{
  show: boolean
  editingNotebook: Partial<NotebookType> | null
}>()

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void
  (e: 'saved', data: Partial<NotebookType>): void
}>()

const notebook = ref<Partial<NotebookType>>({
  _id: '',
  title: '',
  description: '',
})

const saving = ref(false)
const error = ref('')

// 计算当前是编辑还是创建
const isEditing = computed(() => !!notebook.value._id)

// 重置表单函数必须在watch之前定义
const resetForm = () => {
  notebook.value = {
    _id: '',
    title: '',
    description: '',
  }
  error.value = ''
}

// 监听props变化，更新本地数据
watch(() => props.editingNotebook, (newVal) => {
  if (newVal) {
    notebook.value = { ...newVal }
  } else {
    resetForm()
  }
}, { immediate: true })

// 监听show属性，当弹窗关闭时重置表单
watch(() => props.show, (newVal) => {
  if (!newVal) {
    resetForm()
  }
})

const saveNotebook = async () => {
  // 验证表单
  if (!notebook.value.title?.trim()) {
    toast.warning('标题不能为空')
    return
  }
  
  saving.value = true
  error.value = ''
  
  try {
    let response
    
    if (isEditing.value) {
      // 更新现有笔记本
      response = await updateNotebook(notebook.value._id!, {
        title: notebook.value.title,
        description: notebook.value.description
      })
    } else {
      // 创建新笔记本
      response = await createNotebook({
        title: notebook.value.title,
        description: notebook.value.description
      })
    }
    
    if (response.success) {
      // 保存成功后关闭弹窗并通知父组件(带上保存的笔记本数据)
      toast.success(isEditing.value ? '笔记本更新成功' : '笔记本创建成功')
      closeModal(true)
      emit('saved', response.data)
    } else {
      error.value = response.error || '保存笔记本失败'
      toast.error(response.error || '保存笔记本失败')
    }
  } catch (err: any) {
    console.error('保存笔记本出错:', err)
    error.value = err.message || '无法连接到服务器'
    toast.error(err.message || '无法连接到服务器')
  } finally {
    saving.value = false
  }
}

const closeModal = (event?: MouseEvent | boolean) => {
  const fromSave = event === true

  if (!fromSave && (isEditing.value || notebook.value.title?.trim() || notebook.value.description?.trim())) {
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
</script>

<template>
  <div v-if="show" class="modal" @click.self="closeModal">
    <div class="modal-content">
      <div class="modal-header">
        <h3>{{ isEditing ? '编辑笔记本' : '新建笔记本' }}</h3>
        <span class="material-icons-round close-btn" @click="closeModal">close</span>
      </div>
      
      <div v-if="error" class="error-message">
        {{ error }}
      </div>
      
      <div class="modal-body">
        <div class="form-group">
          <label>笔记本标题</label>
          <input type="text" v-model="notebook.title" placeholder="请输入笔记本标题">
        </div>
        <div class="form-group">
          <label>描述(支持 Markdown)</label>
          <MarkdownEditor
            v-model="notebook.description"
            placeholder="笔记本描述"
            :autoResize="false"
          />
          <div class="markdown-hint">
            支持Markdown格式，可使用工具栏添加加粗、代码块等效果，点击<span class="material-icons-round">visibility</span>预览效果
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="cancel-btn" @click="closeModal">取消</button>
        <button class="save-btn" @click="saveNotebook" :disabled="saving">
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

.markdown-hint {
  font-size: 13px;
  color: #6b7280;
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.markdown-hint .material-icons-round {
  font-size: 16px;
  color: #6366f1;
}
</style> 