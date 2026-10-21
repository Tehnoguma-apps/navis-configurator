import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { Ship } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatPrice } from '@/lib/formatters'
import { supabase } from '@/lib/supabase'
import { getBoatCategory, getProductType } from '@/lib/catalog'
import { CategoryBadge } from '@/components/catalog/CategoryBadge'
import type { Boat } from '@/types'

interface BoatCardProps {
  boat: Boat
  isSelected?: boolean
  onSelect?: (id: string) => void
  /** Show the product type (tender / toy) badge, e.g. in cross-catalog search results. */
  showType?: boolean
}

export const BoatCard = ({ boat, isSelected, onSelect, showType }: BoatCardProps) => {
  const productType = getProductType(boat)
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const handlePrefetch = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: ['boat', boat.id],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('boats')
          .select('*, specs:boat_specs(*), images:boat_images(*)')
          .eq('id', boat.id)
          .single()
        if (error) throw error
        return data
      },
      staleTime: 5 * 60 * 1000,
    })
  }, [queryClient, boat.id])

  return (
    <button
      type="button"
      onClick={() => onSelect?.(boat.id)}
      onMouseEnter={handlePrefetch}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-lg border bg-card text-left transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        isSelected
          ? 'border-primary ring-2 ring-primary/30 shadow-lg shadow-primary/10'
          : 'border-border/60 hover:border-border hover:shadow-lg hover:shadow-navy/5'
      )}
    >
      {/* Image */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
        {boat.hero_image_url ? (
          <img
            src={boat.hero_image_url}
            alt={boat.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted/50">
            <Ship className="h-8 w-8 text-border" strokeWidth={1} />
          </div>
        )}

        {/* Category + type badges */}
        <div className="absolute right-2 top-2 flex flex-col items-end gap-1">
          <CategoryBadge category={getBoatCategory(boat)} />
          {showType && productType !== 'yacht' && (
            <span className="rounded-md bg-navy/80 px-1.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
              {t(`catalog.typeSingular.${productType}`)}
            </span>
          )}
        </div>

        {/* Selected indicator */}
        {isSelected && (
          <div className="absolute left-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white shadow-md">
            <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
              <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col px-2.5 pb-2.5 pt-2">
        <h3 className="line-clamp-2 font-display text-sm font-semibold leading-snug text-navy transition-colors duration-200 group-hover:text-primary">
          {boat.name}
        </h3>
        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
          {boat.brand}
          {boat.year && <> &middot; {boat.year}</>}
        </p>
        <p className="mt-auto pt-1.5 font-display text-sm font-bold tracking-tight text-gold-dark lining-nums">
          {formatPrice(boat.base_price)}
        </p>
      </div>
    </button>
  )
}
