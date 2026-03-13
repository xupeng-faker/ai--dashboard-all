interface RequestOptions extends RequestInit {
  timeout?: number
  retry?: number
}

class Request {
  private baseURL: string

  private timeout: number

  constructor(baseURL: string, timeout = 10000) {
    this.baseURL = baseURL
    this.timeout = timeout
  }

  async request<T>(url: string, options: RequestOptions = {}): Promise<T> {
    const headers = new Headers({ 'Content-Type': 'application/json' })
    if (options.headers instanceof Headers) {
      options.headers.forEach((value, key) => headers.set(key, value))
    } else if (Array.isArray(options.headers)) {
      options.headers.forEach(([key, value]) => headers.set(key, value))
    } else if (options.headers) {
      Object.entries(options.headers).forEach(([key, value]) => {
        if (value !== undefined) {
          headers.set(key, value as string)
        }
      })
    }

    const token = localStorage.getItem('token')
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }

    const controller = new AbortController()
    const timeoutId = window.setTimeout(() => controller.abort(), options.timeout ?? this.timeout)
    const { headers: _originalHeaders, ...restOptions } = options

    try {
      const response = await fetch(`${this.baseURL}${url}`, {
        ...restOptions,
        headers,
        signal: controller.signal,
      })

      window.clearTimeout(timeoutId)

      if (!response.ok) {
        const message = await this.safeParseError(response)
        throw new Error(message)
      }

      if (response.status === 204) {
        return undefined as T
      }

      return (await response.json()) as T
    } catch (error) {
      window.clearTimeout(timeoutId)
      throw error
    }
  }

  private async safeParseError(response: Response) {
    try {
      const body = await response.json()
      return body?.message ?? response.statusText
    } catch (error) {
      return response.statusText
    }
  }
}

export const request = new Request('/ai_transform_webapi')

export const get = <T>(url: string, options?: RequestOptions) => request.request<T>(url, { ...options, method: 'GET' })

export const post = <T>(url: string, body?: unknown, options?: RequestOptions) =>
  request.request<T>(url, { ...options, method: 'POST', body: JSON.stringify(body) })

