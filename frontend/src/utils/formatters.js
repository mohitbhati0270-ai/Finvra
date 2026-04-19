export const formatINR = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(value)

export const formatPct = (value) =>
  `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`

export const returnColor = (value) =>
  value >= 0 ? 'text-green-500' : 'text-red-500'

export const bgReturnColor = (value) =>
  value >= 0 ? 'bg-green-50' : 'bg-red-50'