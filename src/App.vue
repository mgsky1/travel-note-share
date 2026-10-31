<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import MapView from './components/MapView.vue'
import DetailSheet from './components/DetailSheet.vue'
import { darkCodeFromLocation, fetchGuideByDarkCode } from './api'
import type { GuideMarker } from './types'

type LoadState = 'loading' | 'ready' | 'error'

const state = ref<LoadState>('loading')
const errorMessage = ref('')
const guideTitle = ref('旅行攻略')
const markers = ref<GuideMarker[]>([])
const selectedId = ref<string | null>(null)

const selectedMarker = computed(
  () => markers.value.find((m) => m.id === selectedId.value) ?? null,
)

onMounted(async () => {
  const darkCode = darkCodeFromLocation()
  if (!darkCode) {
    state.value = 'error'
    errorMessage.value = '链接中缺少分享暗码（darkCode）'
    return
  }
  try {
    const guide = await fetchGuideByDarkCode(darkCode)
    guideTitle.value = guide.subTitle
      ? `${guide.title} · ${guide.subTitle}`
      : guide.title
    markers.value = guide.markers
    state.value = 'ready'
  } catch (err) {
    state.value = 'error'
    errorMessage.value = err instanceof Error ? err.message : '加载失败，请稍后重试'
  }
})

function onSelect(m: GuideMarker) {
  selectedId.value = m.id
}
function onDelete(m: GuideMarker) {
  markers.value = markers.value.filter((x) => x.id !== m.id)
  selectedId.value = null
}
</script>

<template>
  <div class="page">
    <!-- 全屏高德地图 -->
    <MapView :markers="markers" :selected-id="selectedId" @select="onSelect" />

    <!-- 左上角标题（无右上角添加按钮） -->
    <header v-if="state === 'ready'" class="page-title">{{ guideTitle }}</header>

    <!-- 底部「已识别」胶囊（无 开始/攻略/我的 TabBar） -->
    <div v-if="state === 'ready' && !selectedMarker" class="recognized-pill">
      <span class="recognized-label">已识别</span>
      <span class="recognized-count">{{ markers.length }}</span>
    </div>

    <!-- 加载中 -->
    <div v-if="state === 'loading'" class="state-overlay">
      <div class="spinner"></div>
      <p>攻略加载中…</p>
    </div>

    <!-- 加载失败 -->
    <div v-else-if="state === 'error'" class="state-overlay">
      <p class="error-title">😕 攻略加载失败</p>
      <p class="error-detail">{{ errorMessage }}</p>
      <button class="retry-btn" @click="locationReload">重新加载</button>
    </div>

    <!-- 标记详情底部弹层 -->
    <DetailSheet
      v-if="selectedMarker"
      :marker="selectedMarker"
      @close="selectedId = null"
      @delete="onDelete"
    />
  </div>
</template>

<script lang="ts">
export default {
  methods: {
    locationReload() {
      window.location.reload()
    },
  },
}
</script>

<style>
* {
  box-sizing: border-box;
  -webkit-tap-highlight-color: transparent;
}
html,
body,
#app {
  margin: 0;
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Helvetica Neue',
    'Microsoft YaHei', sans-serif;
}
.page {
  position: fixed;
  inset: 0;
  overflow: hidden;
  background: #d6e8d8;
}
/* 桌面端：收窄为手机宽度居中展示，避免内容被拉宽 */
@media (min-width: 540px) {
  .page {
    left: 50%;
    right: auto;
    width: 420px;
    transform: translateX(-50%);
    box-shadow: 0 0 40px rgba(0, 0, 0, 0.25);
  }
  body {
    background: #c4cfc6;
  }
}
.page-title {
  position: absolute;
  top: calc(16px + env(safe-area-inset-top));
  left: 20px;
  right: 20px;
  z-index: 10;
  font-size: 22px;
  font-weight: 800;
  color: #fff;
  text-shadow: 0 1px 6px rgba(0, 0, 0, 0.35);
  pointer-events: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.recognized-pill {
  position: absolute;
  left: 24px;
  right: 24px;
  bottom: calc(28px + env(safe-area-inset-bottom));
  z-index: 10;
  height: 72px;
  border-radius: 36px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(16px);
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 0 28px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}
.recognized-label {
  font-size: 22px;
  font-weight: 800;
  color: #1a1918;
}
.recognized-count {
  min-width: 28px;
  height: 28px;
  border-radius: 14px;
  background: #3d8a5a;
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 8px;
}
.state-overlay {
  position: absolute;
  inset: 0;
  z-index: 30;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: #e8ede9;
  color: #3d6b50;
  font-size: 15px;
  padding: 32px;
  text-align: center;
}
.spinner {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 3px solid #c8f0d8;
  border-top-color: #3d8a5a;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
.error-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #1a2e1d;
}
.error-detail {
  margin: 0;
  color: #6d6c6a;
  line-height: 1.6;
}
.retry-btn {
  margin-top: 8px;
  height: 42px;
  padding: 0 24px;
  border: none;
  border-radius: 14px;
  background: #3d8a5a;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
</style>
