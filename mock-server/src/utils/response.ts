import type { ApiResponse } from '../types'

export const successResponse = <T>(data: T, message = 'success'): ApiResponse<T> => {
  return {
    code: 200,
    message,
    data,
    timestamp: Date.now(),
  }
}

export const errorResponse = (message: string, code = 500): ApiResponse<null> => {
  return {
    code,
    message,
    data: null,
    timestamp: Date.now(),
  }
}
