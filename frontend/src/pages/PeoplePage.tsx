import { Search, UsersRound } from 'lucide-react'
import { useState, type FormEvent } from 'react'

import { searchUsers } from '../api/users'
import type { PublicUser } from '../api/types'
import { useAuth } from '../auth/useAuth'
import { PageHeader } from '../components/common/PageHeader'
import { PageState } from '../components/common/PageState'
import { UserCard } from '../components/users/UserCard'
import { getErrorMessage } from '../utils/errors'
import pageStyles from './Page.module.css'
import styles from './PeoplePage.module.css'

export function PeoplePage() {
  const { token } = useAuth()
  const [query, setQuery] = useState('')
  const [users, setUsers] = useState<PublicUser[]>([])
  const [hasSearched, setHasSearched] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const searchQuery = query.trim()
    if (!searchQuery || !token) {
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      setUsers(await searchUsers(searchQuery, token))
      setHasSearched(true)
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, 'People could not be searched.'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className={pageStyles.page}>
      <PageHeader
        eyebrow="Community"
        title="Find people"
        description="Search by username and see what other Londoners have shared."
      />
      <form className={styles.searchForm} role="search" onSubmit={handleSearch}>
        <Search size={19} aria-hidden="true" />
        <label className={styles.visuallyHidden} htmlFor="people-search">Search usernames</label>
        <input
          id="people-search"
          value={query}
          maxLength={30}
          placeholder="Search usernames"
          required
          onChange={(event) => setQuery(event.target.value)}
        />
        <button type="submit" disabled={isLoading}>{isLoading ? 'Searching' : 'Search'}</button>
      </form>

      <div className={styles.results}>
        {error ? (
          <PageState kind="error" title="Search failed" message={error} compact />
        ) : !hasSearched ? (
          <div className={styles.searchPrompt}>
            <UsersRound size={25} aria-hidden="true" />
            <h2>Meet the community</h2>
            <p>Search for a username to open their profile and event posts.</p>
          </div>
        ) : users.length === 0 ? (
          <PageState kind="notFound" title="No people found" message={`No usernames matched “${query.trim()}”.`} compact />
        ) : (
          <div className={styles.userGrid}>
            {users.map((user) => <UserCard key={user.id} user={user} />)}
          </div>
        )}
      </div>
    </section>
  )
}
