import { createApp, h, reactive } from 'vue'
import type { App } from 'vue'
import ToastMessage from '../components/ToastMessage.vue'

export type ToastType = 'success' | 'error' | 'info' | 'warning'
export type ToastPosition = 'top' | 'bottom'
export type ToastActionType = 'message' | 'confirm'

interface ToastOptions {
  message: string
  type?: ToastType
  actionType?: ToastActionType
  duration?: number
  position?: ToastPosition
  confirmText?: string
  cancelText?: string
  onConfirm?: () => void
  onCancel?: () => void
}

// 创建一个单例
let currentToast: any = null

const toast = {
  show(options: ToastOptions | string) {
    // 如果已经有toast在显示，先移除
    if (currentToast) {
      document.body.removeChild(currentToast.$el.parentNode)
      currentToast = null
    }

    // 处理参数格式
    let opts: ToastOptions
    if (typeof options === 'string') {
      opts = { message: options }
    } else {
      opts = options
    }

    // 创建一个容器div
    const container = document.createElement('div')
    document.body.appendChild(container)

    // 创建Toast的props
    const toastProps = reactive({
      show: true,
      message: opts.message,
      type: opts.type || 'info',
      actionType: opts.actionType || 'message',
      duration: opts.duration !== undefined ? opts.duration : 3000,
      position: opts.position || 'top',
      confirmText: opts.confirmText,
      cancelText: opts.cancelText,
    })

    // 创建组件实例
    const app = createApp({
      setup() {
        return () => h(ToastMessage, {
          ...toastProps,
          'onUpdate:show': (val: boolean) => {
            toastProps.show = val
            if (!val) {
              setTimeout(() => {
                // 给动画留出时间后移除DOM
                if (container.parentNode) {
                  container.parentNode.removeChild(container)
                }
                app.unmount()
                currentToast = null
              }, 300)
            }
          },
          onConfirm: () => {
            if (opts.onConfirm) {
              opts.onConfirm()
            }
          },
          onCancel: () => {
            if (opts.onCancel) {
              opts.onCancel()
            }
          }
        })
      }
    })

    // 挂载
    currentToast = app.mount(container)
    return currentToast
  },

  // 快捷方法 - 纯消息
  success(message: string, options: Partial<ToastOptions> = {}) {
    return this.show({ message, type: 'success', actionType: 'message', ...options })
  },

  error(message: string, options: Partial<ToastOptions> = {}) {
    return this.show({ message, type: 'error', actionType: 'message', ...options })
  },

  warning(message: string, options: Partial<ToastOptions> = {}) {
    return this.show({ message, type: 'warning', actionType: 'message', ...options })
  },

  info(message: string, options: Partial<ToastOptions> = {}) {
    return this.show({ message, type: 'info', actionType: 'message', ...options })
  },

  // 快捷方法 - 确认消息
  confirm(message: string, options: Partial<ToastOptions> = {}) {
    return this.show({ 
      message, 
      type: 'info', 
      actionType: 'confirm',
      duration: 5000, // 确认消息默认时间更长
      ...options 
    })
  }
}

// Vue插件
export default {
  install(app: App) {
    app.config.globalProperties.$toast = toast
  }
}

// 导出toast对象以便在非组件中使用
export { toast }

// 为TypeScript添加类型声明
declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $toast: typeof toast
  }
} 