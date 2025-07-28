<script setup lang="ts">
import type { SlaveType } from '@/types/slave-type'
import type Konva from 'konva'
import { axiosInstance } from '@/utils/axios-instance'
import { reactive } from 'vue'

const props = defineProps({
  info: {
    type: Object as () => SlaveType,
    required: true,
  },
  popupPosition: {
    type: Object as () => { x: number; y: number } | null,
    default: null,
  },
  floorImageSize: {
    type: Object as () => { width: number; height: number },
    default: () => ({ width: Number, height: Number }),
  },
  selectedMacAddress: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:nodePosition', 'update:popupPosition', 'update:targetMacAddress'])

const macAddressId = props.info.macAddress.replace(':', '-')
const BALL_SIZE = 50
const macAddress = props.info.macAddress.toLowerCase()

const defaultVConfig = {
  width: BALL_SIZE,
  height: BALL_SIZE,
}

const defaultVTextConfig = {
  ...defaultVConfig,
  fontFamily: 'Arial',
  align: 'center',
}

const groupConfig = reactive({
  x: props.info.position.x,
  y: props.info.position.y,
  draggable: true,
  dragBoundFunc: (pos: Konva.Vector2d) => ({
    x: Math.min(props.floorImageSize.width - BALL_SIZE, Math.max(0, pos.x)),
    y: Math.min(props.floorImageSize.height - BALL_SIZE, Math.max(0, pos.y)),
  }),
  id: `group-${macAddressId}`,
})

const imgConfig = {
  ...defaultVConfig,
  x: BALL_SIZE / 2,
  y: BALL_SIZE / 2,
  radius: BALL_SIZE / 2,
  fill: 'red',
  id: `img-${macAddressId}`,
}

const macTxtConfig = {
  ...defaultVTextConfig,
  text: macAddress,
  fontSize: 12,
  fill: 'white',
  verticalAlign: 'middle',
  id: `mac-${macAddressId}`,
}

const commonProps = {
  macAddress: props.info.macAddress,
  floor: props.info.position.floor,
}

const onIconMoveEnd = async (e: Konva.KonvaEventObject<PointerEvent>) => {
  const dom = e.evt
  const { x: canvasX, y: canvasY } = e.target.position()

  await axiosInstance.patch('/esp32', {
    ...commonProps,
    positionX: canvasX,
    positionY: canvasY,
  })
  emit('update:nodePosition', {
    ...commonProps,
    x: canvasX,
    y: canvasY,
  })
  if (props.popupPosition && props.info.macAddress === props.selectedMacAddress) {
    updatePopupPosition(dom)
  } else {
    emit('update:popupPosition', null)
  }
}

const onClick = (e: Konva.KonvaEventObject<PointerEvent>) => {
  const dom = e.evt
  e.cancelBubble = true
  updatePopupPosition(dom)
  emit('update:targetMacAddress', props.info.macAddress)
}

const updatePopupPosition = (dom: PointerEvent) => {
  emit('update:popupPosition', {
    x:
      (dom instanceof MouseEvent ? dom.clientX : (dom as TouchEvent).changedTouches[0].clientX) +
      15,
    y:
      (dom instanceof MouseEvent ? dom.clientY : (dom as TouchEvent).changedTouches[0].clientY) +
      10,
    floor: props.info.position.floor,
  })
}
</script>
<template>
  <v-group
    :config="groupConfig"
    @dragend="onIconMoveEnd"
    draggable="true"
    @click="onClick"
    @tap="onClick"
  >
    <v-circle :config="imgConfig"></v-circle>
    <v-text :config="macTxtConfig"></v-text>
  </v-group>
</template>
