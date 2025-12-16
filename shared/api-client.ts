interface ApiResponse<T> {
  data?: T
  error?: string
}

class BackendApiClient {
  private baseUrl: string
  private token: string | null

  constructor(baseUrl: string = 'http://localhost:8000') {
    this.baseUrl = baseUrl
    this.token = null
  }

  setToken(token: string) {
    this.token = token
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>,
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const error = await response.text()
      return { error }
    }

    return { data: await response.json() as T }
  }

  async login(email: string, password: string) {
    const result = await this.request<{ access_token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    if (result.data) {
      this.setToken(result.data.access_token)
    }
    return result
  }

  async register(email: string, password: string, name: string) {
    const result = await this.request<{ access_token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    })
    if (result.data) {
      this.setToken(result.data.access_token)
    }
    return result
  }

  async getMe() {
    return this.request('/users/me')
  }

  async getDashboardSummary() {
    return this.request('/dashboard/summary')
  }

  async listBots() {
    return this.request('/bots')
  }

  async getMarketData(symbol: string, interval = '1d', range = '1mo') {
    return this.request(`/market-data/${symbol}?interval=${interval}&range=${range}`)
  }
}

export const createBackendClient = (baseUrl?: string) => new BackendApiClient(baseUrl)