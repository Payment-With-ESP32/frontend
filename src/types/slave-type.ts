interface SlaveType {
  macAddress: string
  position: SlavePosition
}

interface SlavePosition {
  floor: number
  x: number
  y: number
}

interface SlaveResponse {
  slaves: SlaveType[]
}

export type { SlaveType, SlavePosition, SlaveResponse }
