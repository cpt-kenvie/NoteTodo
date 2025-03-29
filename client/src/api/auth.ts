import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const authApi = axios.create({
  baseURL: `${API_URL}/auth`,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 拦截器 - 添加授权头
authApi.interceptors.request.use(
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

// 接口类型
export interface AuthResponse {
  success: boolean;
  token?: string;
  data?: {
    id: string;
    username: string;
    avatar: string;
    isAdmin: boolean;
  };
  error?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  password: string;
  avatar?: string;
}

// 注册用户
export const register = async (credentials: RegisterCredentials): Promise<AuthResponse> => {
  try {
    const response = await authApi.post<AuthResponse>('/register', credentials);
    
    if (response.data.success && response.data.token) {
      localStorage.setItem('token', response.data.token);
      // 同时保存用户头像信息
      if (response.data.data?.avatar) {
        localStorage.setItem('userAvatar', response.data.data.avatar);
      }
      // 保存管理员状态
      if (response.data.data?.isAdmin) {
        localStorage.setItem('isAdmin', 'true');
      }
    }
    
    return response.data;
  } catch (error: any) {
    console.error('注册失败:', error);
    return {
      success: false,
      error: error.response?.data?.error || '注册失败'
    };
  }
};

// 用户登录
export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  try {
    const response = await authApi.post<AuthResponse>('/login', credentials);
    
    if (response.data.success && response.data.token) {
      localStorage.setItem('token', response.data.token);
      // 同时保存用户头像信息
      if (response.data.data?.avatar) {
        localStorage.setItem('userAvatar', response.data.data.avatar);
      }
      // 保存管理员状态
      if (response.data.data?.isAdmin) {
        localStorage.setItem('isAdmin', 'true');
      } else {
        localStorage.removeItem('isAdmin');
      }
    }
    
    return response.data;
  } catch (error: any) {
    console.error('登录失败:', error);
    return {
      success: false,
      error: error.response?.data?.error || '登录失败'
    };
  }
};

// 注销
export const logout = (): void => {
  localStorage.removeItem('token');
  localStorage.removeItem('userAvatar');
  localStorage.removeItem('isAdmin');
};

// 获取当前用户信息
export const getCurrentUser = async (): Promise<AuthResponse> => {
  try {
    const response = await authApi.get<AuthResponse>('/me');
    // 保存用户头像信息
    if (response.data.success && response.data.data?.avatar) {
      localStorage.setItem('userAvatar', response.data.data.avatar);
    }
    // 保存管理员状态
    if (response.data.success && response.data.data?.isAdmin) {
      localStorage.setItem('isAdmin', 'true');
    } else {
      localStorage.removeItem('isAdmin');
    }
    return response.data;
  } catch (error: any) {
    console.error('获取用户信息失败:', error);
    return {
      success: false,
      error: error.response?.data?.error || '获取用户信息失败'
    };
  }
};

// 检查是否已登录
export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem('token');
};

// 检查是否是管理员
export const isAdmin = (): boolean => {
  return localStorage.getItem('isAdmin') === 'true';
};

// 获取用户头像
export const getUserAvatar = (): string => {
  return localStorage.getItem('userAvatar') || 'https://randomuser.me/api/portraits/lego/1.jpg';
};

// 更新用户头像
export const updateAvatar = async (avatar: string): Promise<AuthResponse> => {
  try {
    const response = await authApi.put<AuthResponse>('/avatar', { avatar });
    
    if (response.data.success && response.data.data?.avatar) {
      localStorage.setItem('userAvatar', response.data.data.avatar);
    }
    
    return response.data;
  } catch (error: any) {
    console.error('更新头像失败:', error);
    return {
      success: false,
      error: error.response?.data?.error || '更新头像失败'
    };
  }
}; 