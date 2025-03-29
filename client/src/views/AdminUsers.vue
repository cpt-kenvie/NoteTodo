<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getAllUsers, deleteUser } from '../api/users';
import { toast } from '../plugins/toast';
import type { User } from '../api/users';

const users = ref<User[]>([]);
const loading = ref(true);
const error = ref('');
const totalUsers = ref(0);
const adminCount = ref(0);
const confirmDeleteUserId = ref('');
const showDeleteConfirm = ref(false);

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
    } else {
      toast.error(response.error || '删除用户失败');
    }
  } catch (err: any) {
    console.error('删除用户出错:', err);
    toast.error(err.message || '删除用户时发生错误');
  } finally {
    // 关闭确认对话框
    cancelDelete();
  }
};

// 格式化日期
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN');
};

// 生命周期
onMounted(() => {
  fetchUsers();
});
</script>

<template>
  <div class="admin-users-container">
    <!-- 左侧边栏 -->
    <aside class="sidebar">
      <div class="logo">
        <h2>NoteTodo</h2>
      </div>
      <nav class="nav-links">
        <router-link to="/" class="nav-link">
          <span class="material-icons-round">today</span>
          <span>今日事件</span>
        </router-link>
        <router-link to="/all" class="nav-link">
          <span class="material-icons-round">calendar_month</span>
          <span>所有事件</span>
        </router-link>
        <router-link to="/completed" class="nav-link">
          <span class="material-icons-round">task_alt</span>
          <span>已完成</span>
        </router-link>
        <router-link to="/admin/users" class="nav-link active">
          <span class="material-icons-round">admin_panel_settings</span>
          <span>用户管理</span>
        </router-link>
      </nav>
    </aside>

    <!-- 主内容区 -->
    <main class="main-content">
      <!-- 顶部工具栏 -->
      <header class="header">
        <div class="search-container">
          <div class="search-box">
            <span class="material-icons-round">search</span>
            <input type="text" placeholder="搜索用户..." />
          </div>
        </div>
        <div class="user-actions">
          <button class="refresh-btn" @click="fetchUsers" title="刷新用户列表">
            <span class="material-icons-round">refresh</span>
          </button>
        </div>
      </header>

      <!-- 页面标题 -->
      <div class="page-title">
        <h1>用户管理</h1>
        <div class="stats">
          <div class="stat-item">
            <span class="stat-value">{{ totalUsers }}</span>
            <span class="stat-label">总用户数</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ adminCount }}</span>
            <span class="stat-label">管理员数</span>
          </div>
        </div>
      </div>

      <!-- 用户列表 -->
      <div class="users-content">
        <!-- 加载状态 -->
        <div v-if="loading" class="loading-container">
          <div class="loading-spinner"></div>
          <p>正在加载用户数据...</p>
        </div>

        <!-- 错误提示 -->
        <div v-else-if="error" class="error-container">
          <span class="material-icons-round error-icon">error</span>
          <p>{{ error }}</p>
          <button @click="fetchUsers" class="retry-btn">重试</button>
        </div>

        <!-- 空数据提示 -->
        <div v-else-if="users.length === 0" class="empty-container">
          <span class="material-icons-round empty-icon">person_off</span>
          <p>没有找到任何用户</p>
        </div>

        <!-- 用户列表表格 -->
        <div v-else class="users-table-container">
          <table class="users-table">
            <thead>
              <tr>
                <th>头像</th>
                <th>用户名</th>
                <th>角色</th>
                <th>注册时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in users" :key="user._id" :class="{ 'admin-row': user.isAdmin }">
                <td>
                  <div class="user-avatar">
                    <img :src="user.avatar" :alt="user.username" />
                  </div>
                </td>
                <td>{{ user.username }}</td>
                <td>
                  <span v-if="user.isAdmin" class="admin-badge">管理员</span>
                  <span v-else class="user-badge">普通用户</span>
                </td>
                <td>{{ formatDate(user.createdAt) }}</td>
                <td>
                  <div class="user-actions-cell">
                    <button 
                      v-if="!user.isAdmin" 
                      class="delete-btn" 
                      @click="confirmDelete(user._id)"
                      title="删除用户"
                    >
                      <span class="material-icons-round">delete</span>
                    </button>
                    <span v-else class="material-icons-round protected-icon" title="不能删除管理员账户">shield</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>

    <!-- 删除确认对话框 -->
    <div v-if="showDeleteConfirm" class="delete-confirm-overlay">
      <div class="delete-confirm-dialog">
        <div class="dialog-header">
          <span class="material-icons-round warning-icon">warning</span>
          <h2>确认删除</h2>
        </div>
        <div class="dialog-content">
          <p>您确定要删除这个用户吗？此操作不可撤销。</p>
        </div>
        <div class="dialog-actions">
          <button class="cancel-btn" @click="cancelDelete">取消</button>
          <button class="confirm-btn" @click="removeUser">确认删除</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-users-container {
  display: flex;
  min-height: 100vh;
  background-color: #f3f4f6;
}

.sidebar {
  width: 250px;
  background-color: #6366f1;
  color: white;
  padding: 20px 0;
  display: flex;
  flex-direction: column;
}

.logo {
  padding: 0 20px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 20px;
}

.logo h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
}

.nav-links {
  display: flex;
  flex-direction: column;
}

.nav-link {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  transition: all 0.2s ease;
}

.nav-link.active,
.nav-link:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
}

.nav-link span:first-child {
  margin-right: 10px;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.header {
  background-color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 30px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.search-container {
  flex: 1;
}

.search-box {
  display: flex;
  align-items: center;
  background-color: #f3f4f6;
  border-radius: 8px;
  padding: 8px 15px;
  max-width: 400px;
}

.search-box input {
  border: none;
  background: transparent;
  margin-left: 10px;
  flex: 1;
  font-size: 14px;
  outline: none;
}

.user-actions {
  display: flex;
  align-items: center;
}

.refresh-btn {
  background-color: #f3f4f6;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.refresh-btn:hover {
  background-color: #e5e7eb;
}

.page-title {
  padding: 20px 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title h1 {
  font-size: 24px;
  font-weight: 600;
  margin: 0;
  color: #111827;
}

.stats {
  display: flex;
  gap: 20px;
}

.stat-item {
  background-color: white;
  border-radius: 8px;
  padding: 10px 15px;
  text-align: center;
  min-width: 100px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.stat-value {
  display: block;
  font-size: 20px;
  font-weight: 600;
  color: #6366f1;
}

.stat-label {
  font-size: 12px;
  color: #6b7280;
}

.users-content {
  flex: 1;
  padding: 0 30px 30px;
  overflow-y: auto;
}

.users-table-container {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.users-table {
  width: 100%;
  border-collapse: collapse;
}

.users-table th,
.users-table td {
  padding: 15px;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.users-table th {
  background-color: #f9fafb;
  font-weight: 600;
  color: #374151;
  font-size: 14px;
}

.users-table tbody tr:hover {
  background-color: #f9fafb;
}

.users-table tbody tr:last-child td {
  border-bottom: none;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.admin-badge,
.user-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.admin-badge {
  background-color: #bfdbfe;
  color: #1e40af;
}

.user-badge {
  background-color: #e5e7eb;
  color: #4b5563;
}

.admin-row {
  background-color: #f8fafc;
}

.user-actions-cell {
  display: flex;
  gap: 8px;
}

.delete-btn {
  background-color: #fee2e2;
  color: #b91c1c;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.delete-btn:hover {
  background-color: #fecaca;
}

.protected-icon {
  color: #6366f1;
  font-size: 20px;
}

.loading-container,
.error-container,
.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 50px 0;
  text-align: center;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e5e7eb;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spinner 1s linear infinite;
  margin-bottom: 15px;
}

@keyframes spinner {
  to {
    transform: rotate(360deg);
  }
}

.error-icon,
.empty-icon {
  font-size: 40px;
  margin-bottom: 15px;
  color: #ef4444;
}

.empty-icon {
  color: #9ca3af;
}

.retry-btn {
  margin-top: 15px;
  background-color: #6366f1;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.retry-btn:hover {
  background-color: #4f46e5;
}

.delete-confirm-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.delete-confirm-dialog {
  background-color: white;
  border-radius: 12px;
  max-width: 400px;
  width: 100%;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.dialog-header {
  background-color: #fee2e2;
  color: #b91c1c;
  padding: 15px 20px;
  display: flex;
  align-items: center;
}

.warning-icon {
  margin-right: 10px;
  font-size: 24px;
}

.dialog-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.dialog-content {
  padding: 20px;
}

.dialog-content p {
  margin: 0;
  color: #374151;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  padding: 15px 20px;
  border-top: 1px solid #e5e7eb;
  gap: 10px;
}

.cancel-btn,
.confirm-btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cancel-btn {
  background-color: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.cancel-btn:hover {
  background-color: #e5e7eb;
}

.confirm-btn {
  background-color: #ef4444;
  color: white;
  border: none;
}

.confirm-btn:hover {
  background-color: #dc2626;
}

@media (max-width: 768px) {
  .admin-users-container {
    flex-direction: column;
  }
  
  .sidebar {
    width: 100%;
    padding: 10px 0;
  }
  
  .page-title {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  
  .stats {
    width: 100%;
  }
  
  .stat-item {
    flex: 1;
  }
  
  .users-table th:nth-child(4),
  .users-table td:nth-child(4) {
    display: none;
  }
}
</style> 