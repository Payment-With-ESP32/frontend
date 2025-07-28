import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/manage',
      name: 'node-manage',
      component: () => import('@/views/NodeManageView.vue'),
    },
    {
      path: '/payment',
      name: 'payment',
      component: () => import('@/views/PositionPurchaseView.vue'),
    },
    {
      path: '/payment-success',
      name: 'payment-success',
      component: () => import('@/views/PaymentSuccessView.vue'),
    },
    {
      path: '/generate-qr',
      name: 'generate-qr',
      component: () => import('@/views/QRGenerationView.vue'),
    },
  ],
})

export default router
