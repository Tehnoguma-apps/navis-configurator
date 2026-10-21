import { useTranslation } from 'react-i18next'
import { Check, Ship } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ds } from '@/lib/styles'
import { formatPrice } from '@/lib/formatters'
import { getBoatCategory, getProductType } from '@/lib/catalog'
import { CategoryBadge } from '@/components/catalog/CategoryBadge'
import type { Boat, BoatSpec } from '@/types'

interface ConfiguratorBoatCardProps {
  boat: Boat
  isSelected: boolean
  onSelect: (boat: Boat) => void
  /** Top specs of the selected boat, shown in the inline preview. */
  specs: BoatSpec[]
  onConfigure: () => void
  /** Show category + product type badges (search results, template list). */
  showType?: boolean
}

/** Compact product card for configurator Step 1, with an inline preview when selected. */
export const ConfiguratorBoatCard = ({
  boat,
  isSelected,
  onSelect,
  specs,
  onConfigure,
  showType,
}: ConfiguratorBoatCardProps) => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as 'hr' | 'en'
  const productType = getProductType(boat)
  const category = getBoatCategory(boat)

  return (
    <div>
      <button
        type="button"
        onClick={() => onSelect(boat)}
        aria-pressed={isSelected}
        className={cn(
          'group flex w-full overflow-hidden rounded-lg border bg-card text-left transition-all duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          'flex-col p-0 lg:flex-row lg:items-center lg:gap-2.5 lg:p-1.5',
          isSelected
            ? 'border-gold/60 ring-2 ring-gold/20 shadow-sm'
            : 'border-border hover:border-navy/20 hover:shadow-md',
        )}
      >
        {/* Image */}
        <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden bg-muted lg:aspect-auto lg:h-16 lg:w-24 lg:rounded-md">
          {boat.hero_image_url ? (
            <img
              src={boat.hero_image_url}
              alt={boat.name}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Ship className="h-6 w-6 text-border" strokeWidth={1} />
            </div>
          )}
          {showType && <CategoryBadge category={category} className="absolute right-1 top-1 lg:hidden" />}
          {isSelected && <div className="absolute inset-0 bg-primary/10 lg:hidden" />}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1 p-2 lg:p-0">
          <p className="truncate text-xs font-medium text-foreground lg:text-sm">{boat.name}</p>
          <p className="flex items-center gap-1.5 truncate text-[11px] text-muted-foreground">
            <span className="truncate">
              {boat.brand}
              {category !== 'new' && boat.year && <> &middot; {boat.year}</>}
            </span>
            {showType && <CategoryBadge category={category} variant="soft" className="hidden lg:inline-flex" />}
            {showType && productType !== 'yacht' && (
              <span className="hidden rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-navy lg:inline-flex">
                {t(`catalog.typeSingular.${productType}`)}
              </span>
            )}
          </p>
          <p className="mt-0.5 text-xs font-semibold text-gold-dark">
            {formatPrice(boat.base_price)}
          </p>
        </div>

        {isSelected && (
          <div className="mr-1 hidden h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary lg:flex">
            <Check className="h-3.5 w-3.5 text-white" />
          </div>
        )}
      </button>

      {/* Inline preview (selected product only) */}
      {isSelected && (
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-gold/20 border-l-2 border-l-gold bg-gold/5 px-3 py-2 text-xs">
          {specs.map((spec) => (
            <span key={spec.id} className="text-muted-foreground">
              <span className="font-medium text-foreground">
                {lang === 'hr' ? spec.label_hr : spec.label_en}:
              </span>{' '}
              {spec.value}
            </span>
          ))}
          <button
            type="button"
            onClick={onConfigure}
            className={cn(ds.btn.base, ds.btn.sm, ds.btn.primary, 'ml-auto min-h-9 w-full sm:w-auto')}
          >
            {t('configurator.configureThis', { context: productType })}
          </button>
        </div>
      )}
    </div>
  )
}
