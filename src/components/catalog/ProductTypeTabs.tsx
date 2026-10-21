import { useTranslation } from 'react-i18next'
import { Anchor, Ship, Waves, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PRODUCT_TYPES } from '@/lib/catalog'
import type { ProductType } from '@/types'

const ICONS: Record<ProductType, LucideIcon> = {
  yacht: Ship,
  tender: Anchor,
  toy: Waves,
}

interface ProductTypeTabsProps {
  value: ProductType
  onChange: (value: ProductType) => void
  /** Product count per type; omit to hide the counters. */
  counts?: Record<ProductType, number>
  size?: 'md' | 'sm'
  className?: string
}

/**
 * Top-level catalog switch: Yachts / Tenders / Toys.
 * Underlined serif tabs with a product count next to each label.
 */
export const ProductTypeTabs = ({ value, onChange, counts, size = 'md', className }: ProductTypeTabsProps) => {
  const { t } = useTranslation()

  return (
    <div
      role="tablist"
      aria-label={t('catalog.productType')}
      className={cn('-mx-1 flex items-end gap-0.5 overflow-x-auto px-1 [scrollbar-width:none] sm:gap-1 [&::-webkit-scrollbar]:hidden', className)}
    >
      {PRODUCT_TYPES.map((type) => {
        const Icon = ICONS[type]
        const isActive = type === value
        return (
          <button
            key={type}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(type)}
            className={cn(
              'group relative flex min-h-11 shrink-0 items-center gap-1.5 rounded-md px-2 transition-colors sm:px-2.5',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              size === 'sm' && 'sm:min-h-9',
              isActive ? 'text-navy' : 'text-muted-foreground hover:text-navy',
            )}
          >
            <Icon
              className={cn(
                'hidden shrink-0 transition-colors sm:block',
                size === 'md' ? 'h-4 w-4' : 'h-3.5 w-3.5',
                isActive ? 'text-gold-dark' : 'text-muted-foreground/70 group-hover:text-navy',
              )}
              strokeWidth={1.75}
            />
            <span
              className={cn(
                'font-display font-semibold leading-none',
                size === 'md' ? 'text-base sm:text-lg' : 'text-sm',
              )}
            >
              {t(`catalog.types.${type}`)}
            </span>
            {counts && (
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums leading-none',
                  isActive ? 'bg-navy text-white' : 'bg-muted text-muted-foreground',
                )}
              >
                {counts[type]}
              </span>
            )}
            <span
              aria-hidden
              className={cn(
                'absolute inset-x-2 bottom-0 h-0.5 sm:inset-x-2.5 rounded-full bg-gold transition-opacity',
                isActive ? 'opacity-100' : 'opacity-0',
              )}
            />
          </button>
        )
      })}
    </div>
  )
}
