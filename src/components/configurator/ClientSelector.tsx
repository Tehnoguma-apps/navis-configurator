import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, UserPlus, Building2, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCompanies } from '@/hooks/useCompanies'
import { ClientCategoryBadge } from '@/components/clients/ClientCategoryBadge'
import type { CompanyWithContacts, ClientCategory } from '@/types'

const CATEGORY_FILTERS: (ClientCategory | 'all')[] = ['all', 'vip', 'regular', 'prospect']

interface ClientSelectorProps {
  onSelectCompany: (company: CompanyWithContacts) => void
  onAddNew: () => void
  selectedCompanyId?: string
  multiSelect?: boolean
  selectedCompanyIds?: string[]
  onToggleCompany?: (company: CompanyWithContacts) => void
}

export const ClientSelector = ({ onSelectCompany, onAddNew, selectedCompanyId, multiSelect, selectedCompanyIds, onToggleCompany }: ClientSelectorProps) => {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const { data: companies, isLoading } = useCompanies()

  const [categoryFilter, setCategoryFilter] = useState<ClientCategory | 'all'>('all')

  const sorted = useMemo(
    () => [...(companies ?? [])].sort((a, b) => a.name.localeCompare(b.name, 'hr')),
    [companies],
  )

  const categoryCounts = useMemo(() => {
    const counts: Record<ClientCategory | 'all', number> = { all: sorted.length, vip: 0, regular: 0, prospect: 0 }
    for (const c of sorted) counts[c.client_category as ClientCategory] += 1
    return counts
  }, [sorted])

  const filtered = useMemo(() => {
    const byCategory = categoryFilter === 'all'
      ? sorted
      : sorted.filter((c) => c.client_category === categoryFilter)
    if (!search.trim()) return byCategory
    const q = search.toLowerCase()
    return byCategory.filter((c) => {
      if (c.name.toLowerCase().includes(q)) return true
      if (c.email?.toLowerCase().includes(q)) return true
      return c.contacts.some(
        (ct) =>
          ct.full_name?.toLowerCase().includes(q) ||
          ct.email?.toLowerCase().includes(q)
      )
    })
  }, [sorted, search, categoryFilter])

  return (
    <div className="space-y-2">
      {/* Search + Add button */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder={t('configurator.searchClient')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-full rounded-md border border-input bg-background pl-8 pr-3 text-xs outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
        <button
          type="button"
          onClick={onAddNew}
          className="inline-flex items-center gap-1.5 rounded-md bg-navy px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-navy-light"
        >
          <UserPlus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{t('configurator.newClient')}</span>
        </button>
      </div>

      {/* Category filter + count */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1">
          {CATEGORY_FILTERS.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              aria-pressed={categoryFilter === cat}
              className={cn(
                'inline-flex h-7 items-center gap-1 rounded-full border px-2.5 text-[11px] font-medium transition-colors',
                categoryFilter === cat
                  ? 'border-navy bg-navy text-white'
                  : 'border-border text-muted-foreground hover:border-navy/40 hover:text-foreground',
              )}
            >
              {cat === 'all' ? t('common.all') : t(`clients.${cat}`)}
              <span className={cn('tabular-nums', categoryFilter === cat ? 'text-white/70' : 'text-muted-foreground/70')}>
                {categoryCounts[cat]}
              </span>
            </button>
          ))}
        </div>
        {!isLoading && (
          <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
            {t('configurator.clientsCount', { shown: String(filtered.length), total: String(sorted.length) })}
          </span>
        )}
      </div>

      {/* Client list */}
      {isLoading ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-md bg-muted" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-8 text-center">
          <Building2 className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            {t('configurator.noClientsFound')}
          </p>
        </div>
      ) : (
        <div className="max-h-[26rem] overflow-y-auto overscroll-contain rounded-md border border-border/60 p-1.5">
          <div className="grid gap-1.5 sm:grid-cols-2">
            {filtered.map((company) => {
              const primaryContact = company.contacts.find((c) => c.is_primary) ?? company.contacts[0]
              const isSelected = multiSelect
                ? selectedCompanyIds?.includes(company.id) ?? false
                : company.id === selectedCompanyId

              return (
                <button
                  key={company.id}
                  type="button"
                  onClick={() => multiSelect && onToggleCompany ? onToggleCompany(company) : onSelectCompany(company)}
                  className={cn(
                    'flex min-h-11 items-start gap-2.5 rounded-md border px-3 py-2 text-left transition-colors duration-150',
                    isSelected
                      ? 'border-gold/60 bg-gold/5 ring-2 ring-gold/20'
                      : 'border-border bg-background hover:border-navy/30 hover:bg-muted/40',
                  )}
                >
                  {multiSelect ? (
                    <div className={cn(
                      'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-all duration-150',
                      isSelected
                        ? 'border-gold bg-gold text-white'
                        : 'border-muted-foreground/30'
                    )}>
                      {isSelected && <Check className="h-3.5 w-3.5" />}
                    </div>
                  ) : (
                    <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-xs font-semibold text-foreground">
                        {company.name}
                      </span>
                      <ClientCategoryBadge category={company.client_category as ClientCategory} />
                    </div>
                    {primaryContact && (
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {primaryContact.full_name}
                        {primaryContact.email ? ` · ${primaryContact.email}` : ''}
                      </p>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
