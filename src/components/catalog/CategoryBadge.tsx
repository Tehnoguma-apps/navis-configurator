import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { CATEGORY_BADGE_SOFT, CATEGORY_BADGE_SOLID } from '@/lib/catalog'
import type { BoatCategory } from '@/types'

interface CategoryBadgeProps {
  category: BoatCategory
  /** `solid` sits on top of an image, `soft` on a light background. */
  variant?: 'solid' | 'soft'
  className?: string
}

export const CategoryBadge = ({ category, variant = 'solid', className }: CategoryBadgeProps) => {
  const { t } = useTranslation()
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
        variant === 'solid' ? cn(CATEGORY_BADGE_SOLID[category], 'backdrop-blur-sm') : CATEGORY_BADGE_SOFT[category],
        className,
      )}
    >
      {t(`boats.${category}`)}
    </span>
  )
}
