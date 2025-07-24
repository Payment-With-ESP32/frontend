<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useImage } from 'vue-konva'
import axiosInstance from '@/utils/axios-instance'
import type { SlaveResponse, SlaveType } from '@/types/slave-type'
import NodePosition from '@/components/NodePosition.vue'
import { macRegex } from '@/utils/regexes'
import type { MasterMacResponse } from '@/types/master-mac'

const imageSrc = ref<string>('')
const [image] = useImage(imageSrc)

const [targetSrc] = useImage('/red-dot.png')

const floorPlaneImageConfig = ref({})
const floorImageSrcs = ref<string[]>([])

const slaves = ref<SlaveType[]>([])
const floor = ref<number>(1)
const width = 600
const height = ref<number>(0)
const popupPosition = ref<{ x: number; y: number; floor: number } | null>(null)

const selectedMacAddress = ref<string>('')
const toChangeFloor = ref<number>(1)
const toUpdateMacAddress = ref<string>('')
const appendTargetMacAddress = ref<string>('')
const masterMacAddress = ref<string>('')
const macPlaceHolder = computed(() => `현재 MAC: ${masterMacAddress.value}`)
const prelongTime = ref<number>(1)

const filteredSlaves = computed(() =>
  slaves.value.filter((slave) => slave.position.floor === floor.value),
)
const selectedMacURLEncoded = computed(() => encodeURIComponent(selectedMacAddress.value))

try {
  axiosInstance
    .get<SlaveResponse>('/esp32/slaves', {
      timeout: 1000,
    })
    .then((response) => response.data)
    .then((data) => {
      slaves.value = data.slaves.map((slave) => {
        return {
          ...slave,
          macAddress: slave.macAddress.toLowerCase(),
        }
      })
    })
} catch (err) {
  console.error('Error fetching slaves:', err)
  slaves.value = []
}

try {
  axiosInstance
    .get<MasterMacResponse>('/esp32/master', {
      timeout: 1000,
    })
    .then((response) => response.data)
    .then((data) => {
      masterMacAddress.value = data.macAddress.trim().toLowerCase()
    })
} catch (err) {
  console.error('Error fetching master MAC address:', err)
  masterMacAddress.value = ''
}

try {
  axiosInstance
    .get<string[]>('/esp32/images', {
      timeout: 2000,
    })
    .then((response) => response.data)
    .then((data) => {
      floorImageSrcs.value = [...floorImageSrcs.value, ...data]
      if (data.length > 0) imageSrc.value = `/${data[0]}`
    })
} catch (e) {
  console.error(e)
}

watch(image, (img) => {
  if (img) {
    height.value = img.naturalHeight * (width / img.naturalWidth)
    floorPlaneImageConfig.value = {
      image: img,
      x: 0,
      y: 0,
      height: height.value,
      width: width,
    }
  }
})

watch(toChangeFloor, (upcoming, old) => {
  if (upcoming === 0) {
    if (old < 0) toChangeFloor.value = 1
    else toChangeFloor.value = -1
  }
})

watch(popupPosition, (position) => {
  if (position) toChangeFloor.value = position.floor
})

watch(prelongTime, (upcoming) => {
  if (upcoming < 1) prelongTime.value = 1
})

const addNewNode = async () => {
  try {
    const macAddress = appendTargetMacAddress.value.trim().toLowerCase()
    if (!macRegex.test(macAddress)) {
      alert('정규식에 맞지 않습니다.')
      return
    }
    const slave = slaves.value.find((s) => s.macAddress.trim() === macAddress)
    if (!slave) {
      await axiosInstance.post('/esp32', {
        macAddress: appendTargetMacAddress.value,
        positionX: 100,
        positionY: 100,
        floor: floor.value,
      })
      slaves.value.push({
        macAddress: appendTargetMacAddress.value,
        position: { x: 100, y: 100, floor: floor.value },
      })
    } else {
      alert(`해당 MAC 주소는 이미 존재합니다: ${appendTargetMacAddress.value}`)
    }
  } catch (e) {
    console.error('Error adding new node:', e)
  } finally {
    appendTargetMacAddress.value = ''
  }
}

const changeNode = async () => {
  if (!selectedMacAddress.value) return
  const newMacAddress = toUpdateMacAddress.value.trim().toLowerCase()
  if (!macRegex.test(newMacAddress)) {
    alert('정규식에 맞지 않습니다.')
    return
  }
  const idx = slaves.value.findIndex((s) => s.macAddress === selectedMacAddress.value)
  if (idx !== -1) {
    slaves.value[idx].macAddress = newMacAddress
    await axiosInstance.put(`/esp32/${selectedMacURLEncoded.value}`, {
      toMac: newMacAddress,
    })
    selectedMacAddress.value = newMacAddress
    toUpdateMacAddress.value = ''
  }
}

const deleteNode = async () => {
  const idx = slaves.value.findIndex((s) => s.macAddress === selectedMacAddress.value)
  if (idx !== -1) {
    slaves.value.splice(idx, 1)
    await axiosInstance.delete(`/esp32/${selectedMacURLEncoded.value}`)
    selectedMacAddress.value = ''
    popupPosition.value = null
  }
}

const changeFloor = async () => {
  const idx = slaves.value.findIndex((s) => s.macAddress === selectedMacAddress.value)
  if (idx !== -1) {
    if (toChangeFloor.value === 0) toChangeFloor.value = 1
    slaves.value[idx].position.floor = toChangeFloor.value
    await axiosInstance.patch(`/esp32`, {
      positionX: slaves.value[idx].position.x,
      positionY: slaves.value[idx].position.y,
      floor: toChangeFloor.value,
      macAddress: selectedMacAddress.value,
    })
    selectedMacAddress.value = ''
    popupPosition.value = null
  }
}

const updateMasterMac = async () => {
  const toMac = toUpdateMacAddress.value.trim().toLowerCase()
  if (macRegex.test(toMac)) {
    alert('정규식에 맞지 않습니다.')
    return
  }

  axiosInstance.post('/esp32/master', {
    toMac,
  })
}

const submitTime = async (prelong: number = 0) => {
  await axiosInstance.post(`/esp32/${selectedMacAddress.value}`, {
    time: prelong,
  })
}

const selectedFile = ref<File | null>(null)
const onFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target) {
    const files = target.files
    if (files) selectedFile.value = files[0]
  }
}
const uploadImage = async () => {
  if (!selectedFile.value) return

  const formData = new FormData()
  formData.append('file', selectedFile.value)

  try {
    const filename = selectedFile.value.name
    if (!floorImageSrcs.value.includes(filename)) {
      await axiosInstance.post('/esp32/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      imageSrc.value = filename
      floorImageSrcs.value = [...floorImageSrcs.value, `${filename}`]
    }
  } catch (err) {
    console.error('업로드 실패: ', err)
  }
}

const deleteImage = async () => {
  if (imageSrc.value) {
    try {
      const targetFileName = imageSrc.value.startsWith('/')
        ? imageSrc.value.replace('/', '')
        : imageSrc.value
      const encodedFilename = encodeURIComponent(targetFileName)
      await axiosInstance.delete(`/esp32/image/${encodedFilename}`)

      const targetImageIndex = floorImageSrcs.value.findIndex((item) => item === targetFileName)
      floorImageSrcs.value.splice(targetImageIndex, 1)
      imageSrc.value =
        floorImageSrcs.value.length !== 0
          ? floorImageSrcs.value[Math.max(targetImageIndex - 1, 0)]
          : ''
    } catch (e) {
      console.error(e)
    }
  }
}
</script>
<template>
  <div z-index="1" class="konva-test">
    <div>
      <h2>master mac 수정</h2>
      <input type="text" v-model="toUpdateMacAddress" :placeholder="macPlaceHolder" />
      <button @click="updateMasterMac()">제출</button>
    </div>
    <v-stage
      :config="{ width, height }"
      id="konva-root-stage"
      @click="() => (popupPosition = null)"
    >
      <v-layer>
        <v-image v-if="image" :config="floorPlaneImageConfig"></v-image>
        <div v-if="targetSrc">
          <NodePosition
            v-for="(slave, idx) in filteredSlaves"
            :key="slave.macAddress"
            :index="idx"
            :info="slave"
            :imgSrc="targetSrc"
            :popupPosition="popupPosition"
            @update:nodePosition="
              (newPosition) => {
                const index = slaves.findIndex((s) => s.macAddress === newPosition.macAddress)
                if (index !== -1) {
                  delete newPosition.macAddress
                  slaves[index].position = { ...slaves[index].position, ...newPosition }
                }
              }
            "
            @update:popupPosition="(position) => (popupPosition = position)"
            @update:targetMacAddress="
              (macAddress) => {
                selectedMacAddress = macAddress
              }
            "
          />
        </div>
        "
      </v-layer>
    </v-stage>
    <div
      v-if:="popupPosition"
      style="
        position: absolute;
        z-index: 999;
        background-color: white;
        border: 1px solid black;
        padding: 10px;
        color: black;
      "
      :style="{ left: popupPosition.x + 10 + 'px', top: popupPosition.y + 10 + 'px' }"
    >
      <h3>MAC 주소: {{ selectedMacAddress }}</h3>
      <hr style="margin-top: 0.5em; margin-bottom: 0.5em" />
      <h3>MAC 주소 수정</h3>
      <input type="text" v-model="toUpdateMacAddress" placeholder="새 MAC 주소를 입력하세요" />
      <button @click="changeNode()">수정</button>
      <hr style="margin-top: 0.5em; margin-bottom: 0.5em" />
      <h3>층 변경</h3>
      <input type="number" v-model="toChangeFloor" placeholder="변경할 층을 입력하세요" />
      <button @click="changeFloor()">변경</button>
      <hr style="margin-top: 0.5em; margin-bottom: 0.5em" />
      <h3>노드 삭제</h3>
      <button @click="deleteNode()">삭제</button>
      <hr style="margin-top: 0.5em; margin-bottom: 0.5em" />
      <h3>노드 상태 변경 - 시간</h3>
      <input type="number" v-model="prelongTime" placeholder="연장할 시간을 적어주세요!" />
      <button @click="submitTime(prelongTime)">연장</button>
      <br />
      <button @click="submitTime(0)">상시 켜짐</button><button @click="submitTime(-1)">끄기</button>
    </div>
    <div>
      <div>
        <h2>노드 추가</h2>
        <input type="text" v-model="appendTargetMacAddress" />
        <button @click="addNewNode()">제출</button>
      </div>

      <div>
        <h2 style="display: inline-block">현재 층: {{ floor }}</h2>
        <button @click="() => (floor = floor + 1 == 0 ? 1 : floor + 1)">Up</button>
        <button @click="() => (floor = floor - 1 == 0 ? -1 : floor - 1)">Down</button>
        <button @click="floor = 1">Reset</button>
      </div>
    </div>

    <div>
      <h3>이미지 관리</h3>
      <p>업로드</p>
      <input type="file" @change="onFileChange" />
      <button @click="uploadImage">업로드</button>

      <p>도면 선택</p>
      <select
        @change="
          (e) => {
            const target = e.target as HTMLSelectElement
            if (target) imageSrc = `/${target.value}`
          }
        "
      >
        <option
          v-for="filename in floorImageSrcs"
          :key="filename"
          :selected="filename === imageSrc"
        >
          {{ filename }}
        </option>
      </select>
      <button @click="deleteImage">삭제</button>
    </div>
  </div>
</template>
