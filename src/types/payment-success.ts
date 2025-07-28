interface PaymentSuccess {
  status: string
  id: string
  version: string
  requestdAt: string
  statusChangedAt: string
  orderName: string
  amount: PaymentAmount
  currency: string
  paidAt: string
  receiptUrl: string
  macAddress: string
}

interface PaymentAmount {
  total: number
  taxFree: number
  vat: number
  supply: number
  discount: number
  cancelled: number
  cancelledTaxFree: number
}

export type { PaymentSuccess, PaymentAmount }
