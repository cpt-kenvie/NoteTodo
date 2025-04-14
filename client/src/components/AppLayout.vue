<script setup lang="ts">
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import UserHeader from './UserHeader.vue';

// 获取当前路由
const route = useRoute();

// 定义props
defineProps<{
  title?: string; // 页面标题
  searchPlaceholder?: string; // 搜索框提示文字
}>();

// 定义事件
const emit = defineEmits<{
  (e: 'search', query: string): void;
}>();

// 侧边栏状态
const isSidebarOpen = ref(false);
const searchQuery = ref('');

// 切换侧边栏显示状态
const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value;
};



// 当搜索框内容变化时发出事件
const onSearchInput = (e: Event) => {
  const target = e.target as HTMLInputElement;
  searchQuery.value = target.value;
  emit('search', searchQuery.value);
};

// 暴露搜索查询值，让父组件可以访问
defineExpose({
  searchQuery
});
</script>

<template>
  <div class="container">
    <!-- 移动端菜单按钮 -->
    <div class="mobile-menu-toggle" @click="toggleSidebar">
      <span class="material-icons-round">menu</span>
    </div>
    
    <div class="sidebar" :class="{ 'sidebar-open': isSidebarOpen }">
      <div class="app-logo">
        <div class="logo-circle">
          <span class="material-icons-round">edit_note</span>
        </div>
        <h1>简约记事</h1>
      </div>
      <nav class="menu">
        <ul>
          <li :class="{ active: route.path === '/' }">
            <router-link to="/" @click="isSidebarOpen = false">
              <span class="material-icons-round">assignment</span>
              <span>待办事项</span>
            </router-link>
          </li>
          <li :class="{ active: route.path === '/completed' }">
            <router-link to="/completed" @click="isSidebarOpen = false">
              <span class="material-icons-round">done_all</span>
              <span>已完成</span>
            </router-link>
          </li>
          <li :class="{ active: route.path === '/all' }">
            <router-link to="/all" @click="isSidebarOpen = false">
              <span class="material-icons-round">event_note</span>
              <span>所有事件</span>
            </router-link>
          </li>
          <li :class="{ active: route.path === '/notebooks' }">
            <router-link to="/notebooks" @click="isSidebarOpen = false">
              <span class="material-icons-round">auto_stories</span>
              <span>笔记本</span>
            </router-link>
          </li>
          <li :class="{ active: route.path === '/weight-tracker' }">
            <router-link to="/weight-tracker" @click="isSidebarOpen = false">
              <span class="material-icons-round">monitor_weight</span>
              <span>体重记录</span>
            </router-link>
          </li>
          <li :class="{ active: route.path.includes('/admin/users') }">
            <router-link to="/admin/users" @click="isSidebarOpen = false">
              <span class="material-icons-round">admin_panel_settings</span>
              <span>用户管理</span>
            </router-link>
          </li>
        </ul>
      </nav>
    </div>
    
    <!-- 移动端侧边栏遮罩 -->
    <div 
      v-if="isSidebarOpen" 
      class="sidebar-overlay"
      @click="isSidebarOpen = false"
    ></div>
    
    <div class="main-content">
      <header>
        <div class="search-bar">
          <span class="material-icons-round">search</span>
          <input 
            type="text" 
            :value="searchQuery"
            @input="onSearchInput"
            :placeholder="searchPlaceholder || '搜索...'"
          >
        </div>
        <UserHeader />
      </header>
      <main>
        <div class="page-header">
          <h2>{{ title || '简约记事' }}</h2>
          <div class="header-actions">
            <slot name="header-actions"></slot>
          </div>
        </div>
        
        <!-- 主内容插槽 -->
        <slot></slot>
      </main>
    </div>
    
    <!-- 模态框插槽 -->
    <slot name="modals"></slot>
  </div>
</template>

<style scoped>
/* 容器和布局样式 */
.container {
  display: flex;
  height: 100vh;
  background-color: #f9fafb;
}

.sidebar {
  width: 250px;
  background-color: #6366f1;
  color: white;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  transition: all 0.3s ease;
  z-index: 10;
  height: 100%;
}

.app-logo {
  display: flex;
  align-items: center;
  padding: 20px;
  gap: 12px;
}

.logo-circle {
  width: 40px;
  height: 40px;
  background-color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6366f1;
}

.app-logo h1 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
}

.menu {
  flex: 1;
  padding: 10px 0;
}

.menu ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.menu li {
  margin-bottom: 4px;
}

.menu li a {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  color: #fff;
  text-decoration: none;
  transition: all 0.2s;
}

.menu li a:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.menu li.active a {
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
  font-weight: 500;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

header {
  height: 64px;
  background-color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  z-index: 5;
}

.search-bar {
  display: flex;
  align-items: center;
  max-width: 400px;
  background-color: #f3f4f6;
  border-radius: 24px;
  padding: 8px 16px;
  gap: 8px;
}

.search-bar input {
  border: none;
  background: none;
  outline: none;
  font-size: 14px;
  width: 100%;
}

.search-bar .material-icons-round {
  color: #9ca3af;
  font-size: 20px;
}

main {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: #111827;
}

.header-actions {
  display: flex;
  gap: 12px;
}

/* 添加按钮样式 */
.add-task-btn {
  background-color: #6366f1;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: background-color 0.2s;
}

.add-task-btn:hover {
  background-color: #4f46e5;
}

/* 移动端菜单按钮 */
.mobile-menu-toggle {
  display: none;
  position: fixed;
  top: 16px;
  left: 16px;
  background-color: #6366f1;
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* 侧边栏遮罩 */
.sidebar-overlay {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 5;
}

/* 响应式设计 - 手机模式 */
@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    left: -250px;
    width: 250px;
    height: 100%;
    transition: left 0.3s ease;
  }
  
  .sidebar-open {
    left: 0;
  }
  
  .mobile-menu-toggle {
    display: flex;
  }
  
  .sidebar-overlay {
    display: block;
  }
  
  .app-logo h1 {
    display: block;
  }
  
  .menu li a span:not(.material-icons-round) {
    display: inline;
  }
  
  .menu li a {
    justify-content: flex-start;
    padding: 12px 20px;
  }
  
  header {
    flex-direction: column;
    height: auto;
    padding: 12px;
    gap: 12px;
    padding-top: 60px; /* 给移动端菜单按钮留出空间 */
  }

  .search-bar {
    max-width: 100%;
    width: 100%;
  }
  
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
</style> 