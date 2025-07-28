import axios from 'axios'

const { protocol, hostname, port } = window.location
const baseURL = `${protocol}//${hostname}:${port || '80'}`

const axiosInstance = axios.create({
  baseURL: `${baseURL}/api`,
  timeout: 1000,
})

export default axiosInstance
