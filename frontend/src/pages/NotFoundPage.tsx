import { Link } from 'react-router-dom'

import { PageState } from '../components/common/PageState'
import pageStyles from './Page.module.css'

export function NotFoundPage() {
  return (
    <section className={pageStyles.page}>
      <PageState
        kind="notFound"
        title="Page not found"
        message="The page you were looking for does not exist."
        action={<Link className={pageStyles.primaryLink} to="/">Back to events</Link>}
      />
    </section>
  )
}
