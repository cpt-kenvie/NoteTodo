import type { App } from 'vue';
import { getCurrentUser } from '../api/auth';

export default {
  install(_app: App) {
    // 在应用启动时自动加载用户信息
    const loadUserData = async () => {
      try {
        // 如果有token，尝试获取用户信息
        if (localStorage.getItem('token')) {
          const response = await getCurrentUser();
          
          if (response.success && response.data) {
          } else {
            console.warn('获取用户信息失败:', response.error);
          }
        }
      } catch (error) {
        console.error('加载用户信息出错:', error);
      }
    };

    // 自动加载用户信息
    loadUserData();
  }
}; 