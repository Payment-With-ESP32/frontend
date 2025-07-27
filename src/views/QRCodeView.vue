<script setup lang="ts">
import { useQRCode } from '@vueuse/integrations/useQRCode'
import { shallowRef } from 'vue'

const text = shallowRef('')
const qrcode = useQRCode(text)
</script>

<template>
  <input v-model="text" type="text" />
  <img :src="qrcode" alt="QR Code" />
</template>
