<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { register } from '../api/auth'
import type { RegisterCredentials } from '../api/auth'
import { toast } from '../plugins/toast'

const router = useRouter()
const username = ref('')
const password = ref('')
const confirmPassword = ref('')
const avatar = ref('')
const loading = ref(false)
const error = ref('')
const previewAvatar = ref('https://randomuser.me/api/portraits/lego/1.jpg')

const handleImagePreview = () => {
  if (avatar.value && isValidUrl(avatar.value)) {
    previewAvatar.value = avatar.value
  } else {
    previewAvatar.value = 'https://randomuser.me/api/portraits/lego/1.jpg'
  }
}

const isValidUrl = (url: string) => {
  try {
    new URL(url)
    return true
  } catch (e) {
    return false
  }
}

const handleRegister = async () => {
  // 表单验证
  if (!username.value || !password.value || !confirmPassword.value) {
    error.value = '请填写所有必填字段'
    return
  }
  
  if (username.value.length < 3) {
    error.value = '用户名至少需要3个字符'
    return
  }
  
  if (password.value.length < 6) {
    error.value = '密码至少需要6个字符'
    return
  }
  
  if (password.value !== confirmPassword.value) {
    error.value = '两次输入的密码不一致'
    return
  }
  
  if (avatar.value && !isValidUrl(avatar.value)) {
    error.value = '请输入有效的图片URL'
    return
  }
  
  loading.value = true
  
  try {
    const credentials: RegisterCredentials = {
      username: username.value,
      password: password.value
    }
    
    // 如果提供了头像URL，添加到凭据中
    if (avatar.value) {
      credentials.avatar = avatar.value
    }
    
    const response = await register(credentials)
    
    if (response.success) {
      // 注册成功，显示提示消息
      toast.success('注册成功')
      // 跳转到首页
      router.push('/')
    } else {
      error.value = response.error || '注册失败'
    }
  } catch (err: any) {
    console.error('注册出错:', err)
    error.value = err.message || '注册过程中发生错误'
  } finally {
    loading.value = false
  }
}

const goToLogin = () => {
  router.push('/login')
}
</script>

<template>
  <div class="auth-container">
    <div class="auth-card">
      <div class="auth-header">
        <h2>注册账号</h2>
      </div>
      
      <div v-if="error" class="error-message">
        {{ error }}
      </div>
      
      <div class="auth-form">
        <div class="avatar-upload">
          <div class="avatar-preview">
            <img :src="previewAvatar" alt="头像预览">
          </div>
          <p class="avatar-hint">头像预览</p>
        </div>
        
        <div class="form-group">
          <label for="username">用户名</label>
          <input 
            type="text" 
            id="username" 
            v-model="username" 
            placeholder="请输入用户名（至少3个字符）"
            autocomplete="username"
          >
        </div>
        
        <div class="form-group">
          <label for="password">密码</label>
          <input 
            type="password" 
            id="password" 
            v-model="password" 
            placeholder="请输入密码（至少6个字符）"
            autocomplete="new-password"
          >
        </div>
        
        <div class="form-group">
          <label for="confirm-password">确认密码</label>
          <input 
            type="password" 
            id="confirm-password" 
            v-model="confirmPassword" 
            placeholder="请再次输入密码"
            autocomplete="new-password"
          >
        </div>
        
        <div class="form-group">
          <label for="avatar">头像URL（可选）</label>
          <input 
            type="url" 
            id="avatar" 
            v-model="avatar" 
            placeholder="请输入在线图片链接"
            @input="handleImagePreview"
            @blur="handleImagePreview"
          >
          <p class="field-hint">请输入完整的图片URL，如 https://example.com/avatar.jpg</p>
        </div>
        
        <button 
          class="auth-button" 
          @click="handleRegister" 
          :disabled="loading"
        >
          {{ loading ? '注册中...' : '注册' }}
        </button>
        
        <div class="auth-links">
          <span>已有账号？</span>
          <a href="#" @click.prevent="goToLogin">返回登录</a>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: #f3f4f6;
  padding: 20px;
}

.auth-card {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
  overflow: hidden;
}

.auth-header {
  background-color: #6366f1;
  color: white;
  padding: 20px;
  text-align: center;
}

.auth-header h2 {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
}

.error-message {
  background-color: #fee2e2;
  color: #b91c1c;
  padding: 12px 16px;
  font-size: 14px;
  margin-bottom: 12px;
}

.auth-form {
  padding: 24px;
}

.avatar-upload {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
}

.avatar-preview {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid #e5e7eb;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.avatar-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-hint {
  font-size: 12px;
  color: #6b7280;
  margin-top: 8px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-weight: 500;
  margin-bottom: 8px;
  color: #374151;
}

.form-group input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 16px;
}

.field-hint {
  font-size: 12px;
  color: #6b7280;
  margin-top: 4px;
  margin-bottom: 0;
}

.auth-button {
  width: 100%;
  padding: 12px;
  border: none;
  background-color: #6366f1;
  color: white;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  margin-top: 8px;
}

.auth-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.auth-links {
  margin-top: 16px;
  text-align: center;
  font-size: 14px;
}

.auth-links a {
  color: #6366f1;
  text-decoration: none;
  margin-left: 4px;
}
</style> 