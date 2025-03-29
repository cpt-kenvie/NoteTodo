import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 添加请求拦截器，在每个请求中加入token
api.interceptors.request.use(
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

// 添加响应拦截器，处理未授权错误
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // 401错误，清除token并跳转到登录页
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// 使用localStorage模拟数据库
export interface Note {
  _id: string;
  title: string;
  content: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  count?: number;
  error?: string;
}


// 获取所有笔记
export const getAllNotes = async (): Promise<ApiResponse<Note[]>> => {
  try {
    const response = await api.get<ApiResponse<Note[]>>('/notes');
    return response.data;
  } catch (error: any) {
    console.error('获取笔记失败:', error);
    return {
      success: false,
      data: [],
      error: error.message || '无法连接到服务器'
    };
  }
};

// 获取单个笔记
export const getNoteById = async (id: string): Promise<ApiResponse<Note>> => {
  try {
    const response = await api.get<ApiResponse<Note>>(`/notes/${id}`);
    return response.data;
  } catch (error: any) {
    console.error(`获取笔记 ${id} 失败:`, error);
    return {
      success: false,
      data: {} as Note,
      error: error.message || '无法连接到服务器'
    };
  }
};

// 创建笔记
export const createNote = async (note: Partial<Note>): Promise<ApiResponse<Note>> => {
  try {
    const response = await api.post<ApiResponse<Note>>('/notes', note);
    return response.data;
  } catch (error: any) {
    console.error('创建笔记失败:', error);
    return {
      success: false,
      data: {} as Note,
      error: error.message || '无法连接到服务器'
    };
  }
};

// 更新笔记
export const updateNote = async (id: string, note: Partial<Note>): Promise<ApiResponse<Note>> => {
  try {
    const response = await api.put<ApiResponse<Note>>(`/notes/${id}`, note);
    return response.data;
  } catch (error: any) {
    console.error(`更新笔记 ${id} 失败:`, error);
    return {
      success: false,
      data: {} as Note,
      error: error.message || '无法连接到服务器'
    };
  }
};

// 删除笔记
export const deleteNote = async (id: string): Promise<ApiResponse<{}>> => {
  try {
    const response = await api.delete<ApiResponse<{}>>(`/notes/${id}`);
    return response.data;
  } catch (error: any) {
    console.error(`删除笔记 ${id} 失败:`, error);
    return {
      success: false,
      data: {},
      error: error.message || '无法连接到服务器'
    };
  }
}; 