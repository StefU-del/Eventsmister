import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'

import { PageState } from '../common/PageState'
import styles from './AppLayout.module.css'
import { SiteFooter } from './SiteFooter'
import { SiteHeader } from './SiteHeader'

export function AppLayout() {
  return (
    <div className={styles.appShell}>
      <SiteHeader />
      <main className={styles.mainContent} id="top">
        <Suspense
          fallback={(
            <div className={styles.routeLoading}>
              <PageState kind="loading" title="Opening page" compact />
            </div>
          )}
        >
          <Outlet />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  )
}
