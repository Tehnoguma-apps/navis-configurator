import { useTranslation } from 'react-i18next'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CatalogSearchInputProps {
  value: string
  onChange: (value: string) => void
  className?: string
}

/** Search field for brands and models, with a clear button. */
export const CatalogSearchInput = ({ value, onChange, className }: CatalogSearchInputProps) => {
  const { t } = useTranslation()

  return (
    <div className={cn('relative', className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t('catalog.searchPlaceholder')}
        aria-label={t('catalog.searchPlaceholder')}
        className="h-11 w-full rounded-lg border border-input bg-white pl-9 pr-10 text-base outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary sm:h-9 sm:text-sm [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label={t('catalog.clearSearch')}
          className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:h-7 sm:w-7"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}
