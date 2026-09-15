<!-- src/components/organisms/TrendChart.vue -->
<!-- Generic bar-chart card. Chart options copied VERBATIM from MonthlySale.vue / BarChartOne.vue. -->
<!-- Receives data via props only — no data fetching here. -->
<script setup lang="ts">
import { computed } from 'vue'
import VueApexCharts from 'vue3-apexcharts'

const props = withDefaults(
  defineProps<{
    title: string
    subtitle?: string
    seriesName?: string
    categories: string[]
    values: number[]
  }>(),
  { subtitle: '', seriesName: 'Total' },
)

const series = computed(() => [{ name: props.seriesName, data: props.values }])

const chartOptions = computed(() => ({
  colors: ['#465fff'],
  chart: {
    fontFamily: 'Outfit, sans-serif',
    type: 'bar',
    toolbar: { show: false },
  },
  plotOptions: {
    bar: {
      horizontal: false,
      columnWidth: '39%',
      borderRadius: 5,
      borderRadiusApplication: 'end',
    },
  },
  dataLabels: { enabled: false },
  stroke: { show: true, width: 4, colors: ['transparent'] },
  xaxis: {
    categories: props.categories,
    axisBorder: { show: false },
    axisTicks: { show: false },
  },
  legend: {
    show: true,
    position: 'top',
    horizontalAlign: 'left',
    fontFamily: 'Outfit',
    markers: { radius: 99 },
  },
  yaxis: { title: false },
  grid: { yaxis: { lines: { show: true } } },
  fill: { opacity: 1 },
  tooltip: {
    x: { show: false },
    y: {
      formatter: (val: number) => val.toString(),
    },
  },
}))
</script>

<template>
  <div
    class="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6"
  >
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">{{ title }}</h3>
        <p v-if="subtitle" class="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
          {{ subtitle }}
        </p>
      </div>
    </div>

    <div class="max-w-full overflow-x-auto custom-scrollbar">
      <div class="-ml-5 min-w-[650px] pl-2 xl:min-w-full">
        <VueApexCharts type="bar" height="180" :options="chartOptions" :series="series" />
      </div>
    </div>
  </div>
</template>
