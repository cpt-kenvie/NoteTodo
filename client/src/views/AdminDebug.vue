<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { getCurrentUser, isAdmin, isAuthenticated } from '../api/auth';
import { toast } from '../plugins/toast';

const router = useRouter();
const storageData = reactive({
  token: '',
  isAdmin: '',
  userAvatar: ''
});
const apiCheckResult = ref('');
const loading = ref(false);

onMounted(async () => {
  checkLocalStorage();
  await checkApiStatus();
});

const checkLocalStorage = () => {
  storageData.token = localStorage.getItem('token') || '未设置';
  storageData.isAdmin = localStorage.getItem('isAdmin') || '未设置';
  storageData.userAvatar = localStorage.getItem('userAvatar') || '未设置';
};

const checkApiStatus = async () => {
  loading.value = true;
  try {
    // 检查本地函数返回结果
    const authStatus = isAuthenticated() ? '已登录' : '未登录';
    const adminStatus = isAdmin() ? '是管理员' : '不是管理员';
    
    // 检查API返回结果
    const response = await getCurrentUser();
    if (response.success && response.data) {
      apiCheckResult.value = `
        API返回 - 用户名: ${response.data.username},
        头像: ${response.data.avatar},
        管理员: ${response.data.isAdmin ? '是' : '否'}
      `;
    } else {
      apiCheckResult.value = `API返回错误: ${response.error || '未知错误'}`;
    }
    
    // 更新检查后的本地存储状态
    checkLocalStorage();
    
    // 添加验证结果总结
    apiCheckResult.value += `\n\n本地函数检查 - ${authStatus}, ${adminStatus}`;
  } catch (err: any) {
    console.error('检查API状态失败:', err);
    apiCheckResult.value = `检查API失败: ${err.message || '未知错误'}`;
  } finally {
    loading.value = false;
  }
};

const resetLocalStorage = () => {
  localStorage.removeItem('isAdmin');
  checkLocalStorage();
  toast.success('已清除本地存储的管理员状态');
};

const setAsAdmin = () => {
  localStorage.setItem('isAdmin', 'true');
  checkLocalStorage();
  toast.success('已将本地存储标记为管理员');
};

const refreshUserFromApi = async () => {
  try {
    loading.value = true;
    const response = await getCurrentUser();
    if (response.success) {
      toast.success('已从API刷新用户信息');
    } else {
      toast.error(response.error || '刷新失败');
    }
    await checkApiStatus();
  } catch (err: any) {
    toast.error(err.message || '刷新用户信息失败');
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="debug-container">
    <h1>管理员状态调试</h1>
    
    <div class="debug-section">
      <h2>本地存储状态</h2>
      <div class="debug-info">
        <p><strong>Token:</strong> {{ storageData.token !== '未设置' ? '已设置' : '未设置' }}</p>
        <p><strong>管理员状态:</strong> {{ storageData.isAdmin }}</p>
        <p><strong>用户头像:</strong> {{ storageData.userAvatar !== '未设置' ? '已设置' : '未设置' }}</p>
      </div>
    </div>
    
    <div class="debug-section">
      <h2>API检查结果</h2>
      <div v-if="loading" class="loading">正在检查...</div>
      <pre v-else class="debug-info api-result">{{ apiCheckResult }}</pre>
    </div>
    
    <div class="debug-actions">
      <button @click="refreshUserFromApi" :disabled="loading">
        从API刷新用户信息
      </button>
      <button @click="setAsAdmin" :disabled="loading">
        设置为管理员
      </button>
      <button @click="resetLocalStorage" :disabled="loading">
        清除管理员状态
      </button>
      <button @click="router.push('/admin/users')" :disabled="loading">
        直接访问用户管理页面
      </button>
      <button @click="router.push('/direct/admin/users')" :disabled="loading">
        直接访问用户管理页面（无权限检查）
      </button>
      <button @click="router.push('/')" :disabled="loading">
        返回首页
      </button>
    </div>
  </div>
</template>

<style scoped>
.debug-container {
  max-width: 800px;
  margin: 40px auto;
  padding: 20px;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

h1 {
  text-align: center;
  color: #6366f1;
  margin-bottom: 30px;
}

.debug-section {
  margin-bottom: 30px;
}

h2 {
  color: #4f46e5;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 10px;
  margin-bottom: 15px;
}

.debug-info {
  background-color: #f9fafb;
  padding: 15px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.api-result {
  white-space: pre-wrap;
  font-family: monospace;
  line-height: 1.5;
}

.debug-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
}

button {
  padding: 10px 15px;
  border-radius: 6px;
  border: none;
  background-color: #6366f1;
  color: white;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

button:hover {
  background-color: #4f46e5;
}

button:disabled {
  background-color: #9ca3af;
  cursor: not-allowed;
}

.loading {
  text-align: center;
  padding: 20px;
  color: #6b7280;
}
</style> 