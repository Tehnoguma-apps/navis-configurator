import { cn } from '@/lib/utils'
import { BoatCard } from './BoatCard'
import type { Boat } from '@/types'

interface BoatGridProps {
  boats: Boat[]
  selectedBoatId?: string | null
  onSelectBoat?: (id: string) => void
  isPanelOpen?: boolean
  showType?: boolean
}

export const BoatGrid = ({ boats, selectedBoatId, onSelectBoat, isPanelOpen, showType }: BoatGridProps) => {
  return (
    <div
      className={cn(
        'grid gap-2.5',
        isPanelOpen
          ? 'grid-cols-2 xl:grid-cols-3'
          : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
      )}
    >
      {boats.map((boat) => (
        <BoatCard
          key={boat.id}
          boat={boat}
          isSelected={selectedBoatId === boat.id}
          onSelect={onSelectBoat}
          showType={showType}
        />
      ))}
    </div>
  )
}
