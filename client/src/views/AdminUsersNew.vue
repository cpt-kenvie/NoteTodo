<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { getAllUsers, deleteUser } from '../api/users';
import { toast } from '../plugins/toast';
import AppLayout from '../components/AppLayout.vue';

interface User {
  _id: string;
  username: string;
  avatar: string;
  isAdmin: boolean;
  createdAt: string;
}

const users = ref<User[]>([]);
const loading = ref(true);
const error = ref('');
const searchQuery = ref('');
const totalUsers = ref(0);
const adminCount = ref(0);
const confirmDeleteUserId = ref('');
const showDeleteConfirm = ref(false);
const appLayoutRef = ref(null);

// 获取所有用户
const fetchUsers = async () => {
  loading.value = true;
  error.value = '';
  
  try {
    const response = await getAllUsers();
    
    if (response.success && response.data) {
      users.value = Array.isArray(response.data) ? response.data : [response.data];
      totalUsers.value = users.value.length;
      adminCount.value = users.value.filter(user => user.isAdmin).length;
    } else {
      error.value = response.error || '获取用户列表失败';
    }
  } catch (err: any) {
    console.error('获取用户列表出错:', err);
    error.value = err.message || '获取用户列表时发生错误';
  } finally {
    loading.value = false;
  }
};

// 处理搜索
const handleSearch = (query: string) => {
  searchQuery.value = query;
};

// 筛选后的用户列表
const filteredUsers = computed(() => {
  if (!searchQuery.value) return users.value;
  
  const query = searchQuery.value.toLowerCase();
  return users.value.filter(user => {
    return user.username.toLowerCase().includes(query);
  });
});

// 删除确认
const confirmDelete = (userId: string) => {
  confirmDeleteUserId.value = userId;
  showDeleteConfirm.value = true;
};

// 取消删除
const cancelDelete = () => {
  confirmDeleteUserId.value = '';
  showDeleteConfirm.value = false;
};

// 执行删除用户
const removeUser = async () => {
  if (!confirmDeleteUserId.value) return;
  
  try {
    const response = await deleteUser(confirmDeleteUserId.value);
    
    if (response.success) {
      // 从列表中移除用户
      users.value = users.value.filter(user => user._id !== confirmDeleteUserId.value);
      totalUsers.value = users.value.length;
      adminCount.value = users.value.filter(user => user.isAdmin).length;
      toast.success('用户已删除');
      // 关闭确认对话框
      cancelDelete();
    } else {
      // 显示详细的错误消息
      const errorMsg = response.error || '删除用户失败';
      console.error('删除用户失败详情:', response);
      toast.error(errorMsg);
    }
  } catch (err: any) {
    console.error('删除用户出错:', err);
    // 提取并显示更详细的错误信息
    const errorMsg = err.response?.data?.error || err.message || '删除用户时发生错误';
    toast.error(errorMsg);
  }
};

// 格式化日期
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN');
};

// 生命周期
onMounted(() => {
  fetchUsers();
});
</script>
 
<template>
  <AppLayout 
    ref="appLayoutRef"
    title="用户管理" 
    searchPlaceholder="搜索用户..."
    @search="handleSearch"
  >
    <div class="stats-container">
      <div class="stat-card">
        <div class="stat-value">{{ totalUsers }}</div>
        <div class="stat-label">总用户数</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ adminCount }}</div>
        <div class="stat-label">管理员数</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ totalUsers - adminCount }}</div>
        <div class="stat-label">普通用户</div>
      </div>
    </div>

    <div v-if="error" class="error-message">
      {{ error }}
      <button @click="fetchUsers" class="retry-btn">重试</button>
    </div>
    
    <div v-if="loading" class="loading">
      <span class="material-icons-round loading-icon">sync</span>
      加载中...
    </div>
    
    <div v-else-if="filteredUsers.length === 0" class="empty-state">
      <span class="material-icons-round">person_off</span>
      <p>没有找到任何用户</p>
    </div>
    
    <div v-else class="user-list">
      <h3 class="section-header">所有用户 ({{ filteredUsers.length }})</h3>
      <div class="user-items">
        <div 
          v-for="user in filteredUsers" 
          :key="user._id" 
          class="user-item"
          :class="{ 'admin-user': user.isAdmin }"
        >
          <div class="user-content">
            <div class="user-avatar">
              <img :src="user.avatar" :alt="user.username">
            </div>
            <div class="user-details">
              <h4>{{ user.username }}</h4>
              <div class="user-meta">
                <span class="user-role" :class="{ 'admin-role': user.isAdmin }">
                  {{ user.isAdmin ? '管理员' : '普通用户' }}
                </span>
                <div class="user-date">
                  <span class="material-icons-round">event</span>
                  <span>{{ formatDate(user.createdAt) }}</span>
                </div>
              </div>
            </div>
          </div>
          <div class="user-actions">
            <button 
              v-if="!user.isAdmin"
              class="action-btn delete" 
              @click="confirmDelete(user._id)"
              title="删除用户"
            >
              <span class="material-icons-round">delete</span>
            </button>
            <span 
              v-else 
              class="admin-badge"
              title="不能删除管理员账户"
            >
              <span class="material-icons-round">verified_user</span>
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 删除确认对话框 -->
    <div v-if="showDeleteConfirm" class="modal-overlay">
      <div class="modal-dialog">
        <div class="modal-header">
          <span class="material-icons-round warning-icon">warning</span>
          <h2>确认删除</h2>
        </div>
        <div class="modal-body">
          <p>您确定要删除这个用户吗？此操作不可撤销。</p>
        </div>
        <div class="modal-footer">
          <button class="cancel-btn" @click="cancelDelete">取消</button>
          <button class="confirm-btn" @click="removeUser">确认删除</button>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<style scoped>
/* 注意：AppLayout已经包含了基本的容器和布局样式，这里只需保留特定内容的样式 */
.empty-state {
  text-align: center;
  padding: 20px;
  color: #6b7280;
  background-color: #f9fafb;
  border-radius: 8px;
  margin: 10px 0;
}

.section-header {
  margin: 15px 0 10px;
  padding-bottom: 5px;
  border-bottom: 1px solid #e5e7eb;
}

.section-header h4 {
  font-size: 16px;
  font-weight: 500;
  color: #4b5563;
  margin: 0;
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

.stats-container {
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
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

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 用户列表样式 */
.user-list {
  margin-top: 20px;
}

.user-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.user-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
}

.user-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.admin-user {
  border-left: 4px solid #6366f1;
}

.user-content {
  display: flex;
  align-items: center;
  flex: 1;
  padding: 14px 16px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 14px;
  flex-shrink: 0;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-details {
  flex: 1;
  min-width: 0;
}

.user-details h4 {
  margin: 0 0 6px;
  font-size: 16px;
  font-weight: 500;
  color: #111827;
}

.user-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.user-role {
  background-color: #e5e7eb;
  color: #4b5563;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.admin-role {
  background-color: #c7d2fe;
  color: #4338ca;
}

.user-date {
  display: flex;
  align-items: center;
  font-size: 13px;
  color: #6b7280;
}

.user-date .material-icons-round {
  font-size: 14px;
  margin-right: 4px;
}

.user-actions {
  display: flex;
  padding: 0 16px;
}

.action-btn {
  background: none;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #6b7280;
  transition: background-color 0.2s, color 0.2s;
}

.action-btn:hover {
  background-color: #f3f4f6;
}

.action-btn.delete:hover {
  color: #ef4444;
}

.admin-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  color: #6366f1;
}

/* 删除确认对话框 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-dialog {
  background-color: white;
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
  overflow: hidden;
  box-shadow: 0 10px 25px rgba(0,0,0,0.2);
}

.modal-header {
  background-color: #fef2f2;
  padding: 16px 24px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid #fee2e2;
}

.warning-icon {
  color: #ef4444;
  font-size: 24px;
}

.modal-header h2 {
  margin: 0;
  color: #b91c1c;
  font-size: 18px;
  font-weight: 600;
}

.modal-body {
  padding: 24px;
}

.modal-body p {
  margin: 0;
  color: #4b5563;
}

.modal-footer {
  padding: 16px 24px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  border-top: 1px solid #e5e7eb;
}

.cancel-btn, .confirm-btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  border: none;
}

.cancel-btn {
  background-color: #f3f4f6;
  color: #4b5563;
}

.confirm-btn {
  background-color: #ef4444;
  color: white;
}

.cancel-btn:hover {
  background-color: #e5e7eb;
}

.confirm-btn:hover {
  background-color: #dc2626;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  color: #9ca3af;
  text-align: center;
}

.empty-state .material-icons-round {
  font-size: 48px;
  margin-bottom: 16px;
  color: #d1d5db;
}

.empty-state p {
  font-size: 16px;
  margin: 0;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .stats-container {
    flex-direction: column;
    gap: 12px;
  }
  
  .user-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }
}
</style> 