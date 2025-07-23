<script setup lang="ts">
import type { SlaveType } from '@/types/slave-type'
import type Konva from 'konva'
import { stages } from 'konva/lib/Stage'
import axiosInstance from '@/utils/axios-instance'

const props = defineProps({
  index: {
    type: Number,
    required: true,
  },
  info: {
    type: Object as () => SlaveType,
    required: true,
  },
  imgSrc: {
    type: Object as () => HTMLImageElement | null,
    required: true,
  },
  popupPosition: {
    type: Object as () => { x: number; y: number } | null,
    default: null,
  },
})

const emit = defineEmits(['update:nodePosition', 'update:popupPosition', 'update:targetMacAddress'])

const macAddressId = props.info.macAddress.replace(':', '-')
const rootStage = stages.find((s) => s.id() === 'konva-root-stage')
const BALL_SIZE = 50
const macAddress = props.info.macAddress.toLowerCase()

const maxWidth = (rootStage?.width() || 600) - BALL_SIZE
const maxHeight = (rootStage?.height() || 800) - BALL_SIZE

const defaultVConfig = {
  width: BALL_SIZE,
  height: BALL_SIZE,
}

const defaultVTextConfig = {
  ...defaultVConfig,
  fontFamily: 'Arial',
  align: 'center',
}

const groupConfig = {
  x: props.info.position.x,
  y: props.info.position.y,
  draggable: true,
  dragBoundFunc: (pos: Konva.Vector2d) => {
    return {
      x: Math.min(maxWidth, Math.max(0, pos.x)),
      y: Math.min(maxHeight, Math.max(0, pos.y)),
    }
  },
  id: `group-${macAddressId}`,
}

const imgConfig = {
  ...defaultVConfig,
  image: props.imgSrc,
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

const onIconMoveEnd = async (e: Konva.KonvaEventObject<DragEvent>) => {
  const dom = e.evt
  const { x, y } = e.target.position()

  await axiosInstance.patch('/esp32', {
    ...commonProps,
    positionX: x,
    positionY: y,
  })
  emit('update:nodePosition', {
    ...commonProps,
    x,
    y,
  })
  console.log(props.popupPosition)
  if (props.popupPosition) updatePopupPosition(dom)
}

const onClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
  const dom = e.evt
  e.cancelBubble = true
  updatePopupPosition(dom)
  emit('update:targetMacAddress', props.info.macAddress)
}

const updatePopupPosition = (dom: MouseEvent | DragEvent) => {
  emit('update:popupPosition', {
    x: dom.clientX,
    y: dom.clientY,
    floor: props.info.position.floor,
  })
}
</script>
<template>
  <v-group :config="groupConfig" @dragend="onIconMoveEnd" draggable="true" @click="onClick">
    <v-image :config="imgConfig"></v-image>
    <v-text :config="macTxtConfig"></v-text>
  </v-group>
</template>
