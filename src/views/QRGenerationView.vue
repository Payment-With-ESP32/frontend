<script setup lang="ts">
import { usePageLogin } from '@/hooks/use-page-login'
import type { SlaveResponse } from '@/types/slave-type'
import { axiosInstance } from '@/utils/axios-instance'
import { useQRCode } from '@vueuse/integrations/useQRCode'
import { onMounted, ref, watch, type ShallowRef } from 'vue'

interface MacType {
  qr: ShallowRef<string>
  mac: string
}

const slaveMacs = ref<string[]>([])
const qrs = ref<MacType[]>([])

const baseURL = ref<string>('http://192.168.0.7:8080')

watch([slaveMacs, baseURL], () => {
  qrs.value = slaveMacs.value.map((mac) => ({
    qr: useQRCode(`${baseURL.value}/payment?mac=${mac}`),
    mac,
  }))
})

onMounted(async () => {
  await usePageLogin()

  const { data } = await axiosInstance.get<SlaveResponse>('/esp32/slaves')
  slaveMacs.value = data.slaves.map((it) => (it.macAddress = it.macAddress.trim().toLowerCase()))
})
</script>

<template>
  <div>
    <h2>QR 서버 주소 변경</h2>
    <input type="text" v-model="baseURL" />
    <div v-for="qr in qrs" :key="qr.mac">
      <p>{{ qr.mac }}</p>
      <img :src="qr.qr" />
    </div>
  </div>
</template>
