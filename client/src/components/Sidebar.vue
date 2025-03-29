<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { logout, getCurrentUser } from '../api/auth';
import { toast } from '../plugins/toast';

const router = useRouter();

// 在挂载时获取最新的管理员状态
onMounted(async () => {
  console.log('侧边栏 - 强制设置管理员状态为true');
  
  // 如果已登录，通过API获取最新状态（仅记录信息）
  if (localStorage.getItem('token')) {
    try {
      await getCurrentUser();
      console.log('侧边栏 - 获取用户信息成功');
    } catch (error) {
      console.error('获取用户状态失败:', error);
    }
  }
});

const handleLogout = () => {
  logout();
  toast.success('已退出登录');
  router.push('/login');
};
</script>

<template>
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
      <router-link to="/profile" class="nav-link">
        <span class="material-icons-round">account_circle</span>
        <span>个人资料</span>
      </router-link>
      <!-- 强制显示管理员链接 -->
      <router-link to="/admin/users" class="nav-link">
        <span class="material-icons-round">admin_panel_settings</span>
        <span>用户管理</span>
      </router-link>
    </nav>
    <div class="user-controls">
      <button class="logout-btn" @click="handleLogout">
        <span class="material-icons-round">logout</span>
        <span>退出登录</span>
      </button>
    </div>
  </aside>
</template>

<style scoped>
/* 在这里添加您的样式 */
</style> 