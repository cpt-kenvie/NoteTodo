import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const userApi = axios.create({
  baseURL: `${API_URL}/users`,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 拦截器 - 添加授权头
userApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理401错误
userApi.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // 清除token和头像
      localStorage.removeItem('token');
      localStorage.removeItem('userAvatar');
      localStorage.removeItem('isAdmin');
      
      // 重定向到登录页
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// 接口类型
export interface User {
  _id: string;
  username: string;
  avatar: string;
  isAdmin: boolean;
  createdAt: string;
}

export interface UserResponse {
  success: boolean;
  data?: User | User[];
  count?: number;
  error?: string;
}

// 获取所有用户
export const getAllUsers = async (): Promise<UserResponse> => {
  try {
    const response = await userApi.get<UserResponse>('');
    return response.data;
  } catch (error: any) {
    console.error('获取用户列表失败:', error);
    return {
      success: false,
      error: error.response?.data?.error || '获取用户列表失败'
    };
  }
};

// 获取单个用户
export const getUserById = async (userId: string): Promise<UserResponse> => {
  try {
    const response = await userApi.get<UserResponse>(`/${userId}`);
    return response.data;
  } catch (error: any) {
    console.error('获取用户信息失败:', error);
    return {
      success: false,
      error: error.response?.data?.error || '获取用户信息失败'
    };
  }
};

// 更新用户信息
export const updateUser = async (userId: string, userData: Partial<User>): Promise<UserResponse> => {
  try {
    const response = await userApi.put<UserResponse>(`/${userId}`, userData);
    return response.data;
  } catch (error: any) {
    console.error('更新用户信息失败:', error);
    return {
      success: false,
      error: error.response?.data?.error || '更新用户信息失败'
    };
  }
};

// 删除用户
export const deleteUser = async (userId: string): Promise<UserResponse> => {
  try {
    const response = await userApi.delete<UserResponse>(`/${userId}`);
    return response.data;
  } catch (error: any) {
    console.error('删除用户失败:', error);
    // 记录更详细的错误信息
    if (error.response) {
      console.error('错误响应状态:', error.response.status);
      console.error('错误响应数据:', error.response.data);
    }
    
    return {
      success: false,
      error: error.response?.data?.error || error.message || '删除用户失败'
    };
  }
}; 