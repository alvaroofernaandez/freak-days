<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  size?: number
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 24,
})

const gradientId = computed(() => `logoGradient-${Math.random().toString(36).substr(2, 9)}`)
</script>

<template>
  <svg
    viewBox="0 0 72 56"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    :class="props.class"
    :style="props.class ? undefined : { width: `${props.size}px`, height: `${props.size}px` }"
  >
    <defs>
      <!-- Holographic gradient for F -->
      <linearGradient :id="`${gradientId}-f-main`" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color: oklch(0.75 0.25 320); stop-opacity: 1" />
        <stop offset="30%" style="stop-color: oklch(0.5 0.15 290); stop-opacity: 1" />
        <stop offset="70%" style="stop-color: oklch(0.4 0.1 280); stop-opacity: 1" />
        <stop offset="100%" style="stop-color: oklch(0.7 0.2 200); stop-opacity: 1" />
      </linearGradient>
      
      <!-- Holographic gradient for D -->
      <linearGradient :id="`${gradientId}-d-main`" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color: oklch(0.75 0.25 320); stop-opacity: 1" />
        <stop offset="30%" style="stop-color: oklch(0.5 0.15 290); stop-opacity: 1" />
        <stop offset="70%" style="stop-color: oklch(0.4 0.1 280); stop-opacity: 1" />
        <stop offset="100%" style="stop-color: oklch(0.7 0.2 200); stop-opacity: 1" />
      </linearGradient>
      
      <!-- Edge glow gradient -->
      <linearGradient :id="`${gradientId}-edge`" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color: oklch(0.8 0.3 320); stop-opacity: 1" />
        <stop offset="50%" style="stop-color: oklch(0.6 0.25 290); stop-opacity: 0.8" />
        <stop offset="100%" style="stop-color: oklch(0.75 0.25 200); stop-opacity: 1" />
      </linearGradient>
      
      <!-- Highlight gradient -->
      <linearGradient :id="`${gradientId}-highlight`" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style="stop-color: oklch(0.95 0.05 290); stop-opacity: 0.6" />
        <stop offset="50%" style="stop-color: oklch(0.95 0.05 290); stop-opacity: 0.2" />
        <stop offset="100%" style="stop-color: oklch(0.95 0.05 290); stop-opacity: 0" />
      </linearGradient>
      
      <!-- Glow filter -->
      <filter :id="`${gradientId}-glow`">
        <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
        <feOffset dx="0" dy="2" result="offsetblur"/>
        <feComponentTransfer>
          <feFuncA type="linear" slope="0.4"/>
        </feComponentTransfer>
        <feMerge>
          <feMergeNode/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
      
      <!-- Shadow filter -->
      <filter :id="`${gradientId}-shadow`">
        <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
        <feOffset dx="0" dy="1" result="offsetblur"/>
        <feComponentTransfer>
          <feFuncA type="linear" slope="0.2"/>
        </feComponentTransfer>
        <feMerge>
          <feMergeNode/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    
    <!-- F Letter -->
    <g>
      <!-- Base shape with shadow -->
      <g :filter="`url(#${gradientId}-shadow)`">
        <rect x="6" y="4" width="10" height="48" rx="3" :fill="`url(#${gradientId}-f-main)`" />
        <rect x="6" y="4" width="22" height="10" rx="3" :fill="`url(#${gradientId}-f-main)`" />
        <rect x="6" y="22" width="18" height="9" rx="2.5" :fill="`url(#${gradientId}-f-main)`" />
      </g>
      
      <!-- Edge glow -->
      <g :filter="`url(#${gradientId}-glow)`" opacity="0.8">
        <rect x="6" y="4" width="10" height="48" rx="3" :fill="`url(#${gradientId}-edge)`" />
        <rect x="6" y="4" width="22" height="10" rx="3" :fill="`url(#${gradientId}-edge)`" />
        <rect x="6" y="22" width="18" height="9" rx="2.5" :fill="`url(#${gradientId}-edge)`" />
      </g>
      
      <!-- Main fill -->
      <rect x="6" y="4" width="10" height="48" rx="3" :fill="`url(#${gradientId}-f-main)`" />
      <rect x="6" y="4" width="22" height="10" rx="3" :fill="`url(#${gradientId}-f-main)`" />
      <rect x="6" y="22" width="18" height="9" rx="2.5" :fill="`url(#${gradientId}-f-main)`" />
      
      <!-- Highlight -->
      <rect x="6" y="4" width="28" height="48" rx="3" :fill="`url(#${gradientId}-highlight)`" />
    </g>
    
    <!-- D Letter -->
    <g transform="translate(40, 0)">
      <!-- Base shape with shadow -->
      <g :filter="`url(#${gradientId}-shadow)`">
        <rect x="0" y="4" width="10" height="48" rx="3" :fill="`url(#${gradientId}-d-main)`" />
        <path
          d="M 10 4 L 26 4 Q 32 4, 32 10 L 32 46 Q 32 52, 26 52 L 10 52 Z"
          :fill="`url(#${gradientId}-d-main)`"
        />
      </g>
      
      <!-- Edge glow -->
      <g :filter="`url(#${gradientId}-glow)`" opacity="0.8">
        <rect x="0" y="4" width="10" height="48" rx="3" :fill="`url(#${gradientId}-edge)`" />
        <path
          d="M 10 4 L 26 4 Q 32 4, 32 10 L 32 46 Q 32 52, 26 52 L 10 52 Z"
          :fill="`url(#${gradientId}-edge)`"
        />
      </g>
      
      <!-- Main fill -->
      <rect x="0" y="4" width="10" height="48" rx="3" :fill="`url(#${gradientId}-d-main)`" />
      <path
        d="M 10 4 L 26 4 Q 32 4, 32 10 L 32 46 Q 32 52, 26 52 L 10 52 Z"
        :fill="`url(#${gradientId}-d-main)`"
      />
      
      <!-- Inner cutout -->
      <path
        d="M 14 10 L 24 10 Q 28 10, 28 14 L 28 42 Q 28 46, 24 46 L 14 46 Z"
        fill="oklch(0.12 0.02 270)"
      />
      
      <!-- Highlight -->
      <rect x="0" y="4" width="32" height="48" rx="3" :fill="`url(#${gradientId}-highlight)`" />
    </g>
  </svg>
</template>

