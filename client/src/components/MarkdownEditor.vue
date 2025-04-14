<script setup lang="ts">
import { ref, watch, defineProps, defineEmits, onMounted, nextTick } from 'vue'
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
  // 动态导入 emoji 插件
  // @ts-ignore: 忽略类型问题
  const emoji = require('markdown-it-emoji')
  md.use(emoji)
} catch (error) {
  console.warn('无法加载 emoji 插件:', error)
}

const props = defineProps<{
  modelValue: string | undefined
  placeholder?: string
  height?: string
  autoResize?: boolean // 新增自适应高度选项
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

// 确保 content 始终是字符串类型
const content = ref<string>(props.modelValue ?? '')
const isPreview = ref(false)
const editorHeight = props.height || 'auto' // 默认为auto
const textareaRef = ref<HTMLTextAreaElement | null>(null)

// 监听 modelValue 变化，更新本地内容
watch(() => props.modelValue, (newValue) => {
  content.value = newValue ?? ''
})

// 监听本地内容变化，同步到父组件
watch(() => content.value, (newValue) => {
  emit('update:modelValue', newValue)
  if (props.autoResize) {
    nextTick(() => {
      adjustHeight()
    })
  }
})

// 调整文本区域的高度
const adjustHeight = () => {
  if (!textareaRef.value || !props.autoResize) return
  
  // 如果内容过长，不再调整高度，而是使用滚动条
  if (textareaRef.value.scrollHeight > 500) return
  
  // 重置高度以获取正确的scrollHeight
  textareaRef.value.style.height = 'auto'
  
  // 设置新高度 (最小高度为250px，最大高度为500px)
  const newHeight = Math.min(Math.max(textareaRef.value.scrollHeight, 250), 500)
  textareaRef.value.style.height = `${newHeight}px`
}

// 组件挂载后初始化高度
onMounted(() => {
  if (props.autoResize) {
    nextTick(() => {
      adjustHeight()
    })
  }
})

// 添加 markdown 语法
const addSyntax = (syntax: string, placeholder: string = '') => {
  const textarea = textareaRef.value
  if (!textarea) return

  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const selectedText = content.value.substring(start, end)
  
  let replacement = ''
  
  switch (syntax) {
    case 'bold':
      replacement = `**${selectedText || placeholder}**`
      break
    case 'italic':
      replacement = `*${selectedText || placeholder}*`
      break
    case 'heading':
      replacement = `## ${selectedText || placeholder}`
      break
    case 'link':
      replacement = `[${selectedText || '链接文本'}](https://example.com)`
      break
    case 'image':
      replacement = `![${selectedText || '图片描述'}](https://example.com/image.jpg)`
      break
    case 'code':
      replacement = `\`${selectedText || placeholder}\``
      break
    case 'codeblock':
      replacement = `\`\`\`\n${selectedText || placeholder}\n\`\`\``
      break
    case 'list':
      replacement = `- ${selectedText || placeholder}`
      break
    case 'quote':
      replacement = `> ${selectedText || placeholder}`
      break
  }
  
  // 更新内容
  const newContent = content.value.substring(0, start) + replacement + content.value.substring(end)
  content.value = newContent
  
  // 使文本区域重新获得焦点，光标放在插入的文本后
  setTimeout(() => {
    textarea.focus()
    const newCursorPos = start + replacement.length
    textarea.setSelectionRange(newCursorPos, newCursorPos)
  }, 0)
}

// 切换预览模式
const togglePreview = () => {
  isPreview.value = !isPreview.value
}

// 渲染 markdown
const renderMarkdown = (text: string | undefined) => {
  return md.render(text ?? '')
}
</script>

<template>
  <div class="markdown-editor-container">
    <div class="toolbar">
      <button type="button" @click="addSyntax('bold', '粗体文本')" title="粗体">
        <span class="material-icons-round">format_bold</span>
      </button>
      <button type="button" @click="addSyntax('italic', '斜体文本')" title="斜体">
        <span class="material-icons-round">format_italic</span>
      </button>
      <button type="button" @click="addSyntax('heading', '标题')" title="标题">
        <span class="material-icons-round">title</span>
      </button>
      <button type="button" @click="addSyntax('link')" title="链接">
        <span class="material-icons-round">link</span>
      </button>
      <button type="button" @click="addSyntax('image')" title="图片">
        <span class="material-icons-round">image</span>
      </button>
      <button type="button" @click="addSyntax('code', '行内代码')" title="行内代码">
        <span class="material-icons-round">code</span>
      </button>
      <button type="button" @click="addSyntax('codeblock', '代码块')" title="代码块">
        <span class="material-icons-round">integration_instructions</span>
      </button>
      <button type="button" @click="addSyntax('list', '列表项')" title="列表">
        <span class="material-icons-round">format_list_bulleted</span>
      </button>
      <button type="button" @click="addSyntax('quote', '引用文本')" title="引用">
        <span class="material-icons-round">format_quote</span>
      </button>
      <div class="spacer"></div>
      <button 
        type="button" 
        @click="togglePreview" 
        class="preview-btn"
        :class="{ 'active': isPreview }"
        title="预览"
      >
        <span class="material-icons-round">visibility</span>
      </button>
    </div>
    
    <div class="editor-area" :style="{
      height: !props.autoResize ? editorHeight : 'auto', 
      minHeight: props.autoResize ? '250px' : undefined
    }">
      <textarea
        v-if="!isPreview"
        id="markdown-editor"
        ref="textareaRef"
        v-model="content"
        :placeholder="placeholder || '请输入 Markdown 内容...'"
        @input="props.autoResize ? adjustHeight() : null"
        :style="{ minHeight: props.autoResize ? '250px' : undefined }"
      ></textarea>
      <div 
        v-else 
        class="preview" 
        v-html="renderMarkdown(content)"
        :style="{ minHeight: props.autoResize ? '250px' : undefined }"
      ></div>
    </div>
    
    <div class="markdown-help">
      <p>支持 Markdown 语法，可使用工具栏添加格式</p>
    </div>
  </div>
</template>

<style scoped>
.markdown-editor-container {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
}

.toolbar {
  display: flex;
  padding: 8px;
  background-color: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  flex-wrap: wrap;
}

.toolbar button {
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  width: 32px;
  height: 32px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 4px;
  transition: all 0.2s;
}

.toolbar button:hover {
  background-color: #f3f4f6;
  color: #4b5563;
}

.toolbar button.active {
  background-color: #e5e7eb;
  color: #374151;
}

.spacer {
  flex-grow: 1;
}

.preview-btn {
  margin-left: auto;
}

.editor-area {
  position: relative;
  display: flex;
  max-height: 500px;
  overflow: hidden;
}

.editor-area textarea {
  width: 100%;
  padding: 16px;
  border: none;
  resize: none;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 14px;
  line-height: 1.6;
  color: #374151;
  outline: none;
  overflow-y: auto;
  min-height: 250px;
  height: 1100px;
  max-height: 1200px;
}

.preview {
  padding: 16px;
  height: 100%;
  overflow-y: auto;
  background-color: #fff;
  width: 100%;
  max-height: 500px;
}

.markdown-help {
  padding: 8px 16px;
  font-size: 12px;
  color: #6b7280;
  background-color: #f9fafb;
  border-top: 1px solid #e5e7eb;
}

:deep(.preview) h1,
:deep(.preview) h2,
:deep(.preview) h3,
:deep(.preview) h4,
:deep(.preview) h5,
:deep(.preview) h6 {
  margin-top: 1.5em;
  margin-bottom: 0.5em;
  line-height: 1.2;
}

:deep(.preview) h1 {
  font-size: 1.8em;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 0.3em;
}

:deep(.preview) h2 {
  font-size: 1.5em;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 0.3em;
}

:deep(.preview) h3 {
  font-size: 1.25em;
}

:deep(.preview) h4 {
  font-size: 1em;
}

:deep(.preview) p,
:deep(.preview) ul,
:deep(.preview) ol,
:deep(.preview) blockquote {
  margin-bottom: 1em;
}

:deep(.preview) a {
  color: #3b82f6;
  text-decoration: none;
}

:deep(.preview) a:hover {
  text-decoration: underline;
}

:deep(.preview) blockquote {
  border-left: 4px solid #e5e7eb;
  padding-left: 1em;
  color: #6b7280;
}

:deep(.preview) code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  background-color: #f3f4f6;
  padding: 0.2em 0.4em;
  border-radius: 3px;
  font-size: 0.9em;
}

:deep(.preview) pre {
  background-color: #f3f4f6;
  padding: 1em;
  border-radius: 6px;
  overflow-x: auto;
  margin-bottom: 1em;
}

:deep(.preview) pre code {
  background-color: transparent;
  padding: 0;
  font-size: 0.9em;
  line-height: 1.5;
}

:deep(.preview) ul,
:deep(.preview) ol {
  padding-left: 2em;
}

:deep(.preview) img {
  max-width: 100%;
  border-radius: 6px;
}
</style> 