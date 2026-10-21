import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'

export function useQueryParam(key: string, defaultValue = '') {
  const [searchParams, setSearchParams] = useSearchParams()
  const value = searchParams.get(key) ?? defaultValue

  const setValue = useCallback((newValue: string) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      if (newValue) next.set(key, newValue)
      else next.delete(key)
      return next
    }, { replace: true })
  }, [key, setSearchParams])

  return [value, setValue] as const
}

/**
 * Update several query params in one navigation. Separate useQueryParam setters
 * called in the same tick overwrite each other (each starts from the same
 * snapshot), so batch related changes through this instead.
 * Empty string removes a param.
 */
export function useSetQueryParams(): (updates: Record<string, string>) => void {
  const [, setSearchParams] = useSearchParams()

  return useCallback((updates: Record<string, string>) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      for (const [key, value] of Object.entries(updates)) {
        if (value) next.set(key, value)
        else next.delete(key)
      }
      return next
    }, { replace: true })
  }, [setSearchParams])
}
