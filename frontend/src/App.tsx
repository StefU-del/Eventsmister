import styles from './App.module.css'
import { SiteFooter } from './components/SiteFooter'
import { SiteHeader } from './components/SiteHeader'
import { DiscoverPage } from './pages/DiscoverPage'

function App() {
  return (
    <div className={styles.appShell}>
      <SiteHeader />
      <main id="top">
        <DiscoverPage />
      </main>
      <SiteFooter />
    </div>
  )
}

export default App
