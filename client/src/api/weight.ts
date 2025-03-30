import axios from 'axios';
import type { ApiResponse } from './index';

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

// 接口定义
export interface WeightRecord {
  _id?: string;
  date: string;
  weight: number;
  note?: string;
}

export interface UserProfile {
  height: number;
  weight: number;
  age: number;
  gender: 'male' | 'female';
  startDate: string;
}

export interface WeightData {
  _id?: string;
  user?: string;
  profile: UserProfile;
  records: WeightRecord[];
  createdAt?: string;
  updatedAt?: string;
}

// 获取用户的体重数据
export const getWeightData = async (): Promise<ApiResponse<WeightData | null>> => {
  console.log('getWeightData');
  try {
    const response = await api.get<ApiResponse<WeightData | null>>('/weights');
    return response.data;
  } catch (error: any) {
    console.error('获取体重数据失败:', error);
    return {
      success: false,
      data: null,
      error: error.message || '无法连接到服务器'
    };
  }
};

// 创建或更新用户的体重数据
export const createOrUpdateWeightData = async (data: WeightData): Promise<ApiResponse<WeightData>> => {
  console.log('createOrUpdateWeightData');
  try {
    const response = await api.post<ApiResponse<WeightData>>('/weights', data);
    return response.data;
  } catch (error: any) {
    console.error('保存体重数据失败:', error);
    return {
      success: false,
      data: {} as WeightData,
      error: error.message || '无法连接到服务器'
    };
  }
};

// 添加体重记录
export const addWeightRecord = async (record: WeightRecord): Promise<ApiResponse<WeightData>> => {
  console.log('addWeightRecord');
  try {
    const response = await api.post<ApiResponse<WeightData>>('/weights/record', record);
    return response.data;
  } catch (error: any) {
    console.error('添加体重记录失败:', error);
    return {
      success: false,
      data: {} as WeightData,
      error: error.message || '无法连接到服务器'
    };
  }
};

// 删除体重记录
export const deleteWeightRecord = async (recordId: string): Promise<ApiResponse<WeightData>> => {
  console.log('deleteWeightRecord');
  try {
    const response = await api.delete<ApiResponse<WeightData>>(`/weights/record/${recordId}`);
    return response.data;
  } catch (error: any) {
    console.error(`删除体重记录 ${recordId} 失败:`, error);
    return {
      success: false,
      data: {} as WeightData,
      error: error.message || '无法连接到服务器'
    };
  }
};

// 重置用户的所有体重数据
export const resetWeightData = async (): Promise<ApiResponse<{}>> => {
  console.log('resetWeightData');
  try {
    const response = await api.delete<ApiResponse<{}>>('/weights');
    return response.data;
  } catch (error: any) {
    console.error('重置体重数据失败:', error);
    return {
      success: false,
      data: {},
      error: error.message || '无法连接到服务器'
    };
  }
}; 