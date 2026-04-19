import axios from 'axios'

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000',
  timeout: 60000,
})

export const analyzePortfolio = async (tickers, weights, period = '2y') => {
  const response = await api.post('/api/portfolio/analyze', {
    tickers, weights, period,
  })
  return response.data
}

export const getVaR = async (tickers, weights, period = '2y') => {
  const response = await api.post('/api/portfolio/var', {
    tickers, weights, period,
  })
  return response.data
}

export const getReturnsData = async (tickers, weights, period = '2y') => {
  const response = await api.post('/api/portfolio/returns-data', {
    tickers, weights, period,
  })
  return response.data
}

export const getBenchmarkComparison = async (tickers, weights, period = '2y') => {
  const response = await api.post('/api/portfolio/benchmark-comparison', {
    tickers, weights, period,
  })
  return response.data
}

export const getOptimizationChart = async (tickers, weights, period = '2y') => {
  const response = await api.post('/api/portfolio/optimization-chart', {
    tickers, weights, period,
  })
  return response.data
}

export const searchStocks = async (query) => {
  const response = await api.get(`/api/portfolio/search-stocks?q=${query}`)
  return response.data
}

export const getSampleTickers = async () => {
  const response = await api.get('/api/portfolio/sample-tickers')
  return response.data
}