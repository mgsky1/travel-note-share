<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import AMapLoader from '@amap/amap-jsapi-loader'
import type { GuideMarker } from '../types'

const props = defineProps<{
  markers: GuideMarker[]
  selectedId: string | null
}>()

const emit = defineEmits<{
  (e: 'select', marker: GuideMarker): void
}>()

const containerRef = ref<HTMLDivElement>()
const loadError = ref('')

let map: any = null
let amap: any = null
let overlays: { id: string; marker: any }[] = []

/** 与 iOS MarkerBubble 同款的气泡 HTML：天数徽章 + 名称胶囊 + 三角针尖 */
function bubbleHTML(m: GuideMarker, selected: boolean) {
  const color = { attraction: '#3D8A5A', food: '#D89575', hotel: '#7A9A7E', other: '#7A9A7E' }[m.kind]
  const icon = { attraction: '🏛', food: '🍴', hotel: '🛏', other: '⭐' }[m.kind]
  const badge = `<div class="mk-day" style="color:${color}">第${m.day}天</div>`
  return `
    <div class="mk-wrap ${selected ? 'mk-selected' : ''}">
      ${badge}
      <div class="mk-bubble" style="background:${color}">
        <span class="mk-icon">${icon}</span><span class="mk-name">${m.name}</span>
      </div>
      <div class="mk-pin" style="border-top-color:${color}"></div>
    </div>`
}

function renderMarkers() {
  if (!map || !amap) return
  overlays.forEach((o) => map.remove(o.marker))
  overlays = props.markers.map((m) => {
    const marker = new amap.Marker({
      position: m.position,
      content: bubbleHTML(m, m.id === props.selectedId),
      anchor: 'bottom-center',
      offset: new amap.Pixel(0, -2),
      zIndex: m.id === props.selectedId ? 120 : 100,
    })
    marker.on('click', () => emit('select', m))
    map.add(marker)
    return { id: m.id, marker }
  })
  if (overlays.length > 1) {
    map.setFitView(undefined, false, [140, 60, 260, 60])
  } else if (overlays.length === 1) {
    map.setZoomAndCenter(14, props.markers[0].position)
  }
}

onMounted(async () => {
  const key = import.meta.env.VITE_AMAP_KEY
  const securityCode = import.meta.env.VITE_AMAP_SECURITY_CODE
  if (!key) {
    loadError.value = '缺少高德 Key：请在项目根目录新建 .env，填入 VITE_AMAP_KEY 与 VITE_AMAP_SECURITY_CODE 后重启 dev server'
    return
  }
  ;(window as any)._AMapSecurityConfig = { securityJsCode: securityCode ?? '' }
  try {
    amap = await AMapLoader.load({ key, version: '2.0' })
    map = new amap.Map(containerRef.value!, {
      viewMode: '2D',
      zoomEnable: true,
      rotateEnable: false,
      pitchEnable: false,
      showLabel: true,
      zoom: 12,
    })
    renderMarkers()
  } catch (err) {
    loadError.value = `高德地图加载失败：${String(err)}（请检查 Key 与安全密钥是否配对、域名白名单是否包含本机地址）`
  }
})

watch(
  () => props.selectedId,
  () => renderMarkers(),
)

onBeforeUnmount(() => {
  map?.destroy()
  map = null
})
</script>

<template>
  <div class="map-root">
    <div ref="containerRef" class="map-container"></div>
    <div v-if="loadError" class="map-error">
      <p>{{ loadError }}</p>
    </div>
  </div>
</template>

<style>
.map-root,
.map-container {
  position: absolute;
  inset: 0;
}
.map-error {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #d6e8d8;
  padding: 32px;
  text-align: center;
  color: #3d6b50;
  font-size: 14px;
  line-height: 1.8;
}

/* 标记气泡（对齐 iOS MarkerBubble） */
.mk-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.mk-selected {
  transform: scale(1.08);
}
.mk-day {
  background: #fff;
  border-radius: 999px;
  padding: 0 6px;
  height: 18px;
  line-height: 18px;
  font-size: 10px;
  font-weight: 700;
  white-space: nowrap;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.14);
}
.mk-bubble {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.18);
}
.mk-icon {
  font-size: 10px;
}
.mk-pin {
  width: 0;
  height: 0;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-top: 5px solid;
}
</style>
