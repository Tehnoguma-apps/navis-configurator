import { useTranslation } from 'react-i18next'
import { ChevronLeft } from 'lucide-react'

interface CatalogBreadcrumbProps {
  brand: string
  count: number
  onBack: () => void
}

/** "All brands / <Brand>" trail shown above a brand's models. */
export const CatalogBreadcrumb = ({ brand, count, onBack }: CatalogBreadcrumbProps) => {
  const { t } = useTranslation()

  return (
    <nav aria-label={t('catalog.breadcrumb')} className="flex min-w-0 items-center gap-1">
      <button
        type="button"
        onClick={onBack}
        className="-ml-2 flex min-h-11 shrink-0 items-center gap-1 rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-h-8"
      >
        <ChevronLeft className="h-4 w-4" />
        {t('catalog.allBrands')}
      </button>
      <span aria-hidden className="text-muted-foreground/50">/</span>
      <h2 className="min-w-0 truncate font-display text-lg font-semibold text-navy" aria-current="page">
        {brand}
      </h2>
      <span className="shrink-0 text-xs text-muted-foreground">
        {t('catalog.modelCount', { count })}
      </span>
    </nav>
  )
}
