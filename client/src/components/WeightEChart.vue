<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DataZoomComponent,
  MarkLineComponent
} from 'echarts/components'
import VChart from 'vue-echarts'
import type { EChartsOption } from 'echarts'

// 注册必要的组件
use([
  CanvasRenderer,
  LineChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DataZoomComponent,
  MarkLineComponent
])

// 定义props
interface WeightRecord {
  date: string
  weight: number
  note?: string
}

const props = defineProps<{
  records: WeightRecord[]
  idealWeight?: number | null
}>()

// 图表容器引用
const chartRef = ref<HTMLElement | null>(null)
const chartInstance = ref<any>(null)
// 图表高度，用于内部计算，实际被VChart自动调整
// 不需要显式设置高度，由容器控制
// const chartHeight = ref(350)

// 图表是否准备好
const isReady = computed(() => props.records && props.records.length >= 2)

// 处理图表数据
const chartOption = computed<EChartsOption>(() => {
  if (!isReady.value) {
    return {}
  }

  // 按日期升序排序记录，取最近30条（如果超过30条）
  const sortedRecords = [...props.records]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-30)

  // 提取日期和体重数据
  const dates = sortedRecords.map(record => {
    const date = new Date(record.date)
    return `${date.getMonth() + 1}月${date.getDate()}日`
  })
  
  const weights = sortedRecords.map(record => record.weight)
  
  // 计算Y轴范围
  let minWeight = Math.min(...weights)
  let maxWeight = Math.max(...weights)
  
  // 如果有理想体重，将其纳入Y轴范围计算
  if (props.idealWeight) {
    const idealWeightValue = typeof props.idealWeight === 'string' 
      ? parseFloat(props.idealWeight) 
      : props.idealWeight;
    
    // 确保理想体重值在Y轴范围内
    if (!isNaN(idealWeightValue) && idealWeightValue !== null) {
      minWeight = Math.min(minWeight, idealWeightValue);
      maxWeight = Math.max(maxWeight, idealWeightValue);
      console.log('调整后的Y轴范围:', minWeight, '-', maxWeight, '理想体重:', idealWeightValue);
    }
  }
  
  const yAxisMin = Math.max(0, minWeight - 5)
  const yAxisMax = maxWeight + 5
  
  // 生成图表配置
  const option: EChartsOption = {
    title: {
      text: '体重变化趋势',
      left: 'center',
      textStyle: {
        fontSize: 16,
        fontWeight: 'normal',
        color: '#4b5563'
      }
    },
    tooltip: {
      trigger: 'axis',
      formatter: function(params: any) {
        const weightData = params.find((p: any) => p.seriesName === '实际体重');
        if (!weightData) return '';
        
        let result = `${weightData.name}<br/>${weightData.seriesName}: ${weightData.value} 斤`;
        
        const idealData = params.find((p: any) => p.seriesName === '理想体重');
        if (idealData) {
          result += `<br/>${idealData.seriesName}: ${idealData.value} 斤`;
        }
        
        // 添加备注信息（如果有）
        const recordIndex = weightData.dataIndex;
        const record = sortedRecords[recordIndex];
        if (record && record.note) {
          result += `<br/><span style="color: #9ca3af; font-size: 12px;">备注: ${record.note}</span>`;
        }
        
        return result;
      }
    },
    legend: {
      data: props.idealWeight ? ['实际体重', '理想体重'] : ['实际体重'],
      top: 30,
      selectedMode: true, // 允许用户点击图例切换显示
      textStyle: {
        color: '#4b5563'
      },
      // 过滤图例，只显示特定项
      formatter: function(name) {
        // 不显示"目标区域"图例
        if (name === '目标区域') return '';
        return name;
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: dates,
      axisLine: {
        lineStyle: {
          color: '#e5e7eb'
        }
      },
      axisLabel: {
        color: '#6b7280',
        fontSize: 12
      }
    },
    yAxis: {
      type: 'value',
      name: '单位：斤',
      nameTextStyle: {
        color: '#6b7280',
        padding: [0, 0, 5, 0]
      },
      min: yAxisMin,
      max: yAxisMax,
      axisLine: {
        show: true,
        lineStyle: {
          color: '#e5e7eb'
        }
      },
      axisLabel: {
        color: '#6b7280',
        fontSize: 12,
        formatter: '{value} 斤'
      },
      splitLine: {
        lineStyle: {
          color: '#f3f4f6'
        }
      }
    },
    dataZoom: [
      {
        type: 'inside',
        start: 0,
        end: 100
      },
      {
        type: 'slider',
        start: 0,
        end: 100,
        height: 20,
        bottom: 0,
        borderColor: '#e5e7eb',
        fillerColor: 'rgba(99, 102, 241, 0.1)',
        handleStyle: {
          color: '#6366f1'
        },
        textStyle: {
          color: '#6b7280'
        }
      }
    ],
    series: [
      {
        name: '实际体重',
        type: 'line',
        data: weights,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        itemStyle: {
          color: '#6366f1'
        },
        lineStyle: {
          width: 3,
          color: '#6366f1'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              {
                offset: 0,
                color: 'rgba(99, 102, 241, 0.3)'
              },
              {
                offset: 1,
                color: 'rgba(99, 102, 241, 0.05)'
              }
            ]
          }
        }
      }
    ]
  }
  
  // 如果有理想体重，添加理想体重线
  if (props.idealWeight) {
    console.log('添加理想体重线:', props.idealWeight, '类型:', typeof props.idealWeight); // 调试信息
    const idealWeightValue = typeof props.idealWeight === 'string' ? parseFloat(props.idealWeight) : props.idealWeight;
    
    // 确保理想体重不为NaN或undefined
    if (!isNaN(idealWeightValue) && idealWeightValue !== null) {
      const seriesArray = option.series as any[];
      
      // 添加视觉引导区域背景
      // 获取当前体重和理想体重的关系
      const latestWeight = weights[weights.length - 1];
      
      // 添加视觉引导区域
      if (latestWeight > idealWeightValue) {
        // 需要减重：理想体重以下是绿色区域
        seriesArray.unshift({
          name: '目标区域',
          type: 'line',
          data: Array(dates.length).fill(idealWeightValue),
          areaStyle: {
            color: 'rgba(16, 185, 129, 0.1)',
            origin: 'start'
          },
          lineStyle: {
            opacity: 0
          },
          stack: 'background',
          symbol: 'none',
          z: 0,
          showSymbol: false,
          silent: true,
          tooltip: {
            show: false
          }
        });
      } else {
        // 需要增重：理想体重以上是绿色区域
        seriesArray.unshift({
          name: '目标区域',
          type: 'line',
          data: Array(dates.length).fill(idealWeightValue),
          areaStyle: {
            color: 'rgba(16, 185, 129, 0.1)',
            origin: 'end'
          },
          lineStyle: {
            opacity: 0
          },
          stack: 'background',
          symbol: 'none',
          z: 0,
          showSymbol: false,
          silent: true,
          tooltip: {
            show: false
          }
        });
      }
      
      // 修改主体重线，添加标记线
      seriesArray[1].markLine = {
        silent: true,
        lineStyle: {
          color: '#16a34a',
          type: 'dashed',
          width: 2
        },
        symbol: ['none', 'none'],
        label: {
          show: true,
          formatter: `理想体重: ${idealWeightValue}斤`,
          position: 'middle',
          fontSize: 12,
          color: '#16a34a',
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          padding: [4, 8]
        },
        data: [
          {
            yAxis: idealWeightValue,
            name: '理想体重'
          }
        ]
      };
      
      // 添加理想体重线
      seriesArray.push({
        name: '理想体重',
        type: 'line',
        data: Array(dates.length).fill(idealWeightValue),
        symbol: 'circle',
        symbolSize: 4,
        lineStyle: {
          width: 3,
          type: 'dashed',
          color: '#16a34a',
          opacity: 0.8
        },
        itemStyle: {
          color: '#16a34a',
          borderWidth: 2,
          borderColor: '#fff'
        },
        // 明确设置为可见并提高z轴位置
        emphasis: {
          focus: 'series',
          itemStyle: {
            color: '#16a34a',
            borderWidth: 3,
            borderColor: '#fff'
          }
        },
        z: 2, // 提高z轴位置，确保不被主线遮挡
        connectNulls: true,
        smooth: false // 不平滑，保持直线
      });
      
      // 打印最终的图表配置以验证
      console.log('图表配置:', JSON.stringify(option.series));
    } else {
      console.warn('理想体重值不合法:', idealWeightValue);
    }
  }
  
  return option
})

// 响应式调整图表大小
let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  if (chartRef.value) {
    resizeObserver = new ResizeObserver(() => {
      nextTick(() => {
        // 使用存储的图表实例
        if (chartInstance.value) {
          chartInstance.value.resize();
        }
      })
    })
    
    resizeObserver.observe(chartRef.value)
  }
})

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
  }
})

// 监听数据变化，更新图表
watch(() => props.records, (newVal, oldVal) => {
  if (newVal !== oldVal) {
    nextTick(() => {
      // 使用存储的图表实例
      if (chartInstance.value) {
        chartInstance.value.setOption(chartOption.value);
      }
    })
  }
}, { deep: true })
</script>

<template>
  <div class="weight-echart-container">
    <div v-if="isReady" class="chart-wrapper" ref="chartRef">
      <v-chart 
        ref="chartInstance"
        :option="chartOption" 
        :autoresize="true" 
        style="width: 100%; height: 100%; min-height: 350px;" 
      />
    </div>
    <div v-else class="no-data">
      <div class="no-data-content">
        <span class="material-icons-round">insights</span>
        <p>需要至少两条记录才能生成图表</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.weight-echart-container {
  width: 100%;
  height: 100%;
  min-height: 350px;
  border-radius: 8px;
  overflow: hidden;
  background-color: white;
}

.chart-wrapper {
  width: 100%;
  height: 100%;
  min-height: 350px;
  border-radius: 8px;
}

.no-data {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 350px;
  width: 100%;
  background-color: #f9fafb;
  border-radius: 8px;
  border: 1px dashed #e5e7eb;
}

.no-data-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
}

.no-data-content span {
  font-size: 48px;
  margin-bottom: 16px;
}

.no-data-content p {
  font-size: 14px;
}
</style> 