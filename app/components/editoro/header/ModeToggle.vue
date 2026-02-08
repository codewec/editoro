<script setup lang="ts">
const props = defineProps<{
  label: string
  icon: string
  tooltip: string
}>()

const emit = defineEmits<{
  toggle: []
}>()
</script>

<template>
  <UTooltip :text="props.tooltip">
    <UButton
      size="xs"
      color="neutral"
      variant="soft"
      :icon="props.icon"
      @click="emit('toggle')"
    >
      {{ props.label }}
    </UButton>
  </UTooltip>
</template>
