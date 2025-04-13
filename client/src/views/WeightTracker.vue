<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import AppLayout from '../components/AppLayout.vue'
import WeightEChart from '../components/WeightEChart.vue'
import { toast } from '../plugins/toast'
import { getWeightData, createOrUpdateWeightData, addWeightRecord as apiAddWeightRecord, deleteWeightRecord as apiDeleteWeightRecord, resetWeightData as apiResetWeightData } from '../api/weight'

interface WeightRecord {
  _id?: string;
  date: string;
  weight: number; // 单位：斤
  note?: string;
}

interface UserProfile {
  height: number; // 单位：厘米
  weight: number; // 单位：斤
  age: number;
  gender: 'male' | 'female';
  startDate: string;
}

const weightRecords = ref<WeightRecord[]>([])
const userProfile = ref<UserProfile | null>(null)
const showProfileModal = ref(false)
const loading = ref(false)
const currentWeight = ref<number | null>(null)
const currentNote = ref('')
const formHeight = ref<number | null>(null)
const formWeight = ref<number | null>(null)
const formAge = ref<number | null>(null)
const formGender = ref<'male' | 'female'>('male')

// 计算属性：BMI
const bmi = computed(() => {
  if (!userProfile.value || !userProfile.value.weight || !userProfile.value.height) return null
  
  // 体重(kg) / 身高(m)²，注意单位转换：斤转kg，厘米转米
  const weightInKg = userProfile.value.weight / 2; // 1斤 = 0.5kg
  const heightInM = userProfile.value.height / 100; // 厘米转米
  return (weightInKg / (heightInM * heightInM)).toFixed(1);
})

// BMI状态描述
const bmiStatus = computed(() => {
  if (!bmi.value) return '';
  
  const bmiNum = parseFloat(bmi.value);
  if (bmiNum < 18.5) return '偏瘦';
  if (bmiNum < 24) return '正常';
  if (bmiNum < 28) return '超重';
  return '肥胖';
})

// 体重变化
const weightChange = computed(() => {
  if (!weightRecords.value || weightRecords.value.length < 2) return null;
  
  const latest = weightRecords.value[0].weight;
  const earliest = weightRecords.value[weightRecords.value.length - 1].weight;
  return (latest - earliest).toFixed(2);
})

// 相比昨天的变化
const dayChange = computed(() => {
  if (!weightRecords.value || weightRecords.value.length < 2) return null;
  
  const latest = weightRecords.value[0].weight;
  const yesterday = weightRecords.value[1].weight;
  return latest - yesterday;
})

// 加载数据
const loadData = async () => {
  loading.value = true;
  try {
    // 使用API获取数据
    const response = await getWeightData();
    
    if (response.success && response.data) {
      // 转换服务器数据格式为前端格式
      // 注意：服务器返回的dates是ISO格式，使用中国时区处理
      userProfile.value = response.data.profile;
      
      // 映射记录，确保日期格式一致，使用中国时区
      weightRecords.value = response.data.records.map(record => {
        const date = new Date(record.date);
        const chinaDate = new Date(date.getTime() + 8 * 60 * 60 * 1000);
        return {
          _id: record._id,
          date: chinaDate.toISOString().split('T')[0],
          weight: record.weight,
          note: record.note
        };
      });
    } else {
      // 如果没有从服务器获取数据，尝试从本地存储获取
      const savedData = localStorage.getItem('weightTrackerData');
      if (savedData) {
        const data = JSON.parse(savedData);
        weightRecords.value = data.records || [];
        userProfile.value = data.profile || null;
      }
    }
    
    if (!userProfile.value) {
      showProfileModal.value = true;
    }
  } catch (error) {
    console.error('加载数据失败:', error);
    toast.error('加载数据失败');
    
    // 如果API调用失败，尝试从本地存储获取
    const savedData = localStorage.getItem('weightTrackerData');
    if (savedData) {
      const data = JSON.parse(savedData);
      weightRecords.value = data.records || [];
      userProfile.value = data.profile || null;
    }
  } finally {
    loading.value = false;
  }
}

// 保存数据
const saveData = async () => {
  try {
    // 准备要保存到API的数据
    const apiData = {
      profile: userProfile.value!,
      records: weightRecords.value
    };
    
    // 先尝试使用API保存
    const response = await createOrUpdateWeightData(apiData);
    
    if (!response.success) {
      throw new Error(response.error || '保存失败');
    }
    
    // 备份到本地存储
    const localData = {
      records: weightRecords.value,
      profile: userProfile.value
    };
    localStorage.setItem('weightTrackerData', JSON.stringify(localData));
    
  } catch (error) {
    console.error('保存数据失败:', error);
    toast.error('保存到服务器失败，已备份到本地');
    
    // 如果API保存失败，仍然保存到本地
    const localData = {
      records: weightRecords.value,
      profile: userProfile.value
    };
    localStorage.setItem('weightTrackerData', JSON.stringify(localData));
  }
}

// 添加体重记录
const addWeightRecord = async () => {
  if (!currentWeight.value) {
    toast.error('请输入体重');
    return;
  }
  
  // 使用中国时区获取今天的日期（UTC+8）
  const today = new Date();
  const chinaDate = new Date(today.getTime() + 8 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  // 检查今天是否已有记录
  const existingTodayRecord = weightRecords.value.find(record => record.date === chinaDate);
  
  try {
    // 准备要发送到API的记录
    const recordData = {
      date: new Date(today.getTime() + 8 * 60 * 60 * 1000).toISOString(), // 确保日期是ISO格式字符串，使用中国时区
      weight: currentWeight.value,
      note: currentNote.value || undefined
    };
    
    // 调用API保存记录
    const response = await apiAddWeightRecord(recordData);
    
    if (!response.success) {
      throw new Error(response.error || '添加记录失败');
    }
    
    // 成功后更新本地数据
    if (existingTodayRecord) {
      existingTodayRecord.weight = currentWeight.value;
      existingTodayRecord.note = currentNote.value;
      toast.success('今日体重已更新');
    } else {
      // 添加新记录并放在数组前面
      weightRecords.value.unshift({
        date: chinaDate,
        weight: currentWeight.value,
        note: currentNote.value || undefined
      });
      toast.success('体重记录已添加');
    }
    
    // 重置表单
    currentWeight.value = null;
    currentNote.value = '';
    
    // 备份到本地存储
    const localData = {
      records: weightRecords.value,
      profile: userProfile.value
    };
    localStorage.setItem('weightTrackerData', JSON.stringify(localData));
    
  } catch (error) {
    console.error('添加记录失败:', error);
    toast.error('保存到服务器失败，尝试本地保存');
    
    // 如果API调用失败，仍在本地添加记录
    if (existingTodayRecord) {
      existingTodayRecord.weight = currentWeight.value!;
      existingTodayRecord.note = currentNote.value;
      toast.success('今日体重已在本地更新');
    } else {
      // 添加新记录并放在数组前面
      weightRecords.value.unshift({
        date: chinaDate,
        weight: currentWeight.value!,
        note: currentNote.value || undefined
      });
      toast.success('体重记录已添加到本地');
    }
    
    // 重置表单
    currentWeight.value = null;
    currentNote.value = '';
    
    // 保存到本地存储
    saveData();
  }
}

// 保存个人资料
const saveProfile = async () => {
  if (!formHeight.value || !formWeight.value || !formAge.value) {
    toast.error('请填写完整信息');
    return;
  }
  
  // 获取中国时区的当前时间
  const now = new Date();
  const chinaTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  
  // 更新用户资料
  userProfile.value = {
    height: formHeight.value,
    weight: formWeight.value,
    age: formAge.value,
    gender: formGender.value,
    startDate: chinaTime.toISOString() // 使用中国时区的ISO格式日期
  };
  
  // 添加第一条体重记录
  const chinaDate = chinaTime.toISOString().split('T')[0];
  weightRecords.value = [{
    date: chinaDate,
    weight: formWeight.value
  }];
  
  try {
    // 调用API保存数据
    await saveData();
    showProfileModal.value = false;
    toast.success('个人资料已保存');
  } catch (error) {
    console.error('保存个人资料失败:', error);
    toast.error('保存到服务器失败，已备份到本地');
    showProfileModal.value = false;
  }
}

// 预填表单数据
const prefillFormData = () => {
  if (userProfile.value) {
    formHeight.value = userProfile.value.height;
    formWeight.value = userProfile.value.weight;
    formAge.value = userProfile.value.age;
    formGender.value = userProfile.value.gender;
  }
};

// 打开资料编辑模态框
const openProfileModal = () => {
  prefillFormData();
  showProfileModal.value = true;
};

// 格式化日期，接受字符串或Date对象，转为中国时区显示
const formatDate = (dateInput: string | Date) => {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  // 调整为中国时区
  const chinaDate = new Date(date.getTime() + 8 * 60 * 60 * 1000);
  return `${chinaDate.getMonth() + 1}月${chinaDate.getDate()}日`;
}

// 页面加载时获取数据
onMounted(() => {
  loadData();
})

// 监听模态框打开
watch(showProfileModal, (newVal) => {
  if (newVal) {
    prefillFormData();
  }
});

// 删除记录
const deleteRecord = (index: number) => {
  const record = weightRecords.value[index];
  
  toast.confirm('确定要删除此记录吗？', {
    type: 'warning',
    onConfirm: async () => {
      try {
        // 如果记录有ID（来自服务器），调用API删除
        if (record._id) {
          const response = await apiDeleteWeightRecord(record._id);
          
          if (!response.success) {
            throw new Error(response.error || '删除记录失败');
          }
        }
        
        // 从本地数组中删除
        weightRecords.value.splice(index, 1);
        toast.success('记录已删除');
        
        // 备份到本地存储
        const localData = {
          records: weightRecords.value,
          profile: userProfile.value
        };
        localStorage.setItem('weightTrackerData', JSON.stringify(localData));
      } catch (error) {
        console.error('删除记录失败:', error);
        toast.error('从服务器删除失败，正在删除本地记录');
        
        // 如果API调用失败，仍在本地删除
        weightRecords.value.splice(index, 1);
        saveData();
        toast.success('记录已从本地删除');
      }
    }
  });
}

// 重置所有数据
const resetAllData = () => {
  toast.confirm('确定要重置所有数据吗？此操作不可恢复!', {
    type: 'warning',
    onConfirm: async () => {
      try {
        // 调用API删除所有数据
        const response = await apiResetWeightData();
        
        if (!response.success) {
          throw new Error(response.error || '重置数据失败');
        }
        
        // 重置本地数据
        weightRecords.value = [];
        userProfile.value = null;
        localStorage.removeItem('weightTrackerData');
        showProfileModal.value = true;
        toast.success('所有数据已重置');
      } catch (error) {
        console.error('重置数据失败:', error);
        toast.error('从服务器重置失败，正在重置本地数据');
        
        // 如果API调用失败，仍重置本地数据
        weightRecords.value = [];
        userProfile.value = null;
        localStorage.removeItem('weightTrackerData');
        showProfileModal.value = true;
        toast.success('本地数据已重置');
      }
    }
  });
}

// 计算理想体重
const idealWeight = computed(() => {
  if (!userProfile.value || !userProfile.value.height) return null;
  
  // 理想体重 = (身高cm - 100) * 0.9 * 2 (转换为斤)
  const heightInCm = userProfile.value.height;
  const ideal = ((heightInCm - 100) * 0.9 * 2).toFixed(1);
  console.log('计算理想体重:', ideal); // 调试信息
  return ideal;
});

// 转换为数值类型的理想体重（用于图表）
const idealWeightNumber = computed(() => {
  if (!idealWeight.value) return null;
  return parseFloat(idealWeight.value);
});

// 计算完成天数 - 用于计算目标完成
// const daysSinceStart = computed(() => {
//   if (!userProfile.value || !userProfile.value.startDate) return 0;
  
//   const start = new Date(userProfile.value.startDate);
//   const today = new Date();
  
//   const diffTime = Math.abs(today.getTime() - start.getTime());
//   return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
// })

// 处理跳过初始设置
const handleSkip = () => {
  showProfileModal.value = false;
  toast.info('您可以随时点击"开始记录"按钮来设置个人资料');
}


// 计算连续减重天数
const consecutiveWeightLossDays = computed(() => {
  if (!weightRecords.value || weightRecords.value.length < 2) return 0;
  
  let count = 0;
  for (let i = 0; i < weightRecords.value.length - 1; i++) {
    if (weightRecords.value[i].weight < weightRecords.value[i + 1].weight) {
      count++;
    } else {
      break;
    }
  }
  
  return count;
});

// 计算减重/增重速度（每周平均变化）
const weeklyWeightChangeRate = computed(() => {
  if (!weightRecords.value || weightRecords.value.length < 2) return null;
  
  const latest = weightRecords.value[0].weight;
  const earliest = weightRecords.value[weightRecords.value.length - 1].weight;
  const totalChange = latest - earliest;
  
  // 计算总天数
  const firstDate = new Date(weightRecords.value[weightRecords.value.length - 1].date);
  const lastDate = new Date(weightRecords.value[0].date);
  const daysDiff = Math.max(1, Math.round((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)));
  
  // 计算周数（至少为1周）
  const weeks = Math.max(1, daysDiff / 7);
  
  // 每周平均变化
  return (totalChange / weeks).toFixed(1);
});

// 目标体重相关计算
const weightGoal = computed(() => {
  if (!userProfile.value || !idealWeight.value) return null;
  
  const currentWeight = weightRecords.value[0]?.weight || userProfile.value.weight;
  const targetWeight = parseFloat(idealWeight.value);
  
  // 当前体重与目标体重的差距
  const gap = currentWeight - targetWeight;
  
  // 达成率 (如果目标是减重，则计算已减去的部分占总差距的百分比)
  let achievementRate = 0;
  if (gap > 0) { // 需要减重
    if (weightChange.value && weightChange.value < 0) { // 已经有减重
      const initialGap = userProfile.value.weight - targetWeight;
      const currentGap = currentWeight - targetWeight;
      achievementRate = Math.min(100, Math.round(((initialGap - currentGap) / initialGap) * 100));
    }
  } else if (gap < 0) { // 需要增重
    if (weightChange.value && weightChange.value > 0) { // 已经有增重
      const initialGap = targetWeight - userProfile.value.weight;
      const currentGap = targetWeight - currentWeight;
      achievementRate = Math.min(100, Math.round(((initialGap - currentGap) / initialGap) * 100));
    }
  } else { // 刚好达标
    achievementRate = 100;
  }
  
  return {
    target: targetWeight,
    gap: Math.abs(gap),
    needToLose: gap > 0,
    achievementRate: achievementRate
  };
});

// 计算估计达标时间
const estimatedCompletionDate = computed(() => {
  if (!weightGoal.value || !weeklyWeightChangeRate.value || weightGoal.value.gap === 0) return null;
  
  // 如果变化方向不对（例如想减重但体重在增加），则无法估计
  const changeRate = parseFloat(weeklyWeightChangeRate.value);
  if ((weightGoal.value.needToLose && changeRate >= 0) || 
      (!weightGoal.value.needToLose && changeRate <= 0)) {
    return null;
  }
  
  // 计算剩余周数
  const remainingWeeks = Math.abs(weightGoal.value.gap / changeRate);
  
  // 计算达标日期
  const today = new Date();
  const completionDate = new Date(today.setDate(today.getDate() + Math.round(remainingWeeks * 7)));
  
  return {
    date: completionDate,
    weeks: Math.round(remainingWeeks)
  };
});

// 计算体重变化速度评价
const weightChangeRateEvaluation = computed(() => {
  if (!weeklyWeightChangeRate.value) return '';
  
  const rate = Math.abs(parseFloat(weeklyWeightChangeRate.value));
  
  if (weightGoal.value?.needToLose) {
    // 减重速度评价
    if (rate <= 0) return '体重没有下降，建议调整饮食和运动计划';
    if (rate < 0.5) return '减重速度较慢，但更健康和可持续';
    if (rate <= 1) return '减重速度适中，符合健康标准';
    if (rate <= 2) return '减重速度较快，注意营养均衡';
    return '减重速度过快，可能不够健康，建议咨询医生';
  } else {
    // 增重速度评价
    if (rate <= 0) return '体重没有增加，建议调整饮食计划';
    if (rate < 0.5) return '增重速度较慢，可适当增加摄入';
    if (rate <= 1) return '增重速度适中，继续保持';
    if (rate <= 2) return '增重速度较快，注意增加的是肌肉而非脂肪';
    return '增重速度过快，可能不够健康，建议放缓节奏';
  }
});

// 根据BMI状态返回对应的样式类
const getBmiStatusClass = (status: string) => {
  switch (status) {
    case '偏瘦': return 'status-thin';
    case '正常': return 'status-normal';
    case '超重': return 'status-overweight';
    case '肥胖': return 'status-obese';
    default: return '';
  }
}

// 排序方向
const sortDirection = ref('desc'); // 默认最新在前
const recordsPerPage = ref(10);
const currentPage = ref(1);

// 获取要显示的记录
const displayRecords = computed(() => {
  const sorted = [...weightRecords.value].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return sortDirection.value === 'asc' ? dateA - dateB : dateB - dateA;
  });
  
  return sorted.slice(0, currentPage.value * recordsPerPage.value);
});

// 是否还有更多记录
const hasMoreRecords = computed(() => {
  return displayRecords.value.length < weightRecords.value.length;
});

// 加载更多记录
const loadMoreRecords = () => {
  currentPage.value++;
};

// 排序记录
const sortRecords = (_field: string, direction: 'asc' | 'desc') => {
  sortDirection.value = direction;
};

// 获取原始索引
const getOriginalIndex = (displayIndex: number) => {
  const record = displayRecords.value[displayIndex];
  return weightRecords.value.findIndex(r => r.date === record.date);
};

// 获取星期几（使用中国时区）
const getWeekday = (dateStr: string) => {
  const date = new Date(dateStr);
  // 调整为中国时区
  const chinaDate = new Date(date.getTime() + 8 * 60 * 60 * 1000);
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return weekdays[chinaDate.getDay()];
};

// 设置60天目标
const goalDays = 60; // 目标天数为60天

// 计算目标完成率基于60天
const goalCompletionRate = computed(() => {
  if (weightRecords.value.length === 0) return 0;
  return Math.min(100, Math.round((weightRecords.value.length / goalDays) * 100));
});

// 计算距离目标完成还剩余天数
const remainingDays = computed(() => {
  const recordedDays = weightRecords.value.length;
  return Math.max(0, goalDays - recordedDays);
});

// 计算目标完成日期
const goalCompletionDate = computed(() => {
  if (remainingDays.value === 0) return null;
  
  const today = new Date();
  today.setDate(today.getDate() + remainingDays.value);
  return today;
});
</script>

<template>
  <AppLayout 
    title="体重记录"
    searchPlaceholder="搜索体重记录..."
  >
    <template #header-actions>
      <button class="add-task-btn" @click="openProfileModal" v-if="userProfile">
        <span class="material-icons-round">edit</span>
        修改资料
      </button>
      <button class="add-task-btn danger" @click="resetAllData">
        <span class="material-icons-round">restart_alt</span>
        重置数据
      </button>
    </template>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading">
      <span class="material-icons-round loading-icon">sync</span>
      加载中...
    </div>

    <div v-else>
      <!-- 用户个人统计面板 -->
      <div class="stats-container" v-if="userProfile">
        <div class="stat-card highlight-card">
          <div class="stat-icon">
            <span class="material-icons-round">monitor_weight</span>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ weightRecords[0]?.weight || '-' }} 斤</div>
            <div class="stat-label">当前体重</div>
          </div>
          <div class="stat-trend" v-if="dayChange !== null">
            <div class="trend-arrow" :class="{'trend-up': dayChange > 0, 'trend-down': dayChange < 0}">
              <span class="material-icons-round">{{ dayChange < 0 ? 'trending_down' : 'trending_up' }}</span>
              {{ Math.abs(dayChange).toFixed(1) }}
            </div>
            <div class="trend-label">较昨日</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">
            <span class="material-icons-round">timeline</span>
          </div>
          <div class="stat-content">
            <div class="stat-value" :class="{'positive': weightChange && parseFloat(weightChange) < 0, 'negative': weightChange && parseFloat(weightChange) > 0}">
              {{ weightChange ? (parseFloat(weightChange) > 0 ? '+' : '') + weightChange + ' 斤' : '-' }}
            </div>
            <div class="stat-label">总体变化</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">
            <span class="material-icons-round">favorite</span>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ bmi || '-' }}</div>
            <div class="stat-label">BMI <span class="bmi-status" :class="getBmiStatusClass(bmiStatus)">({{ bmiStatus }})</span></div>
          </div>
        </div>
        
        <div class="stat-card goal-card">
          <div class="stat-icon">
            <span class="material-icons-round">emoji_events</span>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ weightRecords.length }}/{{ goalDays }}</div>
            <div class="stat-label">坚持天数</div>
            <div class="goal-progress">
              <div class="progress-container">
                <div class="progress-bar" :style="{width: goalCompletionRate + '%'}"></div>
                <span>{{ goalCompletionRate }}%</span>
              </div>
              <div class="goal-info" v-if="remainingDays > 0">
                还需{{ remainingDays }}天，预计{{ goalCompletionDate ? formatDate(goalCompletionDate) : '未知' }}完成
              </div>
              <div class="goal-info completed" v-else>
                恭喜！已完成60天目标
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 今日记录表单 -->
      <div class="form-card">
        <div class="card-header">
          <span class="material-icons-round card-icon">add_circle</span>
          <h3>今日体重记录</h3>
        </div>
        <div class="form-content">
          <div class="form-row">
            <div class="form-group">
              <label for="weight">体重 (斤)</label>
              <input 
                type="number" 
                id="weight" 
                v-model="currentWeight" 
                placeholder="请输入今日体重"
                step="0.1"
                class="form-input"
              >
            </div>
            <div class="form-group">
              <label for="note">备注</label>
              <input 
                type="text" 
                id="note" 
                v-model="currentNote" 
                placeholder="可选：今日饮食、运动等情况"
                class="form-input"
              >
            </div>
          </div>
          <button class="primary-btn" @click="addWeightRecord">
            <span class="material-icons-round">add</span>
            记录今日体重
          </button>
        </div>
      </div>

      <!-- 体重变化趋势图表 -->
      <div v-if="weightRecords.length >= 2" class="chart-section">
        <div class="section-header">
          <h3 class="section-title">体重变化趋势</h3>
          <div class="chart-actions">
            <span class="chart-tip">支持缩放查看详细数据</span>
          </div>
        </div>
        <WeightEChart 
          :records="weightRecords" 
          :ideal-weight="idealWeightNumber" 
        />
      </div>

      <!-- 分析卡片区域 -->
      <div class="analysis-dashboard">
        <!-- 目标达成卡片 -->
        <div class="analysis-card" v-if="weightGoal">
          <div class="card-header">
            <span class="material-icons-round card-icon">flag</span>
            <h3>体重目标</h3>
          </div>
          <div class="analysis-item">
            <span>当前体重：</span>
            <span class="highlight">{{ weightRecords[0]?.weight || '-' }} 斤</span>
          </div>
          <div class="analysis-item">
            <span>理想体重：</span>
            <span class="highlight">{{ weightGoal.target }} 斤</span>
          </div>
          <div class="analysis-item">
            <span>当前差距：</span>
            <span>{{ weightGoal.gap.toFixed(1) }} 斤 (需要{{ weightGoal.needToLose ? '减重' : '增重' }})</span>
          </div>
          <div class="analysis-item">
            <span>达成进度：</span>
            <div class="progress-container">
              <div class="progress-bar" :style="{width: weightGoal.achievementRate + '%'}"></div>
              <span>{{ weightGoal.achievementRate }}%</span>
            </div>
          </div>
          <div class="analysis-item" v-if="estimatedCompletionDate">
            <span>预计达成：</span>
            <span>{{ formatDate(estimatedCompletionDate.date) }} (约{{ estimatedCompletionDate.weeks }}周)</span>
          </div>
        </div>

        <!-- 变化趋势卡片 -->
        <div class="analysis-card">
          <div class="card-header">
            <span class="material-icons-round card-icon">trending_down</span>
            <h3>变化趋势</h3>
          </div>
          <div class="analysis-item">
            <span>周均变化：</span>
            <span :class="{'positive': weeklyWeightChangeRate && parseFloat(weeklyWeightChangeRate) < 0, 'negative': weeklyWeightChangeRate && parseFloat(weeklyWeightChangeRate) > 0}">
              {{ weeklyWeightChangeRate ? (parseFloat(weeklyWeightChangeRate) > 0 ? '+' : '') + weeklyWeightChangeRate : '-' }} 斤/周
            </span>
          </div>
          <div class="analysis-item">
            <span>连续减重：</span>
            <span class="positive">{{ consecutiveWeightLossDays }} 天</span>
          </div>
          <div class="analysis-item">
            <span>变化评价：</span>
            <span>{{ weightChangeRateEvaluation }}</span>
          </div>
          <div class="analysis-item">
            <span>建议：</span>
            <span>{{ weightGoal?.needToLose ? '健康减重速度为每周0.5-1斤' : '健康增重速度为每周0.5-1斤' }}</span>
          </div>
        </div>
      </div>

      <!-- 历史记录区域 -->
      <div class="history-section" v-if="weightRecords.length > 0">
        <div class="section-header">
          <h3 class="section-title">历史记录</h3>
          <div class="section-actions">
            <button class="action-btn" @click="sortRecords('date', sortDirection === 'asc' ? 'desc' : 'asc')">
              <span class="material-icons-round">sort</span>
              {{ sortDirection === 'asc' ? '最新优先' : '最早优先' }}
            </button>
          </div>
        </div>
        
        <div class="table-container">
          <table class="records-table">
            <thead>
              <tr>
                <th class="date-column">日期</th>
                <th class="weight-column">体重(斤)</th>
                <th class="change-column">变化</th>
                <th class="note-column">备注</th>
                <th class="action-column">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(record, index) in displayRecords" :key="record.date">
                <td class="date-cell">
                  <div class="date-value">{{ formatDate(record.date) }}</div>
                  <div class="weekday">{{ getWeekday(record.date) }}</div>
                </td>
                <td class="weight-cell">{{ record.weight }}</td>
                <td class="change-cell" v-if="index < displayRecords.length - 1" 
                    :class="{'positive': record.weight < displayRecords[index + 1].weight, 'negative': record.weight > displayRecords[index + 1].weight}">
                  {{ record.weight - displayRecords[index + 1].weight > 0 ? '+' : '' }}{{ (record.weight - displayRecords[index + 1].weight).toFixed(1) }}
                </td>
                <td class="change-cell" v-else>--</td>
                <td class="note-cell">{{ record.note || '--' }}</td>
                <td class="action-cell">
                  <button class="icon-btn delete-btn" @click="deleteRecord(getOriginalIndex(index))">
                    <span class="material-icons-round">delete</span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div class="load-more" v-if="hasMoreRecords">
          <button class="secondary-btn" @click="loadMoreRecords">
            加载更多记录
          </button>
        </div>
      </div>

      <!-- 无数据提示 -->
      <div class="empty-state" v-if="!userProfile || weightRecords.length === 0">
        <span class="material-icons-round large-icon">scale</span>
        <p>还没有体重记录数据</p>
        <button class="primary-btn" @click="openProfileModal">
          开始记录
        </button>
      </div>
    </div>

    <!-- 个人资料表单弹窗 -->
    <div class="modal" v-if="showProfileModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ userProfile ? '修改个人资料' : '开始记录体重' }}</h3>
          <button class="close-btn" @click="showProfileModal = false" v-if="userProfile">
            <span class="material-icons-round">close</span>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label for="formHeight">身高 (厘米)</label>
            <input 
              type="number" 
              id="formHeight" 
              v-model="formHeight" 
              placeholder="请输入身高"
            >
          </div>
          <div class="form-group">
            <label for="formWeight">体重 (斤)</label>
            <input 
              type="number" 
              id="formWeight" 
              v-model="formWeight" 
              placeholder="请输入体重"
              step="0.1"
            >
          </div>
          <div class="form-group">
            <label for="formAge">年龄</label>
            <input 
              type="number" 
              id="formAge" 
              v-model="formAge" 
              placeholder="请输入年龄"
            >
          </div>
          <div class="form-group">
            <label>性别</label>
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" v-model="formGender" value="male">
                <span>男性</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="formGender" value="female">
                <span>女性</span>
              </label>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="primary-btn" @click="saveProfile">
            {{ userProfile ? '保存修改' : '开始记录' }}
          </button>
          <button class="secondary-btn" @click="showProfileModal = false" v-if="userProfile">
            取消
          </button>
          <button class="secondary-btn" @click="handleSkip" v-else>
            稍后再说
          </button>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<style scoped>
.stats-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background-color: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: flex-start;
  position: relative;
}

.highlight-card {
  border-left: 4px solid #6366f1;
  background-color: #f9fafb;
}

.stat-icon {
  margin-right: 12px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: rgba(99, 102, 241, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon .material-icons-round {
  color: #6366f1;
  font-size: 24px;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 4px;
  color: #4b5563;
}

.stat-label {
  font-size: 14px;
  color: #6b7280;
}

.bmi-status {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
}

.status-thin {
  background-color: #93c5fd;
  color: #1e40af;
}

.status-normal {
  background-color: #86efac;
  color: #166534;
}

.status-overweight {
  background-color: #fcd34d;
  color: #92400e;
}

.status-obese {
  background-color: #fca5a5;
  color: #b91c1c;
}

.trend-arrow {
  display: flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 16px;
  font-size: 14px;
  font-weight: 500;
  position: absolute;
  top: 16px;
  right: 16px;
}

.trend-up {
  background-color: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.trend-down {
  background-color: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.trend-arrow .material-icons-round {
  font-size: 16px;
  margin-right: 4px;
}

.trend-label {
  font-size: 10px;
  color: #6b7280;
  text-align: center;
  position: absolute;
  top: 48px;
  right: 16px;
}

.gap-indicator {
  position: absolute;
  top: 16px;
  right: 16px;
  text-align: right;
}

.gap-value {
  font-weight: 600;
  font-size: 14px;
  padding: 2px 8px;
  border-radius: 12px;
}

.gap-positive {
  background-color: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.gap-negative {
  background-color: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.gap-label {
  font-size: 10px;
  color: #6b7280;
  margin-top: 4px;
}

.positive {
  color: #10b981;
}

.negative {
  color: #ef4444;
}

.highlight {
  color: #6366f1;
  font-weight: 600;
}

.analysis-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.analysis-card {
  background-color: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.analysis-card h3 {
  margin-top: 0;
  margin-bottom: 16px;
  font-size: 18px;
  color: #374151;
}

.analysis-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f3f4f6;
}

.analysis-item:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.large-icon {
  font-size: 64px;
  color: #9ca3af;
  margin-bottom: 16px;
}

.empty-state p {
  font-size: 16px;
  color: #6b7280;
  margin-bottom: 24px;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal-content {
  background-color: #fff;
  border-radius: 8px;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  position: relative;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  color: #111827;
}

.close-btn {
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-body {
  padding: 20px;
}

.modal-footer {
  padding: 16px 20px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  border-top: 1px solid #e5e7eb;
}

.secondary-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 16px;
  background-color: #f3f4f6;
  color: #4b5563;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.secondary-btn:hover {
  background-color: #e5e7eb;
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
  color: #6b7280;
}

.loading-icon {
  animation: spin 1s linear infinite;
  margin-right: 8px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.progress-container {
  width: 100%;
  background-color: #e5e7eb;
  border-radius: 4px;
  height: 8px;
  position: relative;
  margin-top: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.progress-bar {
  height: 100%;
  border-radius: 4px;
  background-color: #6366f1;
  position: absolute;
  left: 0;
  transition: width 0.5s ease;
}

.progress-container span {
  position: relative;
  z-index: 1;
  font-size: 12px;
  font-weight: 600;
  color: #4b5563;
  margin-left: 8px;
}

.chart-section {
  margin: 0 auto 20px;
  width: 100%;
  background-color: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  min-height: 400px;
  display: flex;
  flex-direction: column;
}

.section-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: #4b5563;
  margin-bottom: 15px;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 8px;
}

.chart-wrapper {
  flex: 1;
  min-height: 350px;
}

.analysis-dashboard {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
  margin-top: 24px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  border-bottom: 1px solid #f3f4f6;
  padding-bottom: 10px;
}

.card-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #4b5563;
}

.card-icon {
  font-size: 20px;
  color: #6366f1;
}

.chart-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-bottom: 8px;
}

.chart-tip {
  font-size: 12px;
  color: #6b7280;
  background-color: #f3f4f6;
  padding: 4px 8px;
  border-radius: 4px;
}

.analysis-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f3f4f6;
}

.analysis-item:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.progress-container {
  width: 100%;
  background-color: #e5e7eb;
  border-radius: 4px;
  height: 8px;
  position: relative;
  margin-top: 6px;
  display: flex;
  align-items: center;
}

.progress-bar {
  height: 100%;
  border-radius: 4px;
  background-color: #6366f1;
  position: absolute;
  left: 0;
  transition: width 0.5s ease;
}

.progress-container span {
  font-size: 12px;
  font-weight: 600;
  color: #4b5563;
  margin-left: 8px;
  position: relative;
  z-index: 1;
}

.form-card {
  background-color: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.form-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-row {
  display: flex;
  gap: 16px;
}

.form-group {
  flex: 1;
}

.form-input {
  width: 100%;
  padding: 8px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
}

.primary-btn {
  background-color: #6366f1;
  color: #fff;
  border: none;
  padding: 10px 16px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 0 auto;
  min-width: 160px;
}

.primary-btn:hover {
  background-color: #4f46e5;
}

.history-section {
  background-color: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  background-color: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  color: #6b7280;
  font-size: 12px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.action-btn:hover {
  background-color: #e5e7eb;
}

.action-btn .material-icons-round {
  font-size: 16px;
}

.table-container {
  width: 100%;
  overflow-x: auto;
  margin-bottom: 16px;
}

.records-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 14px;
}

.records-table th {
  background-color: #f9fafb;
  color: #4b5563;
  font-weight: 600;
  padding: 12px 16px;
  border-bottom: 2px solid #e5e7eb;
}

.records-table td {
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
  vertical-align: middle;
}

.records-table tr:hover {
  background-color: #f3f4f6;
}

.date-column {
  width: 20%;
}

.weight-column {
  width: 15%;
}

.change-column {
  width: 15%;
}

.note-column {
  width: 40%;
}

.action-column {
  width: 10%;
  text-align: center;
}

.date-cell {
  display: flex;
  flex-direction: column;
}

.date-value {
  font-weight: 500;
}

.weekday {
  font-size: 12px;
  color: #9ca3af;
}

.weight-cell {
  font-weight: 600;
}

.change-cell {
  font-weight: 500;
}

.note-cell {
  color: #6b7280;
  max-width: 250px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.action-cell {
  text-align: center;
}

.load-more {
  margin-top: 16px;
  display: flex;
  justify-content: center;
}

.secondary-btn {
  padding: 8px 16px;
  background-color: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  color: #4b5563;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.secondary-btn:hover {
  background-color: #e5e7eb;
}

@media (max-width: 768px) {
  .form-row {
    flex-direction: column;
  }
}

.record-weight {
  display: flex;
  align-items: flex-end;
  gap: 8px;
}

.weight-value {
  font-weight: 600;
  color: #374151;
  font-size: 18px;
}

.weight-change {
  font-size: 12px;
  margin-bottom: 3px;
}

.icon-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.delete-btn {
  color: #9ca3af;
}

.delete-btn:hover {
  color: #ef4444;
  background-color: rgba(239, 68, 68, 0.1);
}

.radio-group {
  display: flex;
  gap: 20px;
  margin-top: 8px;
}

.radio-label {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.radio-label input[type="radio"] {
  margin-right: 8px;
}
</style> 