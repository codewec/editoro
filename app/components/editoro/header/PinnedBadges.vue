<script setup lang="ts">
import { nextTick } from 'vue'
import type { EditorPinnedBadge } from '~/types/editoro'

const { t } = useI18n()

const props = defineProps<{
  badges: EditorPinnedBadge[]
}>()

const emit = defineEmits<{
  select: [path: string]
  togglePin: [path: string]
}>()

const badgesScrollerRef = ref<HTMLElement | null>(null)
const hasHorizontalScroll = ref(false)
const canScrollLeft = ref(false)
const canScrollRight = ref(false)
let resizeObserver: ResizeObserver | null = null

function updateScrollState() {
  const target = badgesScrollerRef.value
  if (!target) {
    hasHorizontalScroll.value = false
    canScrollLeft.value = false
    canScrollRight.value = false
    return
  }

  hasHorizontalScroll.value = target.scrollWidth > target.clientWidth + 1
  if (!hasHorizontalScroll.value) {
    canScrollLeft.value = false
    canScrollRight.value = false
    return
  }

  canScrollLeft.value = target.scrollLeft > 0
  canScrollRight.value = target.scrollLeft + target.clientWidth < target.scrollWidth - 1
}

function scrollBadges(direction: 'left' | 'right') {
  const target = badgesScrollerRef.value
  if (!target) {
    return
  }

  const delta = direction === 'left' ? -220 : 220
  target.scrollBy({ left: delta, behavior: 'smooth' })
}

function onBadgesWheel(event: WheelEvent) {
  const target = badgesScrollerRef.value
  if (!target || target.scrollWidth <= target.clientWidth) {
    return
  }

  const horizontalDelta = Math.abs(event.deltaY) >= Math.abs(event.deltaX)
    ? event.deltaY
    : event.deltaX

  if (horizontalDelta === 0) {
    return
  }

  event.preventDefault()
  target.scrollLeft += horizontalDelta
  updateScrollState()
}

onMounted(() => {
  const target = badgesScrollerRef.value
  if (!target) {
    return
  }

  target.addEventListener('scroll', updateScrollState, { passive: true })

  resizeObserver = new ResizeObserver(() => {
    updateScrollState()
  })
  resizeObserver.observe(target)

  updateScrollState()
})

onBeforeUnmount(() => {
  const target = badgesScrollerRef.value
  if (target) {
    target.removeEventListener('scroll', updateScrollState)
  }

  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
})

watch(() => props.badges, async () => {
  await nextTick()
  updateScrollState()

  const target = badgesScrollerRef.value
  if (!target) {
    return
  }

  target.scrollLeft = target.scrollWidth
}, { deep: true })
</script>

<template>
  <div class="editoro-main-heading">
    <UButton
      v-if="hasHorizontalScroll"
      size="xs"
      color="neutral"
      variant="ghost"
      icon="i-lucide-chevron-left"
      :disabled="!canScrollLeft"
      :aria-label="t('main.scrollLeft')"
      @click="scrollBadges('left')"
    />

    <div
      ref="badgesScrollerRef"
      class="editoro-badges-scroller"
      @wheel="onBadgesWheel"
    >
      <UBadge
        v-for="badge in props.badges"
        :key="badge.key"
        color="neutral"
        variant="outline"
        class="editoro-file-badge"
        :class="{ 'editoro-file-badge-current': badge.isCurrent }"
      >
        <button
          type="button"
          class="editoro-file-badge-label"
          :title="badge.path || badge.label"
          @click="badge.path && emit('select', badge.path)"
        >
          {{ badge.label }}
        </button>

        <UTooltip
          v-if="badge.canPin"
          :text="badge.isPinned ? t('main.unpin') : t('main.pin')"
        >
          <button
            type="button"
            class="editoro-file-badge-pin"
            :aria-label="badge.isPinned ? t('main.unpin') : t('main.pin')"
            @click.stop="emit('togglePin', badge.path)"
          >
            <UIcon
              :name="badge.isPinned ? 'i-lucide-pin-off' : 'i-lucide-pin'"
              class="editoro-file-badge-pin-icon"
            />
          </button>
        </UTooltip>
      </UBadge>
    </div>

    <UButton
      v-if="hasHorizontalScroll"
      size="xs"
      color="neutral"
      variant="ghost"
      icon="i-lucide-chevron-right"
      :disabled="!canScrollRight"
      :aria-label="t('main.scrollRight')"
      @click="scrollBadges('right')"
    />
  </div>
</template>

<style scoped>
.editoro-main-heading {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.editoro-badges-scroller {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  min-width: 0;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.editoro-badges-scroller::-webkit-scrollbar {
  display: none;
}

.editoro-file-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.125rem;
  min-width: 0;
  flex-shrink: 0;
}

.editoro-file-badge-current {
  background: color-mix(in oklab, var(--ui-primary) 12%, transparent);
}

.editoro-file-badge-label {
  appearance: none;
  border: 0;
  background: transparent;
  color: inherit;
  min-width: 0;
  max-width: 240px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.8125rem;
  line-height: 1.2;
}

.editoro-file-badge-pin {
  appearance: none;
  border: 0;
  background: transparent;
  color: inherit;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.125rem;
  border-radius: 0.25rem;
  cursor: pointer;
}

.editoro-file-badge-pin-icon {
  width: 0.75rem;
  height: 0.75rem;
}
</style>
