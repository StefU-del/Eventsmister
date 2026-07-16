import styles from './EventFilters.module.css'

type EventFiltersProps = {
  categories: string[]
  selectedCategory: string
  onCategoryChange: (category: string) => void
}

export function EventFilters({
  categories,
  selectedCategory,
  onCategoryChange,
}: EventFiltersProps) {
  return (
    <div className={styles.filters} aria-label="Filter events by category">
      {categories.map((category) => (
        <button
          className={selectedCategory === category ? styles.active : undefined}
          key={category}
          type="button"
          aria-pressed={selectedCategory === category}
          onClick={() => onCategoryChange(category)}
        >
          {category}
        </button>
      ))}
    </div>
  )
}
