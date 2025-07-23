<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useImage } from 'vue-konva'
import axios from 'axios'
import type { SlaveResponse, SlaveType } from '@/types/slave-type'
import NodePosition from '@/components/NodePosition.vue'
import { macRegex } from '@/utils/regexes'

const [floorPlanSrc] = useImage('/287682_100321_441.png')
const [targetSrc] = useImage('/red-dot.png')

const floorPlanImage = ref({})

const slaves = ref<SlaveType[]>([])
const floor = ref<number>(-1)
const width = 600
const height = ref<number>(0)
const popupPosition = ref<{ x: number; y: number } | null>(null)

const selectedMacAddress = ref<string>('')
const toUpdateMacAddress = ref<string>('')
const appendTargetMacAddress = ref<string>('')

const filteredSlaves = computed(() => {
  return slaves.value.filter((slave) => slave.position.floor === floor.value)
})

axios
  .get<SlaveResponse>('http://localhost:8080/esp32', {
    timeout: 3000,
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
  .catch((err) => console.error(err))

watch(floorPlanSrc, (img) => {
  if (img) {
    height.value = img.naturalHeight * (width / img.naturalWidth)
    floorPlanImage.value = {
      image: img,
      x: 0,
      y: 0,
      height: height.value,
      width: width,
    }
  }
})

const addNewNode = () => {
  try {
    const macAddress = appendTargetMacAddress.value.trim().toLowerCase()
    if (!macRegex.test(macAddress)) {
      alert('Invalid MAC address format. Please use XX:XX:XX:XX:XX:XX.')
      return
    }
    const slave = slaves.value.find((s) => s.macAddress.trim() === macAddress)
    if (!slave) {
      axios.post('http://localhost:8080/esp32', {
        macAddress: appendTargetMacAddress,
        positionX: 100,
        positionY: 100,
        floor: floor.value,
      })
      slaves.value.push({
        macAddress: appendTargetMacAddress.value,
        position: { x: 100, y: 100, floor: -1 },
      })
    }
  } catch (e) {
    console.error('Error adding new node:', e)
    alert('Failed to add new node. Please check the console for details.')
  } finally {
    appendTargetMacAddress.value = ''
  }
}

const changeNode = async () => {
  if (!selectedMacAddress.value) return
  const newMacAddress = toUpdateMacAddress.value.trim().toLowerCase()
  if (!macRegex.test(newMacAddress)) return
  const idx = slaves.value.findIndex((s) => s.macAddress === selectedMacAddress.value)
  if (idx !== -1) {
    slaves.value[idx].macAddress = newMacAddress
    await axios.put(`http://localhost:8080/esp32/${selectedMacAddress.value}`, {
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
    await axios.delete(`http://localhost:8080/esp32/${selectedMacAddress.value}`)
    selectedMacAddress.value = ''
    popupPosition.value = null
  }
}
</script>
<template>
  <div z-index="1" class="konva-test">
    <v-stage
      :config="{ width, height }"
      id="konva-root-stage"
      @click="() => (popupPosition = null)"
    >
      <v-layer>
        <v-image v-if="floorPlanSrc" :config="floorPlanImage"></v-image>
        <div v-if="targetSrc">
          <NodePosition
            v-for="(slave, idx) in filteredSlaves"
            :key="slave.macAddress"
            :index="idx"
            :info="slave"
            :imgSrc="targetSrc"
            v-model="popupPosition"
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
            @update:deleteMacAddress="
              (macAddress) => {
                console.log(macAddress)
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
      :style="{ left: popupPosition.x + 'px', top: popupPosition.y + 'px' }"
    >
      <h3>현재 MAC 주소: {{ selectedMacAddress }}</h3>
      <hr style="margin-top: 0.5em; margin-bottom: 0.5em" />
      <h3>MAC 주소 수정</h3>
      <input type="text" v-model="toUpdateMacAddress" placeholder="새 MAC 주소를 입력하세요" />
      <button @click="changeNode()">제출</button>
      <hr style="margin-top: 0.5em; margin-bottom: 0.5em" />
      <h3>노드 삭제</h3>
      <button @click="deleteNode()">삭제</button>
    </div>
    <div>
      <div>
        <input type="text" v-model="appendTargetMacAddress" />
        <button @click="addNewNode()">제출</button>
      </div>

      <div>
        <p>current floor: {{ floor }}</p>
        <button @click="floor += 1">Up</button>
        <button @click="floor -= 1">Down</button>
        <button @click="floor = -1">Reset</button>
      </div>
    </div>
  </div>
</template>
