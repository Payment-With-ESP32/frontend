import { axiosInstance } from '@/utils/axios-instance'
import { useRouter } from 'vue-router'

export const usePageLogin = async () => {
  const router = useRouter()
  const password = prompt('비밀번호를 입력해주세요')?.trim()

  if (!password) {
    await router.replace('/')
    return false
  }

  try {
    await axiosInstance.post('/admin/login', { password })
    return true
  } catch (e) {
    console.error(e)
    alert('비밀번호가 다릅니다.')
    await router.replace('/')
    return false
  }
}
