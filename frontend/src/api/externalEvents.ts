import { apiRequest } from './client'
import type {
  ExternalDiscovery,
  ExternalEvent,
  ExternalEventSource,
  ExternalProviderStatus,
} from './types'


const externalSources = new Set<ExternalEventSource>([
  'skiddle',
  'ticketmaster',
  'gemini',
])


function isExternalSource(value: unknown): value is ExternalEventSource {
  return typeof value === 'string' && externalSources.has(value as ExternalEventSource)
}


function isExternalEvent(value: unknown): value is ExternalEvent {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const event = value as Record<string, unknown>
  return (
    typeof event.external_id === 'string' &&
    isExternalSource(event.source) &&
    typeof event.source_name === 'string' &&
    typeof event.source_url === 'string' &&
    (event.source_logo_url === null || typeof event.source_logo_url === 'string') &&
    typeof event.title === 'string' &&
    typeof event.description === 'string' &&
    typeof event.category === 'string' &&
    typeof event.location === 'string' &&
    (event.image_url === null || typeof event.image_url === 'string') &&
    typeof event.event_date === 'string'
  )
}


function isProviderStatus(value: unknown): value is ExternalProviderStatus {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const provider = value as Record<string, unknown>
  return (
    isExternalSource(provider.source) &&
    typeof provider.source_name === 'string' &&
    typeof provider.enabled === 'boolean' &&
    typeof provider.returned === 'number' &&
    Number.isInteger(provider.returned) &&
    provider.returned >= 0 &&
    (provider.error === null || typeof provider.error === 'string')
  )
}


function isExternalDiscovery(value: unknown): value is ExternalDiscovery {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const discovery = value as Record<string, unknown>
  return (
    Array.isArray(discovery.events) &&
    discovery.events.every(isExternalEvent) &&
    Array.isArray(discovery.providers) &&
    discovery.providers.every(isProviderStatus) &&
    Array.isArray(discovery.terms) &&
    discovery.terms.every((term) => typeof term === 'string') &&
    (discovery.search_suggestions_html === null ||
      typeof discovery.search_suggestions_html === 'string')
  )
}


export async function searchExternalEvents(
  query: string,
  token: string,
  signal?: AbortSignal,
): Promise<ExternalDiscovery> {
  const search = new URLSearchParams()
  if (query.trim()) {
    search.set('query', query.trim())
  }

  const result = await apiRequest<unknown>(
    `/discover/external${search.size > 0 ? `?${search.toString()}` : ''}`,
    { token, signal },
  )
  if (!isExternalDiscovery(result)) {
    throw new Error('The external event service returned an unexpected response.')
  }
  return result
}
