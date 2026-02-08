<script setup lang="ts">
const { t } = useI18n()
const localeHead = useLocaleHead()

useHead({
  meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
  link: [{ rel: 'icon', href: '/favicon.ico' }],
  htmlAttrs: {
    lang: localeHead.value.htmlAttrs?.lang || 'en'
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
