import type { Boat, BoatCategory, ProductType } from '@/types'

/** Product types, in catalog display order. */
export const PRODUCT_TYPES: readonly ProductType[] = ['yacht', 'tender', 'toy'] as const

/** Catalog categories, in display order. */
export const BOAT_CATEGORIES: readonly BoatCategory[] = ['new', 'used', 'stock'] as const

export function isProductType(value: string): value is ProductType {
  return (PRODUCT_TYPES as readonly string[]).includes(value)
}

export function isBoatCategory(value: string): value is BoatCategory {
  return (BOAT_CATEGORIES as readonly string[]).includes(value)
}

/** Product type of a boat row, defaulting to 'yacht' for rows created before the column existed. */
export function getProductType(boat: Pick<Boat, 'product_type'> | null | undefined): ProductType {
  const value = boat?.product_type
  return value && isProductType(value) ? value : 'yacht'
}

/** Category of a boat row, defaulting to 'new'. */
export function getBoatCategory(boat: Pick<Boat, 'category'> | null | undefined): BoatCategory {
  const value = boat?.category
  return value && isBoatCategory(value) ? value : 'new'
}

/** Tailwind classes for the category badge shown on top of a product image. */
export const CATEGORY_BADGE_SOLID: Record<BoatCategory, string> = {
  new: 'bg-success/90 text-white',
  used: 'bg-warning/90 text-white',
  stock: 'bg-primary/90 text-white',
}

/** Tailwind classes for the category badge on a light background. */
export const CATEGORY_BADGE_SOFT: Record<BoatCategory, string> = {
  new: 'bg-success/10 text-success',
  used: 'bg-warning/10 text-warning',
  stock: 'bg-primary/10 text-primary-dark',
}

export interface BrandSummary {
  brand: string
  count: number
  minPrice: number
  heroImageUrl: string | null
}

/**
 * Group boats by brand. Brands are sorted alphabetically; the hero image is
 * taken from the most expensive model that has one.
 */
export function summarizeBrands(boats: Boat[]): BrandSummary[] {
  const map = new Map<string, { count: number; minPrice: number; hero: Boat | null }>()
  for (const boat of boats) {
    const brand = boat.brand?.trim() || '—'
    const entry = map.get(brand) ?? { count: 0, minPrice: Number.POSITIVE_INFINITY, hero: null }
    entry.count += 1
    entry.minPrice = Math.min(entry.minPrice, boat.base_price)
    if (boat.hero_image_url && (!entry.hero || boat.base_price > entry.hero.base_price)) {
      entry.hero = boat
    }
    map.set(brand, entry)
  }
  return [...map.entries()]
    .map(([brand, e]) => ({
      brand,
      count: e.count,
      minPrice: Number.isFinite(e.minPrice) ? e.minPrice : 0,
      heroImageUrl: e.hero?.hero_image_url ?? null,
    }))
    .sort((a, b) => a.brand.localeCompare(b.brand))
}

/** Count boats per key. Every key in `keys` is present in the result (0 if none). */
export function countBy<K extends string>(
  boats: Boat[],
  keys: readonly K[],
  getKey: (boat: Boat) => K,
): Record<K, number> {
  const counts = Object.fromEntries(keys.map((k) => [k, 0])) as Record<K, number>
  for (const boat of boats) {
    const key = getKey(boat)
    if (key in counts) counts[key] += 1
  }
  return counts
}

function normalize(value: string | null | undefined): string {
  return (value ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

/** Case- and accent-insensitive match on name, brand and model. */
export function matchesBoatSearch(boat: Boat, query: string): boolean {
  const q = normalize(query.trim())
  if (!q) return true
  const haystack = `${normalize(boat.name)} ${normalize(boat.brand)} ${normalize(boat.model)}`
  return q.split(/\s+/).every((token) => haystack.includes(token))
}

/** Case- and accent-insensitive match on brand name. */
export function matchesBrandSearch(brand: string, query: string): boolean {
  const q = normalize(query.trim())
  return q.length > 0 && normalize(brand).includes(q)
}

export type BoatSort = 'price_desc' | 'price_asc' | 'name' | 'year'

export function sortBoats(boats: Boat[], sort: BoatSort): Boat[] {
  const result = [...boats]
  switch (sort) {
    case 'price_asc':
      return result.sort((a, b) => a.base_price - b.base_price)
    case 'name':
      return result.sort((a, b) => a.name.localeCompare(b.name))
    case 'year':
      return result.sort((a, b) => (b.year ?? 0) - (a.year ?? 0))
    case 'price_desc':
    default:
      return result.sort((a, b) => b.base_price - a.base_price)
  }
}

export interface CatalogViewInput {
  productType: ProductType
  category: BoatCategory
  brand: string
  search: string
  sort: BoatSort
}

export interface CatalogView {
  typeCounts: Record<ProductType, number>
  categoryCounts: Record<BoatCategory, number>
  /** Brands within the active type + category. */
  brands: BrandSummary[]
  /** Brand whose models are shown: the selected one, or the only one available. */
  activeBrand: string | null
  /** True when the brand level was skipped because there is a single brand. */
  isSingleBrand: boolean
  /** Models of `activeBrand` within the active type + category, sorted. */
  models: Boat[]
  isSearching: boolean
  /** Search results across the whole catalog. */
  searchBrands: BrandSummary[]
  searchModels: Boat[]
}

/**
 * Derive everything the catalog UI (Boats page and configurator Step 1) needs
 * from the flat list of active boats. Pure, so callers wrap it in useMemo.
 */
export function buildCatalogView(boats: Boat[], input: CatalogViewInput): CatalogView {
  const typeCounts = countBy(boats, PRODUCT_TYPES, getProductType)
  const ofType = boats.filter((b) => getProductType(b) === input.productType)
  const categoryCounts = countBy(ofType, BOAT_CATEGORIES, getBoatCategory)
  const scoped = ofType.filter((b) => getBoatCategory(b) === input.category)
  const brands = summarizeBrands(scoped)

  const selectedBrand = input.brand && brands.some((b) => b.brand === input.brand) ? input.brand : null
  const isSingleBrand = !selectedBrand && brands.length === 1
  const activeBrand = selectedBrand ?? (isSingleBrand ? brands[0].brand : null)
  const models = activeBrand
    ? sortBoats(scoped.filter((b) => (b.brand?.trim() || '—') === activeBrand), input.sort)
    : []

  const query = input.search.trim()
  const isSearching = query.length > 0
  const searchBrands = isSearching
    ? summarizeBrands(boats.filter((b) => matchesBrandSearch(b.brand ?? '', query)))
    : []
  const searchModels = isSearching
    ? sortBoats(boats.filter((b) => matchesBoatSearch(b, query)), input.sort)
    : []

  return {
    typeCounts,
    categoryCounts,
    brands,
    activeBrand,
    isSingleBrand,
    models,
    isSearching,
    searchBrands,
    searchModels,
  }
}

/**
 * Where to navigate when a brand is picked from search results: keep the
 * active type + category if the brand has models there, otherwise jump to the
 * type + category where the brand has the most models.
 */
export function resolveBrandLocation(
  boats: Boat[],
  brand: string,
  current: { productType: ProductType; category: BoatCategory },
): { productType: ProductType; category: BoatCategory } {
  const ofBrand = boats.filter((b) => (b.brand?.trim() || '—') === brand)
  const inCurrent = ofBrand.some(
    (b) => getProductType(b) === current.productType && getBoatCategory(b) === current.category,
  )
  if (inCurrent || ofBrand.length === 0) return current

  const tally = new Map<string, number>()
  for (const b of ofBrand) {
    const key = `${getProductType(b)}|${getBoatCategory(b)}`
    tally.set(key, (tally.get(key) ?? 0) + 1)
  }
  const [bestKey] = [...tally.entries()].sort((a, b) => b[1] - a[1])[0]
  const [productType, category] = bestKey.split('|') as [ProductType, BoatCategory]
  return { productType, category }
}
