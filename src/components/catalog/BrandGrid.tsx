import { cn } from '@/lib/utils'
import { BrandCard } from './BrandCard'
import type { BrandSummary } from '@/lib/catalog'

interface BrandGridProps {
  brands: BrandSummary[]
  onSelectBrand: (brand: string) => void
  /** Narrower layout when a side panel is open. */
  isPanelOpen?: boolean
  size?: 'md' | 'sm'
}

export const BrandGrid = ({ brands, onSelectBrand, isPanelOpen, size = 'md' }: BrandGridProps) => {
  return (
    <div
      className={cn(
        'grid gap-2.5',
        size === 'sm'
          ? 'grid-cols-2 sm:grid-cols-3 xl:grid-cols-4'
          : isPanelOpen
            ? 'grid-cols-2 xl:grid-cols-3'
            : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
      )}
    >
      {brands.map((summary) => (
        <BrandCard key={summary.brand} summary={summary} onSelect={onSelectBrand} size={size} />
      ))}
    </div>
  )
}
