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
  const minWeight = Math.min(...weights)
  const maxWeight = Math.max(...weights)
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
        const weightData = params[0]
        let result = `${weightData.name}<br/>${weightData.seriesName}: ${weightData.value} 斤`
        
        if (params.length > 1) {
          const idealData = params[1]
          result += `<br/>${idealData.seriesName}: ${idealData.value} 斤`
        }
        
        // 添加备注信息（如果有）
        const recordIndex = weightData.dataIndex
        const record = sortedRecords[recordIndex]
        if (record && record.note) {
          result += `<br/><span style="color: #9ca3af; font-size: 12px;">备注: ${record.note}</span>`
        }
        
        return result
      }
    },
    legend: {
      data: ['实际体重', '理想体重'],
      top: 30
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
    const seriesArray = option.series as any[];
    seriesArray.push({
      name: '理想体重',
      type: 'line',
      data: Array(dates.length).fill(props.idealWeight),
      symbol: 'none',
      lineStyle: {
        width: 2,
        type: 'dashed',
        color: '#10b981'
      },
      itemStyle: {
        color: '#10b981'
      }
    });
  }
  
  return option
})

// 响应式调整图表大小
let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  if (chartRef.value) {
    resizeObserver = new ResizeObserver(() => {
      nextTick(() => {
        if (chartRef.value) {
          const chart = (chartRef.value as any).__vueParentComponent.exposed?.getChart()
          chart?.resize()
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
  if (newVal !== oldVal && chartRef.value) {
    nextTick(() => {
      if (chartRef.value) {
        const chart = (chartRef.value as any).__vueParentComponent.exposed?.getChart()
        chart?.setOption(chartOption.value)
      }
    })
  }
}, { deep: true })
</script>

<template>
  <div class="weight-echart-container">
    <div v-if="isReady" class="chart-wrapper" ref="chartRef">
      <v-chart :option="chartOption" :autoresize="true" style="width: 100%; height: 100%; min-height: 350px;" />
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