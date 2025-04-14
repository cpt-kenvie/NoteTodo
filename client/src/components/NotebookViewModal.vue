<script setup lang="ts">
import { ref } from 'vue'
import type { Notebook as NotebookType } from '../api'
import { toast } from '../plugins/toast'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import 'highlight.js/styles/github.css'

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

const props = defineProps<{
  show: boolean
  notebook: NotebookType | null
}>()

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void
  (e: 'close'): void
  (e: 'refresh'): void
}>()

const loading = ref(false)

const closeModal = () => {
  emit('update:show', false)
  emit('close')
}

// 格式化日期
const formatDate = (dateString: string) => {
  if (!dateString) return ''
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
</script>

<template>
  <teleport to="body">
    <div v-if="show" class="modal-overlay" @click="closeModal">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <h3>{{ notebook?.title }}</h3>
          <span class="material-icons-round close-btn" @click="closeModal">close</span>
        </div>
        
        <div class="modal-content">
          <div class="notebook-meta">
            <div class="meta-item">
              <span class="material-icons-round">event</span>
              <span>创建于: {{ formatDate(notebook?.createdAt || '') }}</span>
            </div>
          </div>
          
          <div class="notebook-description" v-if="notebook?.description">
            <h4>笔记本描述</h4>
            <div 
              class="description-text markdown-content" 
              v-html="renderMarkdown(notebook?.description)"
            ></div>
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

.notebook-meta {
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
  color: #6366f1;
}

.notebook-description h4 {
  font-size: 16px;
  color: #374151;
  margin-bottom: 10px;
}

.description-text {
  white-space: pre-wrap;
  color: #4b5563;
  background-color: #f9fafb;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
  border-left: 3px solid #6366f1;
}

@media (max-width: 640px) {
  .notebook-meta {
    flex-direction: column;
    gap: 8px;
  }
}

/* Markdown 样式 */
:deep(.markdown-content) {
  line-height: 1.6;
  white-space: normal;
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
}

:deep(.markdown-content) pre {
  background-color: #f3f4f6;
  padding: 1em;
  border-radius: 6px;
  overflow-x: auto;
  margin-bottom: 1em;
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
  border-radius: 6px;
}
</style> 