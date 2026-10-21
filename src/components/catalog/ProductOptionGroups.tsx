import { useTranslation } from 'react-i18next'
import { PRODUCT_TYPES, getProductType } from '@/lib/catalog'
import type { Boat, ProductType } from '@/types'

interface ProductOptionGroupsProps {
  boats: Pick<Boat, 'id' | 'name' | 'product_type'>[]
  /** Product type listed first (usually the type of the product being edited). */
  preferredType: ProductType
}

/** `<optgroup>`s for a native select, grouped by product type with the preferred type first. */
export const ProductOptionGroups = ({ boats, preferredType }: ProductOptionGroupsProps) => {
  const { t } = useTranslation()
  const order = [preferredType, ...PRODUCT_TYPES.filter((type) => type !== preferredType)]

  return (
    <>
      {order.map((type) => {
        const ofType = boats
          .filter((b) => getProductType(b) === type)
          .sort((a, b) => a.name.localeCompare(b.name))
        if (ofType.length === 0) return null
        return (
          <optgroup key={type} label={t(`catalog.types.${type}`)}>
            {ofType.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </optgroup>
        )
      })}
    </>
  )
}
