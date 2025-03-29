<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, computed } from 'vue'

interface Props {
  show: boolean
  message: string
  type?: 'success' | 'error' | 'info' | 'warning'
  actionType?: 'message' | 'confirm' // 新增类型：纯消息或需要确认的消息
  duration?: number
  position?: 'top' | 'bottom'
  confirmText?: string
  cancelText?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'info',
  actionType: 'message',
  duration: 3000,
  position: 'top',
  confirmText: '确认',
  cancelText: '取消'
})

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()

const visible = ref(props.show)
const timer = ref<number | null>(null)
const remainingTime = ref(props.duration)
const intervalTimer = ref<number | null>(null)
const progress = ref(100)

// 监听show变化
watch(() => props.show, (newVal) => {
  visible.value = newVal
  if (newVal) {
    remainingTime.value = props.duration
    progress.value = 100
    if (props.duration > 0) {
      startTimer()
      startProgressTimer()
    }
  } else {
    clearAllTimers()
  }
})

// 开始计时器，自动关闭
const startTimer = () => {
  if (timer.value) {
    clearTimeout(timer.value)
  }
  
  timer.value = window.setTimeout(() => {
    closeToast()
  }, props.duration)
}

// 开始进度条计时器
const startProgressTimer = () => {
  if (intervalTimer.value) {
    clearInterval(intervalTimer.value)
  }
  
  const updateInterval = 10 // 每10毫秒更新一次
  const steps = props.duration / updateInterval
  const stepValue = 100 / steps
  
  intervalTimer.value = window.setInterval(() => {
    remainingTime.value -= updateInterval
    progress.value -= stepValue
    
    if (remainingTime.value <= 0) {
      clearInterval(intervalTimer.value as number)
      intervalTimer.value = null
    }
  }, updateInterval)
}

// 清除所有定时器
const clearAllTimers = () => {
  if (timer.value) {
    clearTimeout(timer.value)
    timer.value = null
  }
  
  if (intervalTimer.value) {
    clearInterval(intervalTimer.value)
    intervalTimer.value = null
  }
}

// 关闭toast
const closeToast = () => {
  visible.value = false
  emit('update:show', false)
}

// 确认按钮处理
const handleConfirm = () => {
  emit('confirm')
  closeToast()
}

// 取消按钮处理
const handleCancel = () => {
  emit('cancel')
  closeToast()
}

// 组件挂载时处理
onMounted(() => {
  if (props.show && props.duration > 0) {
    startTimer()
    startProgressTimer()
  }
})

// 组件卸载时清理定时器
onUnmounted(() => {
  clearAllTimers()
})

// 根据类型获取图标
const getIcon = () => {
  switch (props.type) {
    case 'success':
      return 'check_circle'
    case 'error':
      return 'error'
    case 'warning':
      return 'warning'
    case 'info':
    default:
      return 'info'
  }
}

// 根据类型获取颜色类
const getTypeClass = () => {
  return `toast-${props.type}`
}

// 格式化剩余时间（秒）
const formattedRemainingTime = computed(() => {
  return (remainingTime.value / 1000).toFixed(1)
})
</script>

<template>
  <transition name="toast-fade">
    <div 
      v-if="visible" 
      class="toast-message" 
      :class="[getTypeClass(), `position-${position}`, { 'toast-with-actions': actionType === 'confirm' }]"
    >
      <div class="toast-icon">
        <span class="material-icons-round">{{ getIcon() }}</span>
      </div>
      <div class="toast-content">{{ message }}</div>
      
      <!-- 确认/取消按钮 -->
      <div v-if="actionType === 'confirm'" class="toast-actions">
        <button class="toast-action-btn cancel-btn" @click="handleCancel">{{ cancelText }}</button>
        <button class="toast-action-btn confirm-btn" @click="handleConfirm">{{ confirmText }}</button>
      </div>
      
      <!-- 关闭按钮，只在message类型下显示 -->
      <div v-else class="toast-close" @click="closeToast">
        <span class="material-icons-round">close</span>
      </div>
      
      <!-- 进度条和剩余时间 -->
      <div class="toast-timer-container">
        <div class="toast-remaining-time">{{ formattedRemainingTime }}s</div>
        <div class="toast-progress-container">
          <div class="toast-progress-bar" :style="{ width: `${progress}%` }"></div>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.toast-message {
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
  min-width: 300px;
  max-width: 450px;
  background-color: white;
  border-radius: 8px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 2000;
  animation: slide-in 0.3s ease;
  flex-wrap: wrap;
}

.toast-with-actions {
  padding-bottom: 8px;
}

.position-top {
  top: 24px;
}

.position-bottom {
  bottom: 24px;
}

.toast-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.toast-icon .material-icons-round {
  font-size: 24px;
}

.toast-content {
  flex: 1;
  font-size: 16px;
  line-height: 1.5;
}

.toast-close {
  cursor: pointer;
  color: #9ca3af;
  transition: color 0.2s;
}

.toast-close:hover {
  color: #6b7280;
}

.toast-actions {
  display: flex;
  gap: 8px;
}

.toast-action-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.cancel-btn {
  background-color: #f3f4f6;
  color: #4b5563;
}

.cancel-btn:hover {
  background-color: #e5e7eb;
}

.confirm-btn {
  background-color: #6366f1;
  color: white;
}

.confirm-btn:hover {
  background-color: #4f46e5;
}

/* 进度条和剩余时间 */
.toast-timer-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  margin-top: 8px;
}

.toast-remaining-time {
  font-size: 12px;
  color: #9ca3af;
  text-align: right;
  margin-bottom: 2px;
}

.toast-progress-container {
  width: 100%;
  height: 3px;
  background-color: #e5e7eb;
  border-radius: 3px;
  overflow: hidden;
}

.toast-progress-bar {
  height: 100%;
  transition: width 0.01s linear;
}

/* 类型样式 */
.toast-success {
  border-left: 4px solid #10b981;
}

.toast-success .toast-icon {
  color: #10b981;
}

.toast-success .toast-progress-bar {
  background-color: #10b981;
}

.toast-error {
  border-left: 4px solid #ef4444;
}

.toast-error .toast-icon {
  color: #ef4444;
}

.toast-error .toast-progress-bar {
  background-color: #ef4444;
}

.toast-warning {
  border-left: 4px solid #f59e0b;
}

.toast-warning .toast-icon {
  color: #f59e0b;
}

.toast-warning .toast-progress-bar {
  background-color: #f59e0b;
}

.toast-info {
  border-left: 4px solid #6366f1;
}

.toast-info .toast-icon {
  color: #6366f1;
}

.toast-info .toast-progress-bar {
  background-color: #6366f1;
}

/* 动画 */
.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, -20px);
}

@keyframes slide-in {
  from {
    opacity: 0;
    transform: translate(-50%, -20px);
  }
  to {
    opacity: 1;
    transform: translate(-50%, 0);
  }
}
</style> 