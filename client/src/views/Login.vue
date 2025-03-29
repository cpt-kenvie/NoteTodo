<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { login } from '../api/auth'
import type { LoginCredentials } from '../api/auth'
import { toast } from '../plugins/toast'

const router = useRouter()
const username = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

const handleLogin = async () => {
  if (!username.value || !password.value) {
    error.value = '请输入用户名和密码'
    return
  }
  
  loading.value = true
  
  try {
    const credentials: LoginCredentials = {
      username: username.value,
      password: password.value
    }
    
    const response = await login(credentials)
    
    if (response.success) {
      // 登录成功，显示提示消息
      toast.success('登录成功')
      // 跳转到首页
      router.push('/')
    } else {
      error.value = response.error || '登录失败'
    }
  } catch (err: any) {
    console.error('登录出错:', err)
    error.value = err.message || '登录过程中发生错误'
  } finally {
    loading.value = false
  }
}

const goToRegister = () => {
  router.push('/register')
}
</script>

<template>
  <div class="auth-container">
    <div class="auth-card">
      <div class="auth-header">
        <h2>登录</h2>
      </div>
      
      <div v-if="error" class="error-message">
        {{ error }}
      </div>
      
      <div class="auth-form">
        <div class="form-group">
          <label for="username">用户名</label>
          <input 
            type="text" 
            id="username" 
            v-model="username" 
            placeholder="请输入用户名"
            autocomplete="username"
            @keyup.enter="handleLogin"
          >
        </div>
        
        <div class="form-group">
          <label for="password">密码</label>
          <input 
            type="password" 
            id="password" 
            v-model="password" 
            placeholder="请输入密码"
            autocomplete="current-password"
            @keyup.enter="handleLogin"
          >
        </div>
        
        <button 
          class="auth-button" 
          @click="handleLogin" 
          :disabled="loading"
        >
          {{ loading ? '登录中...' : '登录' }}
        </button>
        
        <div class="auth-links">
          <span>没有账号？</span>
          <a href="#" @click.prevent="goToRegister">立即注册</a>
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