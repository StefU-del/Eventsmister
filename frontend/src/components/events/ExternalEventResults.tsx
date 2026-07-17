import { RefreshCw } from 'lucide-react'

import type { ExternalDiscovery } from '../../api/types'
import { PageState } from '../common/PageState'
import pageStyles from '../../pages/Page.module.css'
import { ExternalEventCard } from './ExternalEventCard'
import styles from './ExternalEventResults.module.css'


type ExternalEventResultsProps = {
  discovery: ExternalDiscovery | null
  isLoading: boolean
  error: string | null
  hasSearched: boolean
  onRetry: () => void
}


export function ExternalEventResults({
  discovery,
  isLoading,
  error,
  hasSearched,
  onRetry,
}: ExternalEventResultsProps) {
  if (!hasSearched) {
    return null
  }

  const enabledProviders = discovery?.providers.filter((provider) => provider.enabled) ?? []
  const providerErrors = enabledProviders.filter((provider) => provider.error)

  return (
    <section className={styles.results} aria-labelledby="external-events-title">
      <div className={styles.heading}>
        <div>
          <span>Wider London</span>
          <h2 id="external-events-title">Events from around the web</h2>
        </div>
        {discovery && enabledProviders.length > 0 && (
          <p>
            {enabledProviders.map((provider) => provider.source_name).join(' · ')}
          </p>
        )}
      </div>

      {isLoading ? (
        <PageState
          kind="loading"
          title="Searching wider London"
          message="Checking connected event sources."
        />
      ) : error ? (
        <PageState
          kind="error"
          title="External events could not load"
          message={error}
          action={
            <button className={pageStyles.secondaryButton} type="button" onClick={onRetry}>
              <RefreshCw size={16} aria-hidden="true" />
              Try again
            </button>
          }
        />
      ) : discovery && enabledProviders.length === 0 ? (
        <PageState
          kind="empty"
          title="External sources are not connected"
          message="Local EventsMister events remain available on this page."
        />
      ) : discovery && discovery.events.length === 0 ? (
        <PageState
          kind="notFound"
          title="No wider matches found"
          message="Try a broader event name or another interest."
        />
      ) : discovery ? (
        <>
          {providerErrors.length > 0 && (
            <p className={styles.providerNotice} role="status">
              {providerErrors.map((provider) => provider.source_name).join(' and ')} could not respond.
              Other connected sources are shown below.
            </p>
          )}
          <div className={styles.grid}>
            {discovery.events.map((event) => (
              <ExternalEventCard
                key={`${event.source}-${event.external_id}`}
                event={event}
              />
            ))}
          </div>
        </>
      ) : null}
      {!isLoading && !error && discovery?.search_suggestions_html && (
        <iframe
          className={styles.searchSuggestions}
          title="Google Search suggestions"
          sandbox="allow-popups allow-popups-to-escape-sandbox"
          referrerPolicy="no-referrer"
          srcDoc={discovery.search_suggestions_html}
        />
      )}
    </section>
  )
}
