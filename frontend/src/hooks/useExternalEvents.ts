import { useCallback, useEffect, useRef, useState } from 'react'

import { searchExternalEvents } from '../api/externalEvents'
import type { ExternalDiscovery } from '../api/types'
import { getErrorMessage } from '../utils/errors'


export function useExternalEvents() {
  const [discovery, setDiscovery] = useState<ExternalDiscovery | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastQuery, setLastQuery] = useState('')
  const activeRequest = useRef<AbortController | null>(null)

  useEffect(
    () => () => {
      activeRequest.current?.abort()
    },
    [],
  )

  const search = useCallback(async (query: string, token: string) => {
    activeRequest.current?.abort()
    const controller = new AbortController()
    activeRequest.current = controller
    setIsLoading(true)
    setError(null)
    setLastQuery(query)

    try {
      const result = await searchExternalEvents(query, token, controller.signal)
      setDiscovery(result)
    } catch (requestError) {
      if (requestError instanceof DOMException && requestError.name === 'AbortError') {
        return
      }
      setDiscovery(null)
      setError(
        getErrorMessage(requestError, 'External events could not be loaded.'),
      )
    } finally {
      if (activeRequest.current === controller) {
        activeRequest.current = null
        setIsLoading(false)
      }
    }
  }, [])

  return { discovery, isLoading, error, lastQuery, search }
}
