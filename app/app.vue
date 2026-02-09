<script setup lang="ts">
const { t, locale } = useI18n()

useHead({
  meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
  link: [{ rel: 'icon', href: '/favicon.ico' }],
  htmlAttrs: {
    lang: locale.value
  }
})

useSeoMeta({
  title: t('app.title'),
  description: t('app.description')
})
</script>

<template>
  <UApp>
    <NuxtPage />
  </UApp>
</template>
