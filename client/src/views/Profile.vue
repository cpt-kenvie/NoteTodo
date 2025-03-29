<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getCurrentUser, updateAvatar, getUserAvatar } from '../api/auth'
import UserHeader from '../components/UserHeader.vue'

const router = useRouter()
const username = ref('')
const avatarUrl = ref('')
const newAvatarUrl = ref('')
const loading = ref(false)
const updateLoading = ref(false)
const success = ref(false)
const error = ref('')
const userJoinDate = ref('')

onMounted(async () => {
  await loadUserData()
})

const loadUserData = async () => {
  loading.value = true
  error.value = ''
  
  try {
    // 先从本地获取头像
    avatarUrl.value = getUserAvatar()
    
    const response = await getCurrentUser()
    if (response.success && response.data) {
      username.value = response.data.username
      avatarUrl.value = response.data.avatar
      newAvatarUrl.value = response.data.avatar
      
      // 添加用户创建时间显示
      const currentTimestamp = Date.now();
      const createdDate = new Date(currentTimestamp)
      userJoinDate.value = createdDate.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } else {
      error.value = response.error || '获取用户信息失败'
    }
  } catch (err: any) {
    console.error('获取用户信息失败:', err)
    error.value = err.message || '无法连接到服务器'
  } finally {
    loading.value = false
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

const handlePreviewAvatar = () => {
  if (newAvatarUrl.value && isValidUrl(newAvatarUrl.value)) {
    // 可以添加图片预加载逻辑
  }
}

const handleUpdateAvatar = async () => {
  if (!newAvatarUrl.value) {
    error.value = '请输入头像URL'
    return
  }
  
  if (!isValidUrl(newAvatarUrl.value)) {
    error.value = '请输入有效的URL'
    return
  }
  
  error.value = ''
  success.value = false
  updateLoading.value = true
  
  try {
    const response = await updateAvatar(newAvatarUrl.value)
    
    if (response.success) {
      avatarUrl.value = newAvatarUrl.value
      success.value = true
      setTimeout(() => {
        success.value = false
      }, 3000)
    } else {
      error.value = response.error || '更新头像失败'
    }
  } catch (err: any) {
    console.error('更新头像失败:', err)
    error.value = err.message || '更新头像过程中发生错误'
  } finally {
    updateLoading.value = false
  }
}

const goBack = () => {
  router.push('/')
}
</script>

<template>
  <div class="container">
    <div class="sidebar">
      <div class="app-logo">
        <div class="logo-circle">
          <span class="material-icons-round">edit_note</span>
        </div>
        <h1>简约记事</h1>
      </div>
      <nav class="menu">
        <ul>
          <li>
            <router-link to="/">
              <span class="material-icons-round">assignment</span>
              <span>待办事项</span>
            </router-link>
          </li>
          <li>
            <router-link to="/completed">
              <span class="material-icons-round">done_all</span>
              <span>已完成</span>
            </router-link>
          </li>
          <li>
            <router-link to="/all">
              <span class="material-icons-round">event_note</span>
              <span>所有事件</span>
            </router-link>
          </li>
          <li>
            <router-link to="/admin/users">
              <span class="material-icons-round">admin_panel_settings</span>
              <span>用户管理</span>
            </router-link>
          </li>
        </ul>
      </nav>
    </div>
    <div class="main-content">
      <header>
        <div class="search-bar">
          <span class="material-icons-round" @click="goBack">arrow_back</span>
          <span>个人资料</span>
        </div>
        <UserHeader />
      </header>
      <main>
        <div class="page-header">
          <h2>个人资料</h2>
        </div>
        
        <div v-if="loading" class="loading">
          <span class="material-icons-round loading-icon">sync</span>
          加载中...
        </div>
        
        <div v-else class="profile-container">
          <div class="profile-section">
            <div class="avatar-section">
              <div class="avatar-large">
                <img :src="avatarUrl" alt="用户头像">
              </div>
              <h3>{{ username }}</h3>
              <p class="user-join-date">加入时间：{{ userJoinDate }}</p>
            </div>
            
            <div class="profile-form">
              <div v-if="error" class="error-message">
                {{ error }}
              </div>
              
              <div v-if="success" class="success-message">
                头像更新成功！
              </div>
              
              <div class="form-group">
                <label for="avatar-url">更新头像URL</label>
                <input 
                  type="url" 
                  id="avatar-url" 
                  v-model="newAvatarUrl" 
                  placeholder="请输入在线图片URL"
                  @input="handlePreviewAvatar"
                  @blur="handlePreviewAvatar"
                >
                <p class="field-hint">请输入完整的图片URL，如 https://example.com/avatar.jpg</p>
              </div>
              
              <div class="avatar-preview-container">
                <div class="preview-label">预览:</div>
                <div class="avatar-preview">
                  <img :src="newAvatarUrl || avatarUrl" alt="头像预览"
                       onerror="this.src='https://randomuser.me/api/portraits/lego/1.jpg';">
                </div>
              </div>
              
              <button 
                class="update-button" 
                @click="handleUpdateAvatar" 
                :disabled="updateLoading"
              >
                {{ updateLoading ? '更新中...' : '更新头像' }}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
/* 使用原HTML的样式 */
.search-bar {
  display: flex;
  align-items: center;
  gap: 12px;
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

.profile-container {
  max-width: 700px;
  margin: 0 auto;
}

.profile-section {
  background-color: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 30px;
}

.avatar-large {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  overflow: hidden;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
  margin-bottom: 16px;
}

.avatar-large img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-section h3 {
  margin: 0;
  font-size: 20px;
  color: #374151;
}

.user-join-date {
  margin-top: 8px;
  color: #6b7280;
  font-size: 14px;
}

.profile-form {
  max-width: 500px;
  margin: 0 auto;
}

.error-message {
  background-color: #fee2e2;
  color: #b91c1c;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.success-message {
  background-color: #dcfce7;
  color: #166534;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
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

.avatar-preview-container {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.preview-label {
  margin-right: 12px;
  color: #4b5563;
  font-weight: 500;
}

.avatar-preview {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid #e5e7eb;
}

.avatar-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.update-button {
  background-color: #6366f1;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.update-button:hover {
  background-color: #4f46e5;
}

.update-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
</style> 