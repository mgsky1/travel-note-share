<script setup lang="ts">
import { ref } from 'vue'
import type { GuideMarker } from '../types'

const props = defineProps<{
  marker: GuideMarker
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'delete', marker: GuideMarker): void
}>()

/** 下拉关闭（对齐 iOS 端 dismissGesture：下拉 >120 或快甩 >220 关闭） */
const dragOffset = ref(0)
let startY: number | null = null

function onTouchStart(e: TouchEvent) {
  startY = e.touches[0].clientY
}
function onTouchMove(e: TouchEvent) {
  if (startY === null) return
  dragOffset.value = Math.max(0, e.touches[0].clientY - startY)
}
function onTouchEnd(e: TouchEvent) {
  if (startY === null) return
  const delta = e.changedTouches[0].clientY - startY
  startY = null
  if (delta > 120) {
    emit('close')
  }
  dragOffset.value = 0
}

/** 桌面端调试用：鼠标拖拽等价于 touch 拖拽 */
function onMouseDown(e: MouseEvent) {
  startY = e.clientY
  const move = (ev: MouseEvent) => {
    if (startY === null) return
    dragOffset.value = Math.max(0, ev.clientY - startY)
  }
  const up = (ev: MouseEvent) => {
    if (startY !== null && ev.clientY - startY > 120) emit('close')
    startY = null
    dragOffset.value = 0
    window.removeEventListener('mousemove', move)
    window.removeEventListener('mouseup', up)
  }
  window.addEventListener('mousemove', move)
  window.addEventListener('mouseup', up)
}

const kindText = () =>
  ({ attraction: '景点', food: '美食', hotel: '住宿', other: '其他' })[props.marker.kind]
</script>

<template>
  <div class="sheet-mask" @click.self="emit('close')">
    <div
      class="sheet"
      :style="{ transform: `translateY(${dragOffset}px)` }"
      @touchstart.passive="onTouchStart"
      @touchmove.passive="onTouchMove"
      @touchend="onTouchEnd"
      @mousedown="onMouseDown"
    >
      <div class="drag-handle"></div>

      <div class="sheet-scroll">
        <!-- 头部：类型图标 + 名称 + 标签 + 关闭 -->
        <div class="sheet-header">
          <div class="kind-icon" :class="marker.kind">
            <span v-if="marker.kind === 'food'">🍴</span>
            <span v-else-if="marker.kind === 'hotel'">🛏</span>
            <span v-else-if="marker.kind === 'other'">⭐</span>
            <span v-else>🏛</span>
          </div>
          <div class="header-main">
            <div class="name-row">
              <h2 class="name">{{ marker.name }}</h2>
              <button class="close-btn" aria-label="关闭" @click="emit('close')">✕</button>
            </div>
            <div class="tag-row">
              <span class="tag" :class="marker.kind">{{ kindText() }}</span>
              <span class="tag rating">★ {{ marker.rating }}</span>
              <span class="tag day">● 第 {{ marker.day }} 天</span>
            </div>
          </div>
        </div>

        <!-- 头图 -->
        <div class="cover">
          <img v-if="marker.image" :src="marker.image" :alt="marker.name" loading="lazy" />
        </div>

        <!-- 简介 -->
        <section class="desc-section">
          <h3 class="desc-caption">简介</h3>
          <p class="desc-body">{{ marker.desc }}</p>
        </section>
      </div>

      <!-- 底部操作：仅保留「删除标记」（按要求不含游玩天数/导航/完成标记） -->
      <div class="sheet-actions">
        <button class="delete-btn" @click="emit('delete', marker)">
          <span class="trash">🗑</span> 删除标记
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sheet-mask {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: flex-end;
  z-index: 20;
  animation: fade-in 0.2s ease;
}
.sheet {
  width: 100%;
  max-height: 82%;
  background: #fff;
  border-radius: 28px 28px 0 0;
  box-shadow: 0 -8px 24px rgba(0, 0, 0, 0.18);
  display: flex;
  flex-direction: column;
  animation: slide-up 0.28s cubic-bezier(0.32, 0.72, 0.35, 1);
}
@keyframes fade-in {
  from { opacity: 0; }
}
@keyframes slide-up {
  from { transform: translateY(100%); }
}
.drag-handle {
  width: 36px;
  height: 5px;
  border-radius: 3px;
  background: #d0cec8;
  margin: 10px auto 6px;
  flex-shrink: 0;
}
.sheet-scroll {
  overflow-y: auto;
  padding: 4px 20px 0;
}
.sheet-header {
  display: flex;
  gap: 12px;
  padding-top: 8px;
}
.kind-icon {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}
.kind-icon.attraction { background: #ddfaeb; }
.kind-icon.food { background: #fee9d1; }
.header-main {
  flex: 1;
  min-width: 0;
}
.name-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}
.name {
  flex: 1;
  margin: 2px 0 0;
  font-size: 18px;
  font-weight: 700;
  color: #1a1918;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.close-btn {
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 50%;
  background: #edecea;
  color: #6d6c6a;
  font-size: 13px;
  cursor: pointer;
  flex-shrink: 0;
}
.tag-row {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  align-items: center;
}
.tag {
  font-size: 12px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 999px;
}
.tag.attraction { background: #ddfaeb; color: #3d8a5a; }
.tag.food { background: #fee9d1; color: #e07a2f; }
.tag.hotel, .tag.other { background: #f0f4f0; color: #7a9a7e; }
.tag.rating { background: #f5f4f1; color: #1a1918; }
.tag.day { background: #fff3d6; color: #d99a1f; }
.cover {
  margin-top: 16px;
  border-radius: 16px;
  overflow: hidden;
  aspect-ratio: 16 / 10;
  background: linear-gradient(135deg, #d6e8d8, #b9d8c4);
}
.cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.desc-section {
  margin-top: 16px;
}
.desc-caption {
  margin: 0 0 8px;
  font-size: 13px;
  font-weight: 600;
  color: #9c9b99;
}
.desc-body {
  margin: 0;
  font-size: 15px;
  line-height: 1.7;
  color: #6d6c6a;
}
.sheet-actions {
  display: flex;
  gap: 12px;
  padding: 12px 20px calc(20px + env(safe-area-inset-bottom));
  flex-shrink: 0;
}
.delete-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 42px;
  padding: 0 16px;
  border: none;
  border-radius: 14px;
  background: #f7f6f2;
  color: #d08068;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
.trash {
  font-size: 13px;
}
</style>
