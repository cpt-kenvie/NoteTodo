<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { getAllNotebooks, deleteNotebook, getNotebookById, createNotebook, updateNotebook } from '../api'
import type { Notebook as NotebookType, Note as NoteType } from '../api'
import NotebookEditModal from '../components/NotebookEditModal.vue'
import NotebookViewModal from '../components/NotebookViewModal.vue'
import ViewNoteModal from '../components/ViewNoteModal.vue'
import GlobalViewModal from '../components/GlobalViewModal.vue'
import AppLayout from '../components/AppLayout.vue'
import { toast } from '../plugins/toast'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import 'highlight.js/styles/github.css'
import MarkdownEditor from '../components/MarkdownEditor.vue'

// 初始化 markdown-it
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight: function (str: string, lang: string) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(str, { language: lang }).value
      } catch (__) {}
    }
    return '' // 使用外部默认转义
  }
})

// 尝试添加 emoji 插件
try {
  // @ts-ignore: 忽略类型问题
  const emoji = require('markdown-it-emoji')
  md.use(emoji)
} catch (error) {
  console.warn('无法加载 emoji 插件:', error)
}

const notebooks = ref<NotebookType[]>([])
const loading = ref(false)
const error = ref('')
const searchQuery = ref('')
const showModal = ref(false)
const currentNotebook = ref<NotebookType | null>(null)
const showViewModal = ref(false)
const viewingNotebook = ref<NotebookType | null>(null)
const showNoteModal = ref(false)
const viewingNote = ref<NoteType | null>(null)

// 内联编辑区域的状态控制
const showInlineEditor = ref(false)
const inlineNotebook = ref<Partial<NotebookType>>({
  _id: '',
  title: '',
  description: '',
})
const inlineSaving = ref(false)
const inlineError = ref('')

// 内联查看变量
const showInlineViewer = ref(false)
const inlineLoading = ref(false)
const isViewerCollapsed = ref(false)

// 全局模态框引用
const globalModalRef = ref(null)

// 从API获取所有笔记本
const fetchNotebooks = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const response = await getAllNotebooks()
    if (response.success) {
      notebooks.value = response.data
    } else {
      error.value = response.error || '获取笔记本失败'
    }
  } catch (err: any) {
    console.error('获取笔记本出错:', err)
    error.value = err.message || '无法连接到服务器'
  } finally {
    loading.value = false
  }
}

// 获取笔记本统计信息
const statsInfo = computed(() => {
  return {
    total: notebooks.value.length
  }
})

// 处理搜索
const handleSearch = (query: string) => {
  searchQuery.value = query
}

// 筛选后的笔记本列表
const filteredNotebooks = computed(() => {
  if (!searchQuery.value) return notebooks.value
  
  const query = searchQuery.value.toLowerCase()
  return notebooks.value.filter(notebook => {
    return notebook.title.toLowerCase().includes(query) || 
           (notebook.description && notebook.description.toLowerCase().includes(query))
  })
})

// 切换到编辑模式
const switchToEdit = (notebook: NotebookType) => {
  if (showInlineViewer.value) {
    closeInlineViewer()
  }
  openInlineEditor(notebook)
}

// 切换到预览模式
const switchToPreview = (notebook: NotebookType) => {
  if (showInlineEditor.value) {
    // 如果有内容修改，显示确认框
    if (inlineNotebook.value._id || inlineNotebook.value.title?.trim() || inlineNotebook.value.description?.trim()) {
      toast.confirm('切换将丢失当前编辑内容，确定要继续吗？', {
        onConfirm: () => {
          closeInlineEditor()
          openInlineViewer(notebook)
        }
      })
    } else {
      closeInlineEditor()
      openInlineViewer(notebook)
    }
  } else {
    openInlineViewer(notebook)
  }
}

// 修改打开内联编辑区域
const openInlineEditor = (notebook: NotebookType | null = null) => {
  // 如果预览正在显示，先关闭它
  if (showInlineViewer.value) {
    closeInlineViewer()
  }

  if (notebook) {
    inlineNotebook.value = { ...notebook }
  } else {
    inlineNotebook.value = {
      _id: '',
      title: '',
      description: '',
    }
  }
  showInlineEditor.value = true
}

// 修改打开内联查看区域
const openInlineViewer = async (notebook: NotebookType) => {
  // 如果编辑正在显示，先关闭它
  if (showInlineEditor.value) {
    // 检查是否有修改内容
    if (inlineNotebook.value._id || inlineNotebook.value.title?.trim() || inlineNotebook.value.description?.trim()) {
      toast.confirm('切换将丢失当前编辑内容，确定要继续吗？', {
        onConfirm: () => {
          closeInlineEditor()
          loadAndShowViewer(notebook)
        }
      })
      return
    } else {
      closeInlineEditor()
    }
  }
  
  loadAndShowViewer(notebook)
}

// 加载并显示预览
const loadAndShowViewer = async (notebook: NotebookType) => {
  inlineLoading.value = true
  
  try {
    // 获取笔记本详情
    const response = await getNotebookById(notebook._id)
    
    if (response.success) {
      viewingNotebook.value = response.data
      showInlineViewer.value = true
      
      // 滚动到查看区域
      setTimeout(() => {
        document.getElementById('inline-viewer')?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    } else {
      toast.error(response.error || '获取笔记本详情失败')
    }
  } catch (err: any) {
    console.error('获取笔记本详情出错:', err)
    toast.error(err.message || '无法连接到服务器')
  } finally {
    inlineLoading.value = false
  }
}

// 关闭内联编辑区域
const closeInlineEditor = () => {
  showInlineEditor.value = false
  inlineNotebook.value = {
    _id: '',
    title: '',
    description: '',
  }
  inlineError.value = ''
}

// 折叠/展开内联查看区域
const toggleViewerCollapse = () => {
  isViewerCollapsed.value = !isViewerCollapsed.value
}

// 删除笔记本
const handleDelete = (id: string) => {
  toast.confirm('确定要删除这个笔记本吗？', {
    type: 'warning',
    onConfirm: async () => {
      try {
        const response = await deleteNotebook(id)
        
        if (response.success) {
          toast.success('笔记本已删除')
          // 刷新笔记本列表
          fetchNotebooks()
        } else {
          toast.error(response.error || '删除笔记本失败')
        }
      } catch (err: any) {
        console.error('删除笔记本出错:', err)
        toast.error(err.message || '删除笔记本失败')
      }
    }
  })
}

// 笔记本保存成功后的处理
const handleSaved = (notebook: Partial<NotebookType>) => {
  fetchNotebooks()
  
  // 如果有笔记本数据，切换到预览模式
  if (notebook && notebook._id) {
    setTimeout(() => {
      switchToPreview(notebook as NotebookType)
    }, 300)
  }
}

// 格式化日期
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// 渲染 markdown
const renderMarkdown = (text: string | undefined) => {
  return md.render(text ?? '')
}

// 内联保存笔记本
const saveInlineNotebook = async () => {
  // 验证表单
  if (!inlineNotebook.value.title?.trim()) {
    toast.warning('标题不能为空')
    return
  }
  
  inlineSaving.value = true
  inlineError.value = ''
  
  try {
    let response
    let savedNotebook
    
    if (inlineNotebook.value._id) {
      // 更新现有笔记本
      response = await updateNotebook(inlineNotebook.value._id, {
        title: inlineNotebook.value.title,
        description: inlineNotebook.value.description
      })
      if (response.success) {
        savedNotebook = response.data
      }
    } else {
      // 创建新笔记本
      response = await createNotebook({
        title: inlineNotebook.value.title,
        description: inlineNotebook.value.description
      })
      if (response.success) {
        savedNotebook = response.data
      }
    }
    
    if (response.success) {
      // 保存成功后先刷新笔记本列表
      toast.success(inlineNotebook.value._id ? '笔记本更新成功' : '笔记本创建成功')
      await fetchNotebooks()
      
      // 关闭编辑区域
      closeInlineEditor()
      
      // 如果有保存的笔记本，切换到预览模式
      if (savedNotebook) {
        setTimeout(() => {
          switchToPreview(savedNotebook)
        }, 300) // 短暂延迟确保编辑界面已完全关闭
      }
    } else {
      inlineError.value = response.error || '保存笔记本失败'
      toast.error(response.error || '保存笔记本失败')
    }
  } catch (err: any) {
    console.error('保存笔记本出错:', err)
    inlineError.value = err.message || '无法连接到服务器'
    toast.error(err.message || '无法连接到服务器')
  } finally {
    inlineSaving.value = false
  }
}

// 关闭内联查看区域
const closeInlineViewer = () => {
  showInlineViewer.value = false
  viewingNotebook.value = null
}

// 初始加载
onMounted(() => {
  fetchNotebooks()
})
</script>

<template>
  <AppLayout 
    title="笔记本" 
    searchPlaceholder="搜索笔记本..."
    @search="handleSearch"
  >
    <template #header-actions>
      <button class="add-task-btn" @click="openInlineEditor()">
        <span class="material-icons-round">add</span>
        新建笔记本
      </button>
    </template>

    <!-- 内联编辑区域 -->
    <div v-if="showInlineEditor" class="inline-editor">
      <div class="inline-editor-header">
        <h3>{{ inlineNotebook._id ? '编辑笔记本' : '新建笔记本' }}</h3>
        <button class="close-btn" @click="closeInlineEditor">
          <span class="material-icons-round">close</span>
        </button>
      </div>
      
      <div v-if="inlineError" class="error-message inline-error">
        {{ inlineError }}
      </div>
      
      <div class="inline-form">
        <div class="form-group">
          <label for="notebook-title">笔记本标题</label>
          <input 
            id="notebook-title"
            type="text" 
            v-model="inlineNotebook.title" 
            placeholder="请输入笔记本标题"
            autofocus
          >
        </div>
        <div class="form-group markdown-editor-wrapper">
          <label for="notebook-description">描述(支持 Markdown)</label>
          <MarkdownEditor
            v-model="inlineNotebook.description"
            placeholder="笔记本描述"
            :autoResize="false"
          />
          <div class="markdown-hint">
            支持Markdown格式，可使用工具栏添加加粗、代码块等效果，点击<span class="material-icons-round">visibility</span>预览效果
          </div>
        </div>
      </div>
      
      <div class="inline-actions">
        <button class="cancel-btn" @click="closeInlineEditor">取消</button>
        <button 
          class="save-btn" 
          @click="saveInlineNotebook" 
          :disabled="inlineSaving"
        >
          {{ inlineSaving ? '保存中...' : '保存' }}
        </button>
      </div>
    </div>

    <!-- 内联查看区域 -->
    <div v-if="showInlineViewer" id="inline-viewer" class="inline-viewer" :class="{ 'collapsed': isViewerCollapsed }">
      <div class="inline-viewer-header">
        <h3>{{ viewingNotebook?.title }}</h3>
        <div class="viewer-actions">
          <button class="action-btn edit" @click="switchToEdit(viewingNotebook!)" title="编辑笔记本">
            <span class="material-icons-round">edit</span>
          </button>
          <button class="action-btn" @click="toggleViewerCollapse" title="折叠/展开">
            <span class="material-icons-round">{{ isViewerCollapsed ? 'expand_more' : 'expand_less' }}</span>
          </button>
          <button class="close-btn" @click="closeInlineViewer">
            <span class="material-icons-round">close</span>
          </button>
        </div>
      </div>
      
      <div v-if="inlineLoading" class="inline-loading">
        <span class="material-icons-round loading-icon">sync</span>
        <span>加载中...</span>
      </div>
      
      <div v-else class="inline-viewer-content" v-show="!isViewerCollapsed">
        <div class="notebook-meta viewer-meta">
          <div class="meta-item">
            <span class="material-icons-round">event</span>
            <span>创建于: {{ formatDate(viewingNotebook?.createdAt || '') }}</span>
          </div>
        </div>
        
        <div class="notebook-description viewer-description" v-if="viewingNotebook?.description">
          <h4>笔记本描述</h4>
          <div 
            class="description-text markdown-content" 
            v-html="renderMarkdown(viewingNotebook?.description)"
          ></div>
        </div>
      </div>
    </div>

    <div class="stats-container">
      <div class="stat-card">
        <div class="stat-value">{{ statsInfo.total }}</div>
        <div class="stat-label">笔记本总数</div>
      </div>
    </div>

    <div v-if="error" class="error-message">
      {{ error }}
      <button @click="fetchNotebooks" class="retry-btn">重试</button>
    </div>
    
    <div v-if="loading" class="loading">
      <span class="material-icons-round loading-icon">sync</span>
      加载中...
    </div>
    
    <div v-else-if="filteredNotebooks.length === 0" class="empty-state">
      <span class="material-icons-round">auto_stories</span>
      <p v-if="notebooks.length === 0">您还没有创建任何笔记本</p>
      <p v-else>没有找到匹配的笔记本</p>
      <button class="primary-btn" @click="openInlineEditor()">创建笔记本</button>
    </div>
    
    <div v-else class="notebooks-list">
      <div 
        v-for="notebook in filteredNotebooks" 
        :key="notebook._id"
        class="notebook-item"
      >
        <div class="notebook-main" @click="switchToPreview(notebook)">
          <div class="notebook-title">
            <h3>{{ notebook.title }}</h3>
          </div>
          
          <div class="notebook-meta">
            <div class="meta-item">
              <span class="material-icons-round">event</span>
              <span>{{ formatDate(notebook.createdAt) }}</span>
            </div>
          </div>
          
          <div class="notebook-description" @click="switchToPreview(notebook)">
            {{ notebook.description || '无描述' }}
          </div>
        </div>
        
        <div class="notebook-actions">
          <button class="action-btn view" @click="switchToPreview(notebook)" title="查看笔记本">
            <span class="material-icons-round">visibility</span>
          </button>
          <button class="action-btn edit" @click="switchToEdit(notebook)" title="编辑笔记本">
            <span class="material-icons-round">edit</span>
          </button>
          <button class="action-btn delete" @click="handleDelete(notebook._id)" title="删除笔记本">
            <span class="material-icons-round">delete</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 组件 -->
    <NotebookEditModal 
      v-model:show="showModal"
      :editing-notebook="currentNotebook"
      @saved="handleSaved"
    />

    <NotebookViewModal 
      v-model:show="showViewModal"
      :notebook="viewingNotebook"
      @refresh="fetchNotebooks"
    />
    
    <ViewNoteModal 
      v-model:show="showNoteModal"
      :note="viewingNote"
    />
    
    <GlobalViewModal ref="globalModalRef" />
  </AppLayout>
</template>

<style scoped>
/* 内联编辑器样式 */
.inline-editor {
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
  overflow: visible;
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.inline-editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
  background-color: #f9fafb;
  flex-shrink: 0;
}

.inline-editor-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #374151;
}

.inline-form {
  padding: 20px;
  overflow-y: visible;
}

.form-group {
  margin-bottom: 20px;
}

/* 添加编辑器容器的最大高度 */
.form-group:has(.markdown-editor-container) {
  max-height: 600px;
  overflow: visible;
}

.inline-error {
  margin: 0;
  border-radius: 0;
}

.inline-actions {
  display: flex;
  justify-content: flex-end;
  padding: 16px 20px;
  background-color: #f9fafb;
  border-top: 1px solid #e5e7eb;
  gap: 12px;
}

/* 内联查看器样式 */
.inline-viewer {
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
  overflow: visible;
  animation: slideDown 0.3s ease;
  transition: all 0.3s ease;
}

.inline-viewer.collapsed {
  margin-bottom: 12px;
}

.inline-viewer.collapsed .inline-viewer-header {
  border-bottom: none;
}

.inline-viewer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
  background-color: #f9fafb;
  transition: border-bottom 0.3s ease;
  flex-shrink: 0;
}

.viewer-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.action-btn {
  background: none;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  cursor: pointer;
  width: 32px;
  height: 32px;
  border-radius: 4px;
  transition: all 0.2s;
}

.action-btn:hover {
  background-color: #f3f4f6;
  color: #4b5563;
}

.inline-viewer-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #374151;
}

.inline-viewer-content {
  padding: 20px;
}

.viewer-description {
  margin-top: 20px;
}

.description-text {
  line-height: 1.6;
  white-space: pre-wrap;
  color: #4b5563;
  background-color: #f9fafb;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
  border-left: 3px solid #6366f1;
  overflow-wrap: break-word;
  word-break: break-word;
  max-height: 700px;
  overflow-y: auto;
}

.inline-loading {
  text-align: center;
  padding: 40px;
  color: #6b7280;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.viewer-meta {
  margin: 0 0 20px 0;
  padding: 12px;
}

.viewer-description h4,
.notebook-notes h4 {
  font-size: 16px;
  color: #374151;
  margin-bottom: 10px;
}

.viewer-notes {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.empty-notes {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px 0;
  color: #9ca3af;
  text-align: center;
}

.empty-notes .material-icons-round {
  font-size: 36px;
  margin-bottom: 12px;
}

.remove-btn {
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.remove-btn:hover {
  color: #ef4444;
  background-color: rgba(239, 68, 68, 0.1);
}

.remove-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.close-btn {
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: 4px;
}

.close-btn:hover {
  background-color: #f3f4f6;
  color: #111827;
}

.stats-container {
  display: flex;
  gap: 20px;
  margin-bottom: 24px;
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

/* 列表式布局 */
.notebooks-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.notebook-item {
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: background-color 0.2s, transform 0.2s;
  cursor: pointer;
}

.notebook-item:hover {
  background-color: #f9fafb;
  transform: translateX(4px);
}

.notebook-main {
  flex-grow: 1;
  overflow: hidden;
  cursor: pointer;
}

.notebook-title h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
  color: #111827;
}

.notebook-meta {
  display: flex;
  gap: 16px;
  margin-bottom: 8px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #6b7280;
  font-size: 13px;
}

.meta-item .material-icons-round {
  font-size: 16px;
  color: #6366f1;
}

.notebook-description {
  color: #4b5563;
  font-size: 14px;
  line-height: 1.5;
  text-overflow: ellipsis;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.notebook-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.action-btn {
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  width: 36px;
  height: 36px;
  border-radius: 4px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn:hover {
  background-color: #f3f4f6;
}

.action-btn.view:hover {
  color: #6366f1;
}

.action-btn.edit:hover {
  color: #f59e0b;
  background-color: rgba(245, 158, 11, 0.1);
}

.action-btn.delete:hover {
  color: #ef4444;
  background-color: rgba(239, 68, 68, 0.1);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.empty-state .material-icons-round {
  font-size: 48px;
  color: #9ca3af;
  margin-bottom: 16px;
}

.empty-state p {
  color: #6b7280;
  margin-bottom: 24px;
}

.primary-btn {
  background-color: #6366f1;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.primary-btn:hover {
  background-color: #4f46e5;
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

/* 表单样式 */
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

/* 响应式调整 */
@media (max-width: 768px) {
  .stats-container {
    flex-direction: column;
    gap: 12px;
  }
}

/* Markdown 内容样式 */
:deep(.markdown-content) {
  line-height: 1.6;
  white-space: normal;
  overflow-wrap: break-word;
  word-break: break-word;
}

:deep(.markdown-content) h1,
:deep(.markdown-content) h2,
:deep(.markdown-content) h3,
:deep(.markdown-content) h4,
:deep(.markdown-content) h5,
:deep(.markdown-content) h6 {
  margin-top: 1.5em;
  margin-bottom: 0.5em;
  line-height: 1.2;
}

:deep(.markdown-content) h1 {
  font-size: 1.8em;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 0.3em;
}

:deep(.markdown-content) h2 {
  font-size: 1.5em;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 0.3em;
}

:deep(.markdown-content) h3 {
  font-size: 1.25em;
}

:deep(.markdown-content) h4 {
  font-size: 1em;
}

:deep(.markdown-content) p,
:deep(.markdown-content) ul,
:deep(.markdown-content) ol,
:deep(.markdown-content) blockquote {
  margin-bottom: 1em;
}

:deep(.markdown-content) a {
  color: #3b82f6;
  text-decoration: none;
}

:deep(.markdown-content) a:hover {
  text-decoration: underline;
}

:deep(.markdown-content) blockquote {
  border-left: 4px solid #e5e7eb;
  padding-left: 1em;
  color: #6b7280;
}

:deep(.markdown-content) code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  background-color: #f3f4f6;
  padding: 0.2em 0.4em;
  border-radius: 3px;
  font-size: 0.9em;
  max-width: 100%;
  overflow-wrap: break-word;
  word-break: break-word;
}

:deep(.markdown-content) pre {
  background-color: #f3f4f6;
  padding: 1em;
  border-radius: 6px;
  overflow-x: auto;
  margin-bottom: 1em;
  white-space: pre-wrap;
  max-width: 100%;
}

:deep(.markdown-content) pre code {
  background-color: transparent;
  padding: 0;
  font-size: 0.9em;
  line-height: 1.5;
}

:deep(.markdown-content) ul,
:deep(.markdown-content) ol {
  padding-left: 2em;
}

:deep(.markdown-content) img {
  max-width: 100%;
  height: auto;
  border-radius: 6px;
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

.markdown-editor-wrapper {
  max-height: 600px;
  overflow: visible;
}
</style> 