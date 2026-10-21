import { useState, useEffect, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, Plus, ArrowUpDown, FileUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ds } from '@/lib/styles'
import {
  buildCatalogView,
  isBoatCategory,
  isProductType,
  resolveBrandLocation,
  type BoatSort,
} from '@/lib/catalog'
import { useBoats } from '@/hooks/useBoats'
import { useAuth } from '@/hooks/useAuth'
import { useQueryParam, useSetQueryParams } from '@/hooks/useQueryParams'
import { BoatGrid } from '@/components/boats/BoatGrid'
import { BoatDetailPanel } from '@/components/boats/BoatDetailPanel'
import { PriceImportModal } from '@/components/boats/PriceImportModal'
import { ProductTypeTabs } from '@/components/catalog/ProductTypeTabs'
import { CatalogCategoryTabs } from '@/components/catalog/CatalogCategoryTabs'
import { CatalogSearchInput } from '@/components/catalog/CatalogSearchInput'
import { CatalogBreadcrumb } from '@/components/catalog/CatalogBreadcrumb'
import { CatalogSectionHeading } from '@/components/catalog/CatalogSectionHeading'
import { BrandGrid } from '@/components/catalog/BrandGrid'
import { QueryErrorState } from '@/components/ui/QueryErrorState'
import type { BoatCategory, ProductType } from '@/types'

const SORT_OPTIONS: readonly BoatSort[] = ['price_desc', 'price_asc', 'name', 'year'] as const

export default function BoatsListPage() {
  const { t } = useTranslation()
  const { isAdmin } = useAuth()
  const { data: boats, isLoading, error, refetch } = useBoats()

  const [search, setSearch] = useQueryParam('search')
  const [typeParam] = useQueryParam('type', 'yacht')
  const [categoryParam] = useQueryParam('category', 'new')
  const [brandParam, setBrandParam] = useQueryParam('brand')
  const [sortParam, setSortParam] = useQueryParam('sort', 'price_desc')
  const [boatParam, setBoatParam] = useQueryParam('boat')
  const setParams = useSetQueryParams()

  const productType: ProductType = isProductType(typeParam) ? typeParam : 'yacht'
  const category: BoatCategory = isBoatCategory(categoryParam) ? categoryParam : 'new'
  const sort: BoatSort = (SORT_OPTIONS as readonly string[]).includes(sortParam) ? (sortParam as BoatSort) : 'price_desc'

  const [searchInput, setSearchInput] = useState(search)
  const [panelMode, setPanelMode] = useState<'view' | 'edit' | 'create'>('view')
  const [importModalOpen, setImportModalOpen] = useState(false)

  const selectedBoatId = boatParam || null
  const isPanelOpen = !!selectedBoatId || panelMode === 'create'

  // Debounce search input 300ms → URL param
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 300)
    return () => clearTimeout(timer)
  }, [searchInput, setSearch])

  const view = useMemo(
    () => buildCatalogView(boats ?? [], { productType, category, brand: brandParam, search, sort }),
    [boats, productType, category, brandParam, search, sort],
  )

  const handleTypeChange = useCallback((value: ProductType) => {
    setParams({ type: value, brand: '' })
  }, [setParams])

  const handleCategoryChange = useCallback((value: BoatCategory) => {
    // Picking a category leaves search mode
    setSearchInput('')
    setParams({ category: value, search: '' })
  }, [setParams])

  const handleSelectBrand = useCallback((brand: string) => {
    if (search) {
      const target = resolveBrandLocation(boats ?? [], brand, { productType, category })
      setSearchInput('')
      setParams({ type: target.productType, category: target.category, search: '', brand })
    } else {
      setParams({ brand })
    }
  }, [boats, search, productType, category, setParams])

  const handleSelectBoat = useCallback((id: string) => {
    setBoatParam(id)
    setPanelMode('view')
  }, [setBoatParam])

  const handleClosePanel = useCallback(() => {
    setBoatParam('')
    setPanelMode('view')
  }, [setBoatParam])

  const handleAddBoat = useCallback(() => {
    setBoatParam('')
    setPanelMode('create')
  }, [setBoatParam])

  const handleBoatCreated = useCallback((id: string) => {
    setBoatParam(id)
    setPanelMode('view')
  }, [setBoatParam])

  const handleImportSuccess = useCallback((boatId: string) => {
    setBoatParam(boatId)
    setPanelMode('view')
  }, [setBoatParam])

  const createDefaults = useMemo(
    () => ({ product_type: productType, category, ...(view.activeBrand ? { brand: view.activeBrand } : {}) }),
    [productType, category, view.activeBrand],
  )

  const showModels = view.isSearching || !!view.activeBrand

  const sortOptions: { value: BoatSort; label: string }[] = [
    { value: 'price_desc', label: `${t('boats.sortByPrice')} ${t('boats.sortDesc')}` },
    { value: 'price_asc', label: `${t('boats.sortByPrice')} ${t('boats.sortAsc')}` },
    { value: 'name', label: t('boats.sortByName') },
    { value: 'year', label: t('boats.sortByYear') },
  ]

  const emptyMessage = t('catalog.emptyCategory', { label: t(`catalog.categories.${category}`, { context: productType }) })

  return (
    <div className="space-y-4">
      {/* Header: title + product types | category tiles */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between lg:gap-6">
        <div className="min-w-0 space-y-1">
          <h1 className="font-display text-2xl font-semibold text-navy">
            {t('boats.title')}
          </h1>
          <ProductTypeTabs
            value={productType}
            onChange={handleTypeChange}
            counts={view.typeCounts}
            className="-ml-3 sm:-ml-3.5"
          />
        </div>
        <CatalogCategoryTabs
          value={view.isSearching ? null : category}
          onChange={handleCategoryChange}
          counts={view.categoryCounts}
          productType={productType}
          className="w-full lg:w-auto"
        />
      </div>

      {/* Toolbar: search, sort, admin actions */}
      <div className="flex flex-col gap-2 border-y border-border/60 py-2.5 sm:flex-row sm:items-center">
        <CatalogSearchInput
          value={searchInput}
          onChange={setSearchInput}
          className="w-full sm:max-w-sm sm:flex-1"
        />
        <div className="flex items-center gap-2 sm:ml-auto">
          {showModels && (
            <div className="relative">
              <ArrowUpDown className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <select
                value={sort}
                onChange={(e) => setSortParam(e.target.value)}
                aria-label={t('catalog.sort')}
                className="h-11 appearance-none rounded-lg border border-input bg-white pl-8 pr-6 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary sm:h-9"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}
          {isAdmin && (
            <>
              <button
                type="button"
                onClick={() => setImportModalOpen(true)}
                className={cn(ds.btn.base, ds.btn.md, ds.btn.secondary, 'h-11 flex-1 sm:h-9 sm:flex-none')}
              >
                <FileUp className="h-4 w-4" />
                {t('boats.importFromPriceList')}
              </button>
              <button
                type="button"
                onClick={handleAddBoat}
                className={cn(ds.btn.base, ds.btn.md, ds.btn.primary, 'h-11 flex-1 sm:h-9 sm:flex-none')}
              >
                <Plus className="h-4 w-4" />
                {t('boats.addBoat')}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main content: catalog + side panel */}
      <div className="flex gap-4">
        <div className="min-w-0 flex-1 space-y-5">
          {isLoading ? (
            <SkeletonGrid isPanelOpen={isPanelOpen} />
          ) : error ? (
            <QueryErrorState onRetry={refetch} />
          ) : view.isSearching ? (
            view.searchBrands.length === 0 && view.searchModels.length === 0 ? (
              <EmptyState message={t('catalog.noResults', { query: search })} />
            ) : (
              <>
                {view.searchBrands.length > 0 && (
                  <section>
                    <CatalogSectionHeading title={t('catalog.brands')} count={view.searchBrands.length} />
                    <BrandGrid brands={view.searchBrands} onSelectBrand={handleSelectBrand} isPanelOpen={isPanelOpen} />
                  </section>
                )}
                {view.searchModels.length > 0 && (
                  <section>
                    <CatalogSectionHeading title={t('catalog.models')} count={view.searchModels.length} />
                    <BoatGrid
                      boats={view.searchModels}
                      selectedBoatId={selectedBoatId}
                      onSelectBoat={handleSelectBoat}
                      isPanelOpen={isPanelOpen}
                      showType
                    />
                  </section>
                )}
              </>
            )
          ) : view.activeBrand ? (
            <section className="space-y-2">
              {view.isSingleBrand ? (
                <CatalogSectionHeading title={view.activeBrand} count={view.models.length} />
              ) : (
                <CatalogBreadcrumb
                  brand={view.activeBrand}
                  count={view.models.length}
                  onBack={() => setBrandParam('')}
                />
              )}
              <BoatGrid
                boats={view.models}
                selectedBoatId={selectedBoatId}
                onSelectBoat={handleSelectBoat}
                isPanelOpen={isPanelOpen}
              />
            </section>
          ) : view.brands.length === 0 ? (
            <EmptyState message={emptyMessage} />
          ) : (
            <section>
              <CatalogSectionHeading title={t('catalog.chooseBrand')} count={view.brands.length} />
              <BrandGrid brands={view.brands} onSelectBrand={handleSelectBrand} isPanelOpen={isPanelOpen} />
            </section>
          )}
        </div>

        {/* Side panel — desktop */}
        {isPanelOpen && (
          <div className="hidden w-[480px] shrink-0 lg:block">
            <div className="sticky top-0 h-[calc(100vh-8rem)] overflow-hidden rounded-lg border border-border bg-white">
              <BoatDetailPanel
                key={selectedBoatId ?? 'create'}
                boatId={selectedBoatId}
                mode={panelMode}
                onClose={handleClosePanel}
                onModeChange={setPanelMode}
                onBoatCreated={handleBoatCreated}
                createDefaults={createDefaults}
              />
            </div>
          </div>
        )}
      </div>

      {/* Side panel — mobile overlay */}
      {isPanelOpen && (
        <div className="lg:hidden">
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={handleClosePanel}
          />
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white shadow-xl">
            <BoatDetailPanel
              key={`mobile-${selectedBoatId ?? 'create'}`}
              boatId={selectedBoatId}
              mode={panelMode}
              onClose={handleClosePanel}
              onModeChange={setPanelMode}
              onBoatCreated={handleBoatCreated}
              createDefaults={createDefaults}
            />
          </div>
        </div>
      )}

      {/* Price Import Modal */}
      <PriceImportModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        onSuccess={handleImportSuccess}
        defaultProductType={productType}
        defaultCategory={category}
      />
    </div>
  )
}

function SkeletonGrid({ isPanelOpen }: { isPanelOpen: boolean }) {
  return (
    <div className={cn(
      'grid gap-2.5',
      isPanelOpen
        ? 'grid-cols-2 xl:grid-cols-3'
        : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
    )}>
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-32 animate-pulse rounded-xl bg-muted sm:h-36" />
      ))}
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className={ds.empty.container}>
      <div className="mb-4 rounded-full bg-muted p-4">
        <Search className={ds.empty.icon} />
      </div>
      <p className={ds.empty.title}>{message}</p>
    </div>
  )
}
