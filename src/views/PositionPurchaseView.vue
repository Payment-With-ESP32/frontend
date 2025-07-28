<script setup lang="ts">
import { axiosInstance, baseURL } from '@/utils/axios-instance'
import { macRegex } from '@/utils/regexes'
import PortOne from '@portone/browser-sdk/v2'
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const concentMac = ((route.query.mac as string) || '').trim()
if (!macRegex.test(concentMac)) router.back()

const maxHour = 10

const isMobile = computed(() => /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent))

const requestPayment = async (hour: number) => {
  if (!Number.isInteger(hour)) alert('정수를 입력하세요')
  hour = Math.trunc(hour)
  if (hour <= 0 || maxHour < hour) alert('1~3 사이의 정수를 입력하세요.')
  const paymentId = `payment-${Date.now()}`
  const totalAmount = 1000 * hour
  const pcPaymentBody = {
    storeId: 'store-cf673971-65af-4b41-9fcf-fd211dbef9e5',
    channelKey: 'channel-key-b3ba68da-5cbb-4150-bca0-5a2699afa612',
    paymentId,
    orderName: `콘센트 해제 ${hour}시간`,
    totalAmount,
    currency: 'KRW',
    payMethod: 'CARD',
  }
  const mobilePaymentBody = {
    ...pcPaymentBody,
    redirectUrl: `${baseURL}/payment-success`,
  }

  await axiosInstance.post('/payment/prepare', {
    paymentId,
    amount: totalAmount,
    macAddr: concentMac,
  })
  const response = await PortOne.requestPayment(
    // @ts-expect-error 값만으로 한 경우 적용 불가. 따라서 예측 가능한 error
    isMobile.value ? mobilePaymentBody : pcPaymentBody,
  )
  if (response!.code !== undefined) {
    return alert(response!.message)
  }

  const queries = Object.entries(response!)
    .map(([key, val]) => `${key}=${val}`)
    .join('&')

  router.push(`/payment-success?${queries}`)
}
</script>

<template>
  <div v-if="concentMac">
    <div>
      <button
        v-for="hour in Array.from({ length: maxHour }, (_, i) => i + 1)"
        :key="hour"
        @click="requestPayment(hour)"
      >
        {{ hour }}시간
      </button>
    </div>
  </div>
</template>
