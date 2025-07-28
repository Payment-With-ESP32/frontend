<script setup lang="ts">
import { useRouter } from 'vue-router'
import { axiosInstance } from '@/utils/axios-instance'
import { onMounted } from 'vue'
import type { PaymentSuccess } from '@/types/payment-success'
import { macRegex } from '@/utils/regexes'

const router = useRouter()

onMounted(async () => {
  const queries = new URLSearchParams(location.search)
  const paymentId = queries.get('paymentId')
  if (paymentId) {
    try {
      const { data } = await axiosInstance.post<PaymentSuccess>(
        '/payment/complete',
        { paymentId },
        { timeout: 5000 },
      )
      if (!macRegex.test(data.macAddress)) {
        throw Error('mac regex is not found')
      }
      if (data.amount.total === 0) throw Error('amount is lower than 0')

      await axiosInstance.post(`/esp32/${encodeURIComponent(data.macAddress)}`, {
        time: data.amount.total / 1000,
      })
    } catch (e) {
      console.error(e)
    }
  }
  router.push('/')
})
</script>

<template>
  <div></div>
</template>
