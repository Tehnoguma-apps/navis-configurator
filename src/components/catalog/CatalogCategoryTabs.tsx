import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { BOAT_CATEGORIES } from '@/lib/catalog'
import type { BoatCategory, ProductType } from '@/types'

interface CatalogCategoryTabsProps {
  value: BoatCategory | null
  onChange: (value: BoatCategory) => void
  /** Product count per category; omit to hide the counters. */
  counts?: Record<BoatCategory, number>
  /** `hero` = large tiles next to the page title, `compact` = segmented control. */
  variant?: 'hero' | 'compact'
  /** Hero tiles read "New boats" / "New tenders" / "New toys" depending on the type. */
  productType?: ProductType
  className?: string
}

/** New / Used / Stock selector with a product count per category. */
export const CatalogCategoryTabs = ({
  value,
  onChange,
  counts,
  variant = 'hero',
  productType,
  className,
}: CatalogCategoryTabsProps) => {
  const { t } = useTranslation()

  if (variant === 'compact') {
    return (
      <div
        role="tablist"
        aria-label={t('boats.category')}
        className={cn('inline-flex rounded-lg border border-border bg-white p-0.5', className)}
      >
        {BOAT_CATEGORIES.map((category) => {
          const isActive = category === value
          return (
            <button
              key={category}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(category)}
              className={cn(
                'flex min-h-10 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-3 text-xs font-medium transition-colors sm:min-h-8',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                isActive ? 'bg-navy text-white shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-navy',
              )}
            >
              {t(`boats.${category}`)}
              {counts && (
                <span
                  className={cn(
                    'text-[10px] tabular-nums',
                    isActive ? 'text-gold-light' : 'text-muted-foreground/70',
                  )}
                >
                  {counts[category]}
                </span>
              )}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div
      role="tablist"
      aria-label={t('boats.category')}
      className={cn('grid grid-cols-3 gap-2', className)}
    >
      {BOAT_CATEGORIES.map((category) => {
        const isActive = category === value
        return (
          <button
            key={category}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(category)}
            className={cn(
              'group flex min-h-11 flex-col justify-between rounded-xl border px-3 py-2.5 text-left transition-colors sm:min-w-[9.5rem] sm:px-4 sm:py-3',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              isActive
                ? 'border-navy bg-navy text-white shadow-md shadow-navy/15'
                : 'border-border bg-white text-navy hover:border-navy/30 hover:bg-muted/40',
            )}
          >
            <span className="flex items-baseline justify-between gap-2">
              <span className="text-sm font-semibold leading-tight">
                {t(`catalog.categories.${category}`, { context: productType })}
              </span>
              {counts && (
                <span
                  className={cn(
                    'font-display text-xl font-semibold tabular-nums lining-nums leading-none sm:text-2xl',
                    isActive ? 'text-gold' : 'text-navy/80',
                  )}
                >
                  {counts[category]}
                </span>
              )}
            </span>
            <span
              className={cn(
                'mt-1 hidden text-[11px] leading-snug sm:block',
                isActive ? 'text-white/65' : 'text-muted-foreground',
              )}
            >
              {t(`catalog.categoryHints.${category}`)}
            </span>
          </button>
        )
      })}
    </div>
  )
}
