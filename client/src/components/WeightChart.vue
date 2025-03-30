<script setup lang="ts">
import { defineProps, computed, ref } from 'vue';
import { Line } from 'vue-chartjs';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import type { ChartOptions } from 'chart.js';

// 注册Chart.js组件
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// 定义props
interface WeightRecord {
  date: string;
  weight: number;
  note?: string;
}

const props = defineProps<{
  records: WeightRecord[];
  idealWeight?: number | null;
}>();

// 处理图表数据
const chartData = computed(() => {
  if (!props.records || props.records.length === 0) {
    return {
      labels: [],
      datasets: []
    };
  }

  // 按日期升序排序记录，取最近30条（如果超过30条）
  const sortedRecords = [...props.records]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-30);

  // 提取日期和体重数据
  const labels = sortedRecords.map(record => {
    const date = new Date(record.date);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  });
  
  const weights = sortedRecords.map(record => record.weight);
  
  // 生成理想体重数据
  const idealWeights = props.idealWeight ? Array(labels.length).fill(props.idealWeight) : null;

  // 构建数据集
  const datasets = [
    {
      label: '体重(斤)',
      backgroundColor: 'rgba(99, 102, 241, 0.2)',
      borderColor: 'rgba(99, 102, 241, 1)',
      borderWidth: 2,
      pointBackgroundColor: 'rgba(99, 102, 241, 1)',
      pointRadius: 4,
      tension: 0.2,
      data: weights
    }
  ];
  
  // 如果有理想体重，添加理想体重线
  if (idealWeights) {
    datasets.push({
      label: '理想体重(斤)',
      borderColor: 'rgba(16, 185, 129, 0.7)',
      borderWidth: 2,
      borderDash: [5, 5],
      fill: false,
      pointRadius: 0,
      data: idealWeights
    } as any);
  }

  return {
    labels,
    datasets
  };
});

// 图表选项
const chartOptions = computed(() => {
  return {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: false,
        // 为Y轴设置合适的最小值和最大值，使图表更加聚焦于变化
        suggestedMin: props.records.length === 0 ? 0 : 
          Math.max(0, Math.min(...props.records.map(r => r.weight)) - 5),
        suggestedMax: props.records.length === 0 ? 100 : 
          Math.max(...props.records.map(r => r.weight)) + 5,
        ticks: {
          callback: function(tickValue: any) {
            return `${tickValue}斤`;
          }
        }
      }
    },
    plugins: {
      legend: {
        position: 'top' as const
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.dataset.label || '';
            const value = context.raw;
            return `${label}: ${value}斤`;
          }
        }
      }
    }
  } as ChartOptions<'line'>;
});

// 图表容器高度
const chartHeight = ref(300);
</script>

<template>
  <div class="chart-container" :style="{ height: `${chartHeight}px` }">
    <Line 
      v-if="props.records.length > 0"
      :data="chartData" 
      :options="chartOptions"
    />
    <div v-else class="no-data">
      <p>暂无足够数据生成图表</p>
    </div>
  </div>
</template>

<style scoped>
.chart-container {
  width: 100%;
  margin: 20px 0;
  background-color: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.no-data {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  font-size: 16px;
}
</style> 