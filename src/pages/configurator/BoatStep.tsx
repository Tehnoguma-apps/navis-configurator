import { useState, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, X, CalendarDays } from 'lucide-react'
import { QueryErrorState } from '@/components/ui/QueryErrorState'
import { cn } from '@/lib/utils'
import { ds } from '@/lib/styles'
import {
  buildCatalogView,
  getBoatCategory,
  getProductType,
  matchesBoatSearch,
  resolveBrandLocation,
  sortBoats,
} from '@/lib/catalog'
import { useDebounce } from '@/hooks/useDebounce'
import { useBoats, useBoat } from '@/hooks/useBoats'
import { useActiveTemplateGroupIds } from '@/hooks/useTemplateGroups'
import { useConfiguratorStore } from '@/stores/configurator-store'
import { ProductTypeTabs } from '@/components/catalog/ProductTypeTabs'
import { CatalogCategoryTabs } from '@/components/catalog/CatalogCategoryTabs'
import { CatalogSearchInput } from '@/components/catalog/CatalogSearchInput'
import { CatalogBreadcrumb } from '@/components/catalog/CatalogBreadcrumb'
import { CatalogSectionHeading } from '@/components/catalog/CatalogSectionHeading'
import { BrandGrid } from '@/components/catalog/BrandGrid'
import { ConfiguratorBoatCard } from '@/components/configurator/ConfiguratorBoatCard'
import type { Boat, BoatCategory, ProductType } from '@/types'

export default function BoatStep() {
  const { t } = useTranslation()
  const { selectedBoat, setBoat, setStep, templateGroupId, setTemplateGroupId } = useConfiguratorStore()

  const { data: boats, isLoading, error: boatsError, refetch: refetchBoats } = useBoats()
  const { data: boatDetails } = useBoat(selectedBoat?.id)
  const { data: activeGroups } = useActiveTemplateGroupIds()

  const selectedTemplate = activeGroups?.find((g) => g.id === templateGroupId)
  const templateBoatIds = useMemo(
    () => selectedTemplate
      ? new Set(selectedTemplate.boats.map((b) => b.boat_id))
      : null,
    [selectedTemplate],
  )

  // Coming back to Step 1 reopens the selected product's type / category / brand.
  const [productType, setProductType] = useState<ProductType>(() => getProductType(selectedBoat))
  const [category, setCategory] = useState<BoatCategory>(() => getBoatCategory(selectedBoat))
  const [brand, setBrand] = useState<string>(() => selectedBoat?.brand ?? '')
  const [searchInput, setSearchInput] = useState('')
  const debouncedSearch = useDebounce(searchInput, 300)

  const view = useMemo(
    () => buildCatalogView(boats ?? [], {
      productType,
      category,
      brand,
      search: debouncedSearch,
      sort: 'price_desc',
    }),
    [boats, productType, category, brand, debouncedSearch],
  )

  // Template ("Start from Template") mode: flat list of the template's products.
  const templateBoats = useMemo(() => {
    if (!templateBoatIds || !boats) return []
    const inTemplate = boats.filter((b) => templateBoatIds.has(b.id))
    return sortBoats(
      debouncedSearch ? inTemplate.filter((b) => matchesBoatSearch(b, debouncedSearch)) : inTemplate,
      'price_desc',
    )
  }, [boats, templateBoatIds, debouncedSearch])

  // setBoat() resets templateGroupId in the store, so restore it when picking
  // a product inside a template ("Start from Template").
  const handleSelectBoat = useCallback((boat: Boat) => {
    const activeTemplateId = templateGroupId
    setBoat(selectedBoat?.id === boat.id ? null : boat)
    if (activeTemplateId) setTemplateGroupId(activeTemplateId)
  }, [selectedBoat?.id, setBoat, templateGroupId, setTemplateGroupId])

  const handleTypeChange = (value: ProductType) => {
    setProductType(value)
    setBrand('')
  }

  const handleCategoryChange = (value: BoatCategory) => {
    setSearchInput('')
    setCategory(value)
  }

  const handleSelectBrand = (value: string) => {
    if (debouncedSearch) {
      const target = resolveBrandLocation(boats ?? [], value, { productType, category })
      setProductType(target.productType)
      setCategory(target.category)
      setSearchInput('')
    }
    setBrand(value)
  }

  const specs = boatDetails?.specs?.slice(0, 3) ?? []
  const configure = () => setStep(2)

  const renderModels = (list: Boat[], showType = false) => (
    <div className="grid grid-cols-2 gap-2 xl:grid-cols-3">
      {list.map((boat) => (
        <ConfiguratorBoatCard
          key={boat.id}
          boat={boat}
          isSelected={selectedBoat?.id === boat.id}
          onSelect={handleSelectBoat}
          specs={selectedBoat?.id === boat.id ? specs : []}
          onConfigure={configure}
          showType={showType}
        />
      ))}
    </div>
  )

  const renderContent = () => {
    if (isLoading) return <SkeletonGrid />
    if (boatsError) return <QueryErrorState onRetry={refetchBoats} />

    if (templateBoatIds) {
      return templateBoats.length === 0
        ? <EmptyResult message={t('boats.noBoats')} />
        : renderModels(templateBoats, true)
    }

    if (view.isSearching) {
      if (view.searchBrands.length === 0 && view.searchModels.length === 0) {
        return <EmptyResult message={t('catalog.noResults', { query: debouncedSearch })} />
      }
      return (
        <div className="space-y-4">
          {view.searchBrands.length > 0 && (
            <section>
              <CatalogSectionHeading title={t('catalog.brands')} count={view.searchBrands.length} />
              <BrandGrid brands={view.searchBrands} onSelectBrand={handleSelectBrand} size="sm" />
            </section>
          )}
          {view.searchModels.length > 0 && (
            <section>
              <CatalogSectionHeading title={t('catalog.models')} count={view.searchModels.length} />
              {renderModels(view.searchModels, true)}
            </section>
          )}
        </div>
      )
    }

    if (view.activeBrand) {
      return (
        <section className="space-y-1.5">
          {view.isSingleBrand ? (
            <CatalogSectionHeading title={view.activeBrand} count={view.models.length} />
          ) : (
            <CatalogBreadcrumb brand={view.activeBrand} count={view.models.length} onBack={() => setBrand('')} />
          )}
          {renderModels(view.models)}
        </section>
      )
    }

    if (view.brands.length === 0) {
      return (
        <EmptyResult
          message={t('catalog.emptyCategory', { label: t(`catalog.categories.${category}`, { context: productType }) })}
        />
      )
    }

    return (
      <section>
        <CatalogSectionHeading title={t('catalog.chooseBrand')} count={view.brands.length} />
        <BrandGrid brands={view.brands} onSelectBrand={handleSelectBrand} size="sm" />
      </section>
    )
  }

  return (
    <div className="space-y-3">
      {/* Template selector */}
      {activeGroups && activeGroups.length > 0 && (
        <div>
          {templateGroupId && selectedTemplate ? (
            <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2">
              <CalendarDays className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium text-primary">
                {selectedTemplate.name}
              </span>
              <span className="text-[11px] text-muted-foreground">
                ({selectedTemplate.boats.length} {t('templateGroups.boats').toLowerCase()})
              </span>
              <button
                type="button"
                onClick={() => {
                  setTemplateGroupId(null)
                  setBoat(null)
                }}
                aria-label={t('common.close')}
                className="ml-auto flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:h-6 sm:w-6"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <select
              value=""
              onChange={(e) => {
                if (e.target.value) {
                  setBoat(null)
                  setTemplateGroupId(e.target.value)
                }
              }}
              className={cn(ds.input.select, 'sm:w-auto')}
            >
              <option value="">{t('templateGroups.startFromTemplate')}</option>
              {activeGroups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name} ({group.valid_from} → {group.valid_until})
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* Type + category + search */}
      {templateBoatIds ? (
        <CatalogSearchInput value={searchInput} onChange={setSearchInput} className="w-full sm:max-w-xs" />
      ) : (
        <div className="flex flex-col gap-2 xl:flex-row xl:items-center">
          <ProductTypeTabs
            value={productType}
            onChange={handleTypeChange}
            counts={view.typeCounts}
            size="sm"
            className="-ml-3 sm:-ml-3.5"
          />
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center xl:ml-auto">
            <CatalogCategoryTabs
              value={view.isSearching ? null : category}
              onChange={handleCategoryChange}
              counts={view.categoryCounts}
              variant="compact"
              className="w-full sm:w-auto"
            />
            <CatalogSearchInput value={searchInput} onChange={setSearchInput} className="w-full sm:w-64" />
          </div>
        </div>
      )}

      {renderContent()}
    </div>
  )
}

function EmptyResult({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Search className="mb-2 h-6 w-6 text-muted-foreground/50" />
      <p className="text-xs text-muted-foreground">{message}</p>
    </div>
  )
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-24 animate-pulse rounded-xl bg-muted/80" />
      ))}
    </div>
  )
}
