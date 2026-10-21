import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, UserPlus, Building2, User, Check } from 'lucide-react'
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

/** Trim, and treat placeholder values such as "." or "-" as empty. */
const clean = (value: string | null | undefined): string => {
  const v = value?.trim() ?? ''
  return /^[\s.\-·@]*$/.test(v) ? '' : v
}

export const ClientSelector = ({ onSelectCompany, onAddNew, selectedCompanyId, multiSelect, selectedCompanyIds, onToggleCompany }: ClientSelectorProps) => {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const { data: companies, isLoading } = useCompanies()
  const [categoryFilter, setCategoryFilter] = useState<ClientCategory | 'all'>('all')

  const rows = useMemo(
    () =>
      [...(companies ?? [])]
        .sort((a, b) => a.name.localeCompare(b.name, 'hr'))
        .map((company) => {
          const contact = company.contacts.find((c) => c.is_primary) ?? company.contacts[0]
          const name = clean(company.name)
          const contactName = clean(contact?.full_name)
          return {
            company,
            name,
            // Individuals are stored with the person's name as company name; don't repeat it.
            contactName: contactName && contactName.toLowerCase() !== name.toLowerCase() ? contactName : '',
            email: clean(contact?.email) || clean(company.email),
            phone: clean(contact?.phone) || clean(company.phone),
            location: [clean(company.city), clean(company.country)].filter(Boolean).join(', '),
            quotes: company.quotes?.[0]?.count ?? 0,
          }
        }),
    [companies],
  )

  const categoryCounts = useMemo(() => {
    const counts: Record<ClientCategory | 'all', number> = { all: rows.length, vip: 0, regular: 0, prospect: 0 }
    for (const r of rows) counts[r.company.client_category as ClientCategory] += 1
    return counts
  }, [rows])

  const filtered = useMemo(() => {
    const byCategory = categoryFilter === 'all'
      ? rows
      : rows.filter((r) => r.company.client_category === categoryFilter)
    const q = search.trim().toLowerCase()
    if (!q) return byCategory
    return byCategory.filter((r) =>
      [r.name, r.email, r.phone, r.location, ...r.company.contacts.flatMap((c) => [c.full_name, c.email])]
        .some((v) => v?.toLowerCase().includes(q)),
    )
  }, [rows, search, categoryFilter])

  const isSelected = (id: string): boolean =>
    multiSelect ? selectedCompanyIds?.includes(id) ?? false : id === selectedCompanyId

  const handleSelect = (company: CompanyWithContacts) =>
    multiSelect && onToggleCompany ? onToggleCompany(company) : onSelectCompany(company)

  return (
    <div className="space-y-2">
      {/* Search + category filter + add */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center">
        <div className="relative md:w-80 lg:w-96">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder={t('configurator.searchClient')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="flex items-center gap-1 overflow-x-auto">
          {CATEGORY_FILTERS.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              aria-pressed={categoryFilter === cat}
              className={cn(
                'inline-flex h-8 shrink-0 items-center gap-1 rounded-full border px-3 text-xs font-medium transition-colors',
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
        <div className="flex items-center gap-3 md:ml-auto">
          {!isLoading && (
            <span className="text-xs tabular-nums text-muted-foreground">
              {t('configurator.clientsCount', { shown: String(filtered.length), total: String(rows.length) })}
            </span>
          )}
          <button
            type="button"
            onClick={onAddNew}
            className="ml-auto inline-flex h-10 items-center gap-1.5 rounded-md bg-navy px-3 text-sm font-medium text-white transition-colors hover:bg-navy-light md:ml-0"
          >
            <UserPlus className="h-4 w-4" />
            {t('configurator.newClient')}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-1 rounded-lg border border-border p-2">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="h-9 animate-pulse rounded bg-muted" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-10 text-center">
          <Building2 className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">{t('configurator.noClientsFound')}</p>
        </div>
      ) : (
        <div className="max-h-[max(18rem,calc(100dvh-24rem))] overflow-auto overscroll-contain rounded-lg border border-border bg-card">
          <table className="w-full table-fixed border-collapse text-sm">
            <thead className="sticky top-0 z-10 hidden bg-muted/95 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground backdrop-blur md:table-header-group">
              <tr>
                <th className="w-11 py-2 pl-3" aria-hidden />
                <th className="py-2 pr-3 font-semibold">{t('configurator.colClient')}</th>
                <th className="w-[26%] py-2 pr-3 font-semibold">{t('clients.email')}</th>
                <th className="hidden w-40 py-2 pr-3 font-semibold lg:table-cell">{t('clients.phone')}</th>
                <th className="hidden w-48 py-2 pr-3 font-semibold xl:table-cell">{t('configurator.colLocation')}</th>
                <th className="w-28 py-2 pr-3 font-semibold">{t('clients.category')}</th>
                <th className="w-20 py-2 pr-3 text-right font-semibold">{t('clients.quotesCount')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const selected = isSelected(r.company.id)
                const Icon = r.company.client_type === 'individual' ? User : Building2
                return (
                  <tr
                    key={r.company.id}
                    onClick={() => handleSelect(r.company)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        handleSelect(r.company)
                      }
                    }}
                    tabIndex={0}
                    aria-selected={selected}
                    className={cn(
                      'cursor-pointer border-t border-border/60 outline-none transition-colors first:border-t-0 focus-visible:bg-primary/5',
                      selected ? 'bg-gold/10 hover:bg-gold/15' : 'hover:bg-muted/50',
                    )}
                  >
                    <td className="w-11 py-1.5 pl-3 pr-2 align-middle">
                      <span
                        className={cn(
                          'flex h-5 w-5 items-center justify-center rounded-full border transition-colors',
                          multiSelect && 'rounded',
                          selected ? 'border-gold bg-gold text-white' : 'border-muted-foreground/30',
                        )}
                      >
                        {selected && <Check className="h-3 w-3" />}
                      </span>
                    </td>
                    <td className="min-w-0 py-1.5 pr-3 align-middle">
                      <div className="flex min-h-7 min-w-0 items-center gap-2">
                        <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span className="truncate font-medium text-foreground">{r.name || '—'}</span>
                        <span className="shrink-0 md:hidden">
                          <ClientCategoryBadge category={r.company.client_category as ClientCategory} />
                        </span>
                      </div>
                      {(r.contactName || r.email) && (
                        <p className="truncate pl-5.5 text-xs text-muted-foreground md:hidden">
                          {[r.contactName, r.email].filter(Boolean).join(' · ')}
                        </p>
                      )}
                      {r.contactName && (
                        <p className="hidden truncate pl-5.5 text-xs text-muted-foreground md:block">{r.contactName}</p>
                      )}
                    </td>
                    <td className="hidden truncate py-1.5 pr-3 align-middle text-muted-foreground md:table-cell">
                      {r.email || '—'}
                    </td>
                    <td className="hidden truncate py-1.5 pr-3 align-middle tabular-nums text-muted-foreground lg:table-cell">
                      {r.phone || '—'}
                    </td>
                    <td className="hidden truncate py-1.5 pr-3 align-middle text-muted-foreground xl:table-cell">
                      {r.location || '—'}
                    </td>
                    <td className="hidden py-1.5 pr-3 align-middle md:table-cell">
                      <ClientCategoryBadge category={r.company.client_category as ClientCategory} />
                    </td>
                    <td className="hidden py-2 pr-3 text-right align-middle tabular-nums text-muted-foreground md:table-cell">
                      {r.quotes}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
