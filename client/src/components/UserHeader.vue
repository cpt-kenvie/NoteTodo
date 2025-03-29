<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getCurrentUser, logout, isAuthenticated, getUserAvatar } from '../api/auth'

const router = useRouter()
const username = ref('')
const avatar = ref('')
const isLoggedIn = ref(false)
const showDropdown = ref(false)

onMounted(async () => {
  await loadUserData()
})

const loadUserData = async () => {
  isLoggedIn.value = isAuthenticated()
  
  if (isLoggedIn.value) {
    // 设置头像
    avatar.value = getUserAvatar()
    
    try {
      const response = await getCurrentUser()
      if (response.success && response.data) {
        username.value = response.data.username
        // 更新头像
        if (response.data.avatar) {
          avatar.value = response.data.avatar
        }
      } else {
        handleLogout()
      }
    } catch (error) {
      console.error('获取用户信息失败:', error)
      handleLogout()
    }
  }
}

const handleLogout = () => {
  logout()
  isLoggedIn.value = false
  username.value = ''
  avatar.value = ''
  router.push('/login')
}

const goToProfile = () => {
  router.push('/profile')
}

const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value
}

const goToLogin = () => {
  router.push('/login')
}

const goToRegister = () => {
  router.push('/register')
}
</script>

<template>
  <div class="user-profile">
    <!-- 已登录状态 -->
    <template v-if="isLoggedIn">
      <div class="avatar-container" @click="toggleDropdown">
        <div class="avatar">
          <img :src="avatar" alt="用户头像">
        </div>
        <span class="username">{{ username }}</span>
        <span class="material-icons-round dropdown-icon">arrow_drop_down</span>
        
        <div v-if="showDropdown" class="dropdown-menu">
          <div class="dropdown-item" @click="goToProfile">
            <span class="material-icons-round">account_circle</span>
            <span>个人资料</span>
          </div>
          <div class="dropdown-item" @click="handleLogout">
            <span class="material-icons-round">logout</span>
            <span>注销</span>
          </div>
        </div>
      </div>
    </template>
    
    <!-- 未登录状态 -->
    <template v-else>
      <div class="auth-buttons">
        <button class="login-btn" @click="goToLogin">登录</button>
        <button class="register-btn" @click="goToRegister">注册</button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.user-profile {
  display: flex;
  align-items: center;
  gap: 16px;
}

.avatar-container {
  display: flex;
  align-items: center;
  cursor: pointer;
  position: relative;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  overflow: hidden;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.username {
  margin-left: 8px;
  font-weight: 500;
}

.dropdown-icon {
  font-size: 18px;
  color: #6b7280;
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 150px;
  z-index: 10;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.dropdown-item:hover {
  background-color: #f3f4f6;
}

.auth-buttons {
  display: flex;
  gap: 10px;
}

.login-btn, .register-btn {
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.login-btn {
  background-color: #f3f4f6;
  color: #4b5563;
  border: 1px solid #e5e7eb;
}

.register-btn {
  background-color: #6366f1;
  color: white;
  border: none;
}

.login-btn:hover {
  background-color: #e5e7eb;
}

.register-btn:hover {
  background-color: #4f46e5;
}
</style> 