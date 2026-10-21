import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { formatPrice } from '@/lib/formatters'
import type { BrandSummary } from '@/lib/catalog'

interface BrandCardProps {
  summary: BrandSummary
  onSelect: (brand: string) => void
  size?: 'md' | 'sm'
}

function monogram(brand: string): string {
  const words = brand.split(/\s+/).filter(Boolean)
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase()
  return brand.slice(0, 2).toUpperCase()
}

/** Brand tile: hero image of the flagship model, brand name, model count and starting price. */
export const BrandCard = ({ summary, onSelect, size = 'md' }: BrandCardProps) => {
  const { t } = useTranslation()

  return (
    <button
      type="button"
      onClick={() => onSelect(summary.brand)}
      className={cn(
        'group relative flex w-full overflow-hidden rounded-xl bg-navy text-left text-white',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        size === 'md' ? 'h-32 sm:h-36' : 'h-24',
      )}
    >
      {summary.heroImageUrl ? (
        <img
          src={summary.heroImageUrl}
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover opacity-80 transition-transform duration-700 ease-out group-hover:scale-[1.05]"
        />
      ) : (
        <span
          aria-hidden
          className="absolute bottom-1 right-3 font-display text-6xl font-semibold leading-none text-gold/20"
        >
          {monogram(summary.brand)}
        </span>
      )}
      <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-navy via-navy/55 to-navy/0" />

      <span className="absolute right-2 top-2 rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-white backdrop-blur-sm">
        {t('catalog.modelCount', { count: summary.count })}
      </span>

      <span className={cn('relative mt-auto block w-full min-w-0', size === 'md' ? 'p-3' : 'p-2.5')}>
        <span
          className={cn(
            'block truncate font-display font-semibold leading-tight',
            size === 'md' ? 'text-lg' : 'text-sm',
          )}
        >
          {summary.brand}
        </span>
        <span className="mt-0.5 block truncate text-[11px] text-white/75">
          {t('catalog.fromPrice', { price: formatPrice(summary.minPrice) })}
        </span>
      </span>
    </button>
  )
}
