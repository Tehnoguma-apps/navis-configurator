import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from '@react-pdf/renderer'
import { Fragment } from 'react'
import { formatPrice, formatDate } from '@/lib/formatters'
import { getPdfLabels, type MeasuredPartnerLogo } from '@/lib/pdf-generator'
import { calculateVat } from '@/lib/pricing'
import type { QuoteWithDetails, CompanySettings, BoatSpec, PartnerLogo } from '@/types'

interface PDFDetailedTemplateProps {
  quote: QuoteWithDetails
  settings: CompanySettings
  barcodeDataUrl?: string | null
  boatSpecs?: BoatSpec[]
  partnerLogos?: (PartnerLogo & Partial<Pick<MeasuredPartnerLogo, 'aspectRatio'>>)[]
}

const NAVY = '#1a1a2e'
const GOLD = '#c9a961'
const DISCOUNT_RED = '#c0392b'
const TEXT_DARK = '#1a1a1a'
const TEXT_MUTED = '#333333'
const TEXT_SECONDARY = '#333333'
const TEXT_BODY = '#2a2a2a'
const BG_LIGHT = '#f7f8fa'
const BORDER_LIGHT = '#e8e9ec'
const TOTAL_BG = '#2d3561'

const s = StyleSheet.create({
  // ── Page ──
  page: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 8.5,
    paddingTop: 28,
    paddingBottom: 58,
    paddingHorizontal: 36,
    color: TEXT_DARK,
    display: 'flex',
    flexDirection: 'column',
  },

  // ── Footer (fixed at bottom of every page) ──
  footerWrap: {
    position: 'absolute',
    bottom: 6,
    left: 36,
    right: 36,
    alignItems: 'center',
  },
  footerText: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 5.5,
    color: TEXT_MUTED,
    textAlign: 'center',
    lineHeight: 1.6,
  },
  footerBold: {
    fontWeight: 700,
  },

  // ── Partner logos row ──
  partnerLogosRow: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  partnerLogosRowSingle: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 0.75,
    borderBottomColor: NAVY,
  },
  logoWrap: {
    alignItems: 'flex-start',
  },
  logo: {
    height: 62,
    objectFit: 'contain',
  },
  logoFallback: {
    fontFamily: 'Playfair Display',
    fontSize: 14,
    fontWeight: 700,
    color: NAVY,
    letterSpacing: 1.5,
  },
  logoTag: {
    fontSize: 5.5,
    textTransform: 'uppercase',
    letterSpacing: 2.5,
    color: TEXT_MUTED,
    marginTop: 1,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  docTitle: {
    fontFamily: 'Playfair Display',
    fontSize: 13,
    fontWeight: 700,
    color: NAVY,
    marginBottom: 2,
  },
  quoteNum: {
    fontSize: 8.5,
    fontWeight: 700,
    color: NAVY,
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 0.5,
  },
  metaLabel: {
    fontSize: 7,
    color: TEXT_SECONDARY,
  },
  metaVal: {
    fontSize: 7,
    color: TEXT_DARK,
    fontWeight: 500,
  },

  // ── Info columns (customer + offer made by) ──
  infoRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  infoCard: {
    flex: 1,
    borderLeftWidth: 2,
    borderLeftColor: GOLD,
    paddingLeft: 10,
    paddingVertical: 2,
  },
  infoLabel: {
    fontSize: 5.5,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: TEXT_SECONDARY,
    marginBottom: 3,
  },
  infoName: {
    fontFamily: 'Playfair Display',
    fontSize: 10,
    fontWeight: 500,
    color: NAVY,
    marginBottom: 1.5,
  },
  infoDetail: {
    fontSize: 7.5,
    color: TEXT_BODY,
    lineHeight: 1.45,
  },

  // ── Vessel block ──
  vessel: {
    backgroundColor: BG_LIGHT,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  vesselName: {
    fontFamily: 'Playfair Display',
    fontSize: 15,
    fontWeight: 700,
    color: NAVY,
  },
  vesselRight: {
    alignItems: 'flex-end',
  },
  priceTag: {
    fontSize: 5.5,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: TEXT_SECONDARY,
    marginBottom: 0.5,
  },
  priceVal: {
    fontSize: 11.5,
    fontWeight: 700,
    color: NAVY,
  },

  // ── Specs (compact 2-col key-value) ──
  specsContainer: {
    borderTopWidth: 1.5,
    borderTopColor: GOLD,
    backgroundColor: BG_LIGHT,
    borderRadius: 2,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 12,
    flexDirection: 'row',
    gap: 20,
  },
  specsCol: {
    flex: 1,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingVertical: 2,
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER_LIGHT,
  },
  specLbl: {
    fontSize: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: TEXT_SECONDARY,
  },
  specVal: {
    fontSize: 7.5,
    fontWeight: 700,
    color: NAVY,
    textAlign: 'right',
  },

  // ── Section divider ──
  secRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
    marginTop: 2,
  },
  secText: {
    fontSize: 6.5,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 1.8,
    color: NAVY,
  },
  secLine: {
    flex: 1,
    height: 0.75,
    backgroundColor: GOLD,
  },

  // ── Standard equipment (bulleted list, 3 columns, grouped by category) ──
  stdWrap: {
    marginBottom: 12,
  },
  stdCat: {
    fontSize: 6.5,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: NAVY,
    paddingBottom: 2,
    marginTop: 5,
    marginBottom: 2,
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER_LIGHT,
  },
  stdRow: {
    flexDirection: 'row',
    gap: 10,
  },
  stdCell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 1,
  },
  stdBullet: {
    width: 2.2,
    height: 2.2,
    borderRadius: 1.1,
    backgroundColor: GOLD,
    marginTop: 3.2,
    marginRight: 4,
  },
  stdText: {
    flex: 1,
    fontSize: 6.8,
    color: TEXT_BODY,
    lineHeight: 1.3,
  },

  // ── Equipment table ──
  tHead: {
    flexDirection: 'row',
    borderBottomWidth: 1.5,
    borderBottomColor: NAVY,
    paddingBottom: 4,
    paddingTop: 2,
    backgroundColor: '#ffffff',
  },
  tHeadText: {
    fontSize: 6,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    color: NAVY,
  },
  catHeader: {
    paddingVertical: 3,
    paddingHorizontal: 6,
    backgroundColor: '#eef0f4',
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER_LIGHT,
  },
  catHeaderText: {
    fontSize: 6.5,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: NAVY,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 3.5,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f0f0f2',
    alignItems: 'center',
  },
  cellName: {
    fontSize: 8,
    fontWeight: 500,
    color: TEXT_DARK,
  },
  cellPrice: {
    fontSize: 8,
    textAlign: 'right',
    color: TEXT_BODY,
  },
  cellDisc: {
    fontSize: 7.5,
    color: DISCOUNT_RED,
    textAlign: 'right',
  },
  cellNet: {
    fontSize: 8,
    fontWeight: 700,
    textAlign: 'right',
    color: TEXT_DARK,
  },

  // ── Pricing summary (unified TOTAL / DISCOUNT + grand total box) ──
  pricingWrap: {
    flexDirection: 'row',
    marginTop: 8,
    marginBottom: 14,
    borderTopWidth: 1.5,
    borderTopColor: NAVY,
  },
  pricingSummary: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: BG_LIGHT,
    justifyContent: 'center',
  },
  pricingColTotal: {
    width: 155,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: TOTAL_BG,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pSumRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingVertical: 2.5,
  },
  pSumLbl: {
    fontSize: 8,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    color: TEXT_SECONDARY,
  },
  pSumVal: {
    fontSize: 9.5,
    fontWeight: 700,
    color: TEXT_DARK,
  },
  pSumDiscLbl: {
    fontSize: 8,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    color: DISCOUNT_RED,
  },
  pSumDiscVal: {
    fontSize: 9.5,
    fontWeight: 700,
    color: DISCOUNT_RED,
  },
  pTotalLbl: {
    fontSize: 8,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: GOLD,
    marginBottom: 3,
  },
  pTotalVal: {
    fontFamily: 'Playfair Display',
    fontSize: 16,
    fontWeight: 700,
    color: '#ffffff',
  },
  pSumDivider: {
    borderTopWidth: 0.5,
    borderTopColor: '#d5d7dd',
    marginVertical: 3,
  },
  pSumNetLbl: {
    fontSize: 8,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    color: NAVY,
  },
  pSumNetVal: {
    fontSize: 9.5,
    fontWeight: 700,
    color: NAVY,
  },
  pSumVatLbl: {
    fontSize: 7.5,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    color: TEXT_SECONDARY,
  },
  pSumVatVal: {
    fontSize: 9,
    color: TEXT_DARK,
  },
  totalsNotes: {
    marginTop: -8,
    marginBottom: 12,
    paddingHorizontal: 2,
    gap: 2,
  },
  smallNote: {
    fontSize: 7,
    color: TEXT_BODY,
  },
  tbqNote: {
    fontSize: 7,
    color: '#92400e',
  },
  footnote: {
    fontSize: 6.5,
    color: TEXT_SECONDARY,
    marginTop: 14,
  },

  // ── Notes ──
  noteText: {
    fontSize: 7.5,
    color: TEXT_BODY,
    lineHeight: 1.45,
    marginBottom: 10,
  },

  // ── Payment ──
  paySection: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 10,
  },
  payLeft: {
    flex: 1,
    flexDirection: 'row',
    gap: 20,
  },
  payBlock: {
    flex: 1,
  },
  payTitle: {
    fontSize: 6,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: NAVY,
    fontWeight: 700,
    marginBottom: 4,
  },
  payText: {
    fontSize: 7.5,
    lineHeight: 1.45,
    color: TEXT_DARK,
  },
  payBold: {
    fontSize: 7.5,
    fontWeight: 700,
    color: TEXT_DARK,
  },
  payBankDetail: {
    fontSize: 7.5,
    fontWeight: 700,
    color: TEXT_DARK,
  },
  barcodeWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
    backgroundColor: '#f5f5f5',
    borderRadius: 2,
  },
  barcodeImg: {
    width: 110,
    height: 36,
  },
  qrImg: {
    width: 62,
    height: 62,
  },
  barcodeLbl: {
    fontSize: 6,
    color: TEXT_MUTED,
    marginTop: 3,
    textAlign: 'center',
  },

  // ── Terms ──
  termsWrap: {
    paddingTop: 6,
    borderTopWidth: 0.5,
    borderTopColor: '#ddd',
    marginBottom: 10,
  },
  termsTitle: {
    fontSize: 6,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: NAVY,
    fontWeight: 700,
    marginBottom: 3,
  },
  termsBody: {
    fontSize: 6.5,
    color: TEXT_BODY,
    lineHeight: 1.45,
  },

  // ── Signatures ──
  sigWrap: {
    marginTop: 16,
  },
  sigRow: {
    flexDirection: 'row',
    gap: 40,
  },
  sigCol: {
    flex: 1,
  },
  sigLine: {
    borderBottomWidth: 0.75,
    borderBottomColor: '#cccccc',
    height: 28,
    marginBottom: 4,
  },
  sigLabel: {
    fontSize: 6.5,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: TEXT_SECONDARY,
  },
  sigName: {
    fontSize: 7,
    color: TEXT_DARK,
    marginTop: 2,
  },
})

function splitHalf<T>(items: T[]): [T[], T[]] {
  const mid = Math.ceil(items.length / 2)
  return [items.slice(0, mid), items.slice(mid)]
}

function chunk<T>(items: T[], size: number): T[][] {
  const rows: T[][] = []
  for (let i = 0; i < items.length; i += size) rows.push(items.slice(i, i + size))
  return rows
}

/**
 * Standard equipment is often imported as one long comma-separated string
 * ("STANDARD COLORS, Stern bimini, ..."). Split it into separate entries on
 * top-level ", " only: commas inside brackets and decimal commas ("2,5 kW")
 * stay intact.
 */
function splitStandardItem(name: string): string[] {
  const parts: string[] = []
  let depth = 0
  let current = ''
  for (let i = 0; i < name.length; i++) {
    const ch = name[i]
    if (ch === '(' || ch === '[') depth++
    else if ((ch === ')' || ch === ']') && depth > 0) depth--
    const next = name[i + 1]
    if (ch === ',' && depth === 0 && (next === undefined || /\s/.test(next))) {
      parts.push(current)
      current = ''
      continue
    }
    current += ch
  }
  parts.push(current)
  return parts.map((p) => p.trim()).filter((p) => p.length > 0)
}

const STD_COLUMNS = 3

export function PDFDetailedTemplate({
  quote,
  settings,
  barcodeDataUrl,
  boatSpecs,
  partnerLogos,
}: PDFDetailedTemplateProps) {
  const lang = (quote.language === 'hr' ? 'hr' : 'en') as 'hr' | 'en'
  const labels = getPdfLabels(lang)
  const locale = lang === 'hr' ? 'hr-HR' : 'en-GB'

  const boat = quote.boat
  const company = quote.company
  const createdByProfile = quote.created_by_profile as { id: string; full_name: string | null; email?: string } | null

  const validUntilDate = new Date(quote.created_at)
  validUntilDate.setDate(validUntilDate.getDate() + 30)
  const validUntil = formatDate(validUntilDate.toISOString(), locale)

  // Separate standard vs optional equipment
  const standardByCategory = new Map<string, string[]>()
  const optionalByCategory = new Map<string, QuoteWithDetails['items']>()

  for (const item of quote.items) {
    const catName = lang === 'hr'
      ? (item.category_name_hr ?? 'Ostalo')
      : (item.category_name_en ?? 'Other')
    const itemName = lang === 'hr' ? (item.name_hr ?? '—') : (item.name_en ?? '—')
    const isStandard = item.item_type === 'equipment_standard'

    if (isStandard) {
      const existing = standardByCategory.get(catName) ?? []
      existing.push(...splitStandardItem(itemName))
      standardByCategory.set(catName, existing)
    } else {
      const existing = optionalByCategory.get(catName) ?? []
      existing.push(item)
      optionalByCategory.set(catName, existing)
    }
  }

  const hasStandard = standardByCategory.size > 0
  const hasOptional = optionalByCategory.size > 0
  const hasTbq = quote.items.some((i) => i.is_price_on_request)

  // Top specs — filter out price list region and prices note
  const excludedLabels = ['price list region', 'prices note', 'regija cjenika', 'napomena o cijenama']
  const topSpecs = boatSpecs
    ? [...boatSpecs]
        .filter(spec => {
          const lbl = (spec.label_hr ?? spec.label_en ?? '').toLowerCase()
          const lblEn = (spec.label_en ?? spec.label_hr ?? '').toLowerCase()
          if (excludedLabels.some(ex => lbl.includes(ex) || lblEn.includes(ex))) return false
          return spec.show_in_pdf !== false
        })
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    : []

  // Delivery terms
  const deliveryTermsText = lang === 'hr'
    ? (quote.delivery_terms_hr ?? quote.delivery_terms_en ?? '')
    : (quote.delivery_terms_en ?? quote.delivery_terms_hr ?? '')

  // Payment terms (quote-level override, falls back to settings)
  const paymentTermsText = lang === 'hr'
    ? (quote.payment_terms_hr ?? quote.payment_terms_en ?? '')
    : (quote.payment_terms_en ?? quote.payment_terms_hr ?? '')

  // Pricing — boat and equipment combined per client request (no split in summary)
  const boatBasePrice = Number(quote.boat_base_price ?? 0)
  const boatDiscountAmount = Number(quote.boat_discount ?? 0)
  const equipmentSubtotal = Number(quote.equipment_subtotal ?? 0)
  const equipmentDiscountAmount = Number(quote.equipment_discount ?? 0)
  const totalBeforeDiscount = boatBasePrice + equipmentSubtotal
  const totalDiscountAmount = boatDiscountAmount + equipmentDiscountAmount
  const grandTotal = Number(quote.total_price ?? 0)

  const terms = lang === 'hr' ? settings.terms_hr : settings.terms_en
  const isQR = lang !== 'hr'

  // VAT — every line price is net; VAT is only added in the totals block
  const vatPct = Number(quote.vat_percentage ?? 25)
  const { vatAmount, totalWithVat } = calculateVat(grandTotal, vatPct)

  // Barcode label
  const barcodeLabelText = (() => {
    const dpct = quote.deposit_percentage != null ? Number(quote.deposit_percentage) : null
    if (dpct && dpct > 0 && dpct < 100) {
      const amt = formatPrice(Number(quote.deposit_amount ?? 0))
      return lang === 'hr'
        ? `Predujam ${dpct}% — ${amt}`
        : `Advance payment ${dpct}% — ${amt}`
    }
    return labels.scanToPay
  })()

  // Combined discount label — boat and equipment stay on a single line (no split,
  // per client request). Surface the discount rate(s) in the label:
  //   • one uniform % across the whole quote → "Popust (12%)"
  //   • distinct boat / equipment % (one % discount per level, no per-item ones)
  //       → "Popust (brod 12% / oprema 8%)"
  //   • anything else (fixed amounts, per-item, mixed) → plain "Popust"
  const combinedDiscountLabel = (() => {
    if (totalDiscountAmount <= 0) return labels.discount
    const discountList = quote.discounts ?? []
    if (discountList.length === 0) return labels.discount

    // Uniform single percentage that reproduces the combined amount
    const allPercentage = discountList.every((d) => d.discount_type === 'percentage')
    const pctValues = new Set(discountList.map((d) => Number(d.value)))
    if (allPercentage && pctValues.size === 1) {
      const pct = [...pctValues][0]
      if (Math.abs(totalBeforeDiscount * (pct / 100) - totalDiscountAmount) <= 1) {
        return `${labels.discount} (${pct}%)`
      }
    }

    // Distinct boat / equipment percentages — exactly one % discount on each level,
    // and no per-item discounts that a boat/equipment breakdown would misrepresent
    const levelPct = (level: string): number | null => {
      const rows = discountList.filter((d) => d.discount_level === level)
      if (rows.length !== 1 || rows[0].discount_type !== 'percentage') return null
      const v = Number(rows[0].value)
      return v > 0 ? v : null
    }
    const hasPerItem = discountList.some((d) => d.discount_level === 'equipment_item')
    if (!hasPerItem) {
      const boatPct = levelPct('boat_base')
      const equipPct = levelPct('equipment_all')
      const productWords = {
        yacht: lang === 'hr' ? 'brod' : 'boat',
        tender: 'tender',
        toy: lang === 'hr' ? 'igračka' : 'toy',
      }
      const boatWord = productWords[(quote.boat?.product_type ?? 'yacht') as keyof typeof productWords] ?? productWords.yacht
      const equipWord = lang === 'hr' ? 'oprema' : 'equipment'
      const parts: string[] = []
      if (boatPct != null) parts.push(`${boatWord} ${boatPct}%`)
      if (equipPct != null) parts.push(`${equipWord} ${equipPct}%`)
      if (parts.length > 0) return `${labels.discount} (${parts.join(' / ')})`
    }

    return labels.discount
  })()

  // Footer logos — each logo's width follows its real aspect ratio so the visual
  // gaps between logos come out equal (fixed-width boxes centered narrow logos and
  // made gaps look uneven). If the row would overflow, everything scales down
  // proportionally so all logos always fit in one row.
  const LOGO_H = 22
  const LOGO_MAX_W = 80
  const LOGO_MIN_GAP = 12
  const FOOTER_W = 523 // A4 595pt − 2 × 36pt horizontal padding

  const sizedLogos = (partnerLogos ?? []).map((pl) => {
    const ratio = pl.aspectRatio ?? null
    if (!ratio || ratio <= 0) {
      // Measurement unavailable — fall back to the old fixed box
      return { ...pl, w: 55, h: LOGO_H }
    }
    const w = Math.min(LOGO_H * ratio, LOGO_MAX_W)
    return { ...pl, w, h: w / ratio }
  })
  const logosTotalWidth = sizedLogos.reduce((sum, l) => sum + l.w, 0)
  const logoScale = sizedLogos.length > 1
    ? Math.min(1, (FOOTER_W - LOGO_MIN_GAP * (sizedLogos.length - 1)) / logosTotalWidth)
    : 1

  const hasPartnerLogos = sizedLogos.length > 0

  // Rows are laid out left-to-right in STD_COLUMNS cells; each row is unbreakable,
  // so the list flows across pages row by row.
  // Title and rows are flat siblings inside the list (see optional table note).
  const renderStdCategory = (category: string, items: string[]) => (
    <Fragment key={category}>
      <Text style={s.stdCat} minPresenceAhead={24}>{category}</Text>
      {chunk(items, STD_COLUMNS).map((row, rowIdx) => (
        <View key={rowIdx} style={s.stdRow} wrap={false}>
          {Array.from({ length: STD_COLUMNS }, (_, col) => {
            const text = row[col]
            return (
              <View key={col} style={s.stdCell}>
                {text !== undefined && (
                  <>
                    <View style={s.stdBullet} />
                    <Text style={s.stdText}>{text}</Text>
                  </>
                )}
              </View>
            )
          })}
        </View>
      ))}
    </Fragment>
  )

  const renderSecRow = (title: string) => (
    <View style={s.secRow} minPresenceAhead={56}>
      <Text style={s.secText}>{title}</Text>
      <View style={s.secLine} />
    </View>
  )

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Fixed footer — partner logos + registration text on every page */}
        <View style={s.footerWrap} fixed>
          {hasPartnerLogos && (
            <View style={sizedLogos.length === 1 ? s.partnerLogosRowSingle : s.partnerLogosRow}>
              {sizedLogos.map((pl) => (
                <Image
                  key={pl.id}
                  src={pl.logo_url}
                  style={{ width: pl.w * logoScale, height: pl.h * logoScale, objectFit: 'contain' }}
                />
              ))}
            </View>
          )}
          <Text style={s.footerText}>
            {settings.registration_number && (
              <>{labels.registeredAt} <Text style={s.footerBold}>MB:</Text> {settings.registration_number}</>
            )}
            {settings.registration_number && settings.oib ? ' | ' : ''}
            {settings.oib && (
              <><Text style={s.footerBold}>OIB:</Text> {settings.oib}</>
            )}
            {settings.oib && settings.iban ? ' | ' : ''}
            {settings.iban && (
              <><Text style={s.footerBold}>IBAN:</Text> {settings.iban}</>
            )}
            {settings.iban && settings.bic ? ' | ' : ''}
            {settings.bic && (
              <><Text style={s.footerBold}>SWIFT:</Text> {settings.bic}{settings.bank_name ? `, ${settings.bank_name}` : ''}</>
            )}
          </Text>
          <Text style={s.footerText}>
            {settings.share_capital && (
              <><Text style={s.footerBold}>{labels.shareCapitalLabel}:</Text> {settings.share_capital}</>
            )}
            {settings.share_capital && settings.director_name ? ' | ' : ''}
            {settings.director_name && (
              <><Text style={s.footerBold}>{labels.directorLabel}:</Text> {settings.director_name}</>
            )}
          </Text>
        </View>

        {/* Header */}
        <View style={s.header}>
          <View style={s.logoWrap}>
            {settings.logo_url ? (
              <Image src={settings.logo_url} style={s.logo} />
            ) : (
              <>
                <Text style={s.logoFallback}>
                  {settings.name ?? 'NAVIS MARINE'}
                </Text>
                <Text style={s.logoTag}>{labels.authorized}</Text>
              </>
            )}
          </View>
          <View style={s.headerRight}>
            <Text style={s.docTitle}>{labels.quote}</Text>
            <Text style={s.quoteNum}>{quote.quote_number}</Text>
            <View style={s.metaRow}>
              <Text style={s.metaLabel}>{labels.date}:</Text>
              <Text style={s.metaVal}>{formatDate(quote.created_at, locale)}</Text>
            </View>
            <View style={s.metaRow}>
              <Text style={s.metaLabel}>{labels.validUntil}:</Text>
              <Text style={s.metaVal}>{validUntil}</Text>
            </View>
          </View>
        </View>

        {/* Customer + Offer Made By */}
        <View style={s.infoRow}>
          <View style={s.infoCard}>
            <Text style={s.infoLabel}>{labels.customer}</Text>
            {company && (
              <>
                <Text style={s.infoName}>{company.name}</Text>
                <Text style={s.infoDetail}>
                  {[
                    company.address,
                    [company.postal_code, company.city].filter(Boolean).join(' '),
                    company.country,
                    company.registration_number ? `OIB: ${company.registration_number}` : null,
                    company.email,
                    company.phone,
                  ]
                    .filter(Boolean)
                    .join('\n')}
                </Text>
              </>
            )}
          </View>
          <View style={s.infoCard}>
            <Text style={s.infoLabel}>{labels.offerMadeBy}</Text>
            {createdByProfile && (
              <>
                <Text style={s.infoName}>{createdByProfile.full_name}</Text>
                <Text style={s.infoDetail}>
                  {[createdByProfile.email].filter(Boolean).join('\n')}
                </Text>
              </>
            )}
          </View>
        </View>

        {/* Vessel bar */}
        {boat && (
          <View style={s.vessel}>
            <Text style={s.vesselName}>{boat.name}</Text>
            <View style={s.vesselRight}>
              <Text style={s.priceTag}>{labels.basePrice} ({labels.exclVat})</Text>
              <Text style={s.priceVal}>{formatPrice(boatBasePrice)}</Text>
            </View>
          </View>
        )}

        {/* Specs — compact 2-column key-value */}
        {topSpecs.length > 0 && (() => {
          const [specsCol1, specsCol2] = splitHalf(topSpecs)
          const renderSpecCol = (specs: typeof topSpecs) => (
            <View style={s.specsCol}>
              {specs.map((spec) => {
                const specLabel = lang === 'hr'
                  ? (spec.label_hr ?? spec.label_en ?? '')
                  : (spec.label_en ?? spec.label_hr ?? '')
                return (
                  <View key={spec.id} style={s.specRow}>
                    <Text style={s.specLbl}>{specLabel}</Text>
                    <Text style={s.specVal}>{spec.value ?? '—'}</Text>
                  </View>
                )
              })}
            </View>
          )
          return (
            <View style={s.specsContainer}>
              {renderSpecCol(specsCol1)}
              {specsCol2.length > 0 && renderSpecCol(specsCol2)}
            </View>
          )
        })()}

        {/* Standard Equipment (conditional based on quote setting) */}
        {hasStandard && quote.include_standard_in_pdf !== false && (
          <>
            {renderSecRow(labels.standardEquipment)}
            <View style={s.stdWrap}>
              {Array.from(standardByCategory.entries()).map(([category, items]) =>
                renderStdCategory(category, items),
              )}
            </View>
          </>
        )}

        {/* Optional Equipment Table */}
        {hasOptional && (
          <>
            {renderSecRow(labels.optionalEquipment)}

            {/* Table: categories may break between rows; a single row never splits.
                The header is `fixed`, so it repeats on every page the table spans. */}
            <View>
            <View style={s.tHead} fixed>
              <Text style={[s.tHeadText, { width: '38%', paddingLeft: 6 }]}>{labels.item}</Text>
              <Text style={[s.tHeadText, { width: '8%', textAlign: 'center' }]}>{labels.quantity}</Text>
              <Text style={[s.tHeadText, { width: '16%', textAlign: 'right' }]}>{labels.unitPrice}</Text>
              <Text style={[s.tHeadText, { width: '14%', textAlign: 'right' }]}>{labels.discount}</Text>
              <Text style={[s.tHeadText, { width: '24%', textAlign: 'right' }]}>{labels.net}</Text>
            </View>

            {/* Category header and rows are flat siblings of the table: react-pdf only
                honours minPresenceAhead when the element has preceding siblings. */}
            {Array.from(optionalByCategory.entries()).map(([category, items]) => (
              <Fragment key={category}>
                <View style={s.catHeader} minPresenceAhead={40}>
                  <Text style={s.catHeaderText}>{category}</Text>
                </View>
                {items.map((item) => {
                  const itemName = lang === 'hr' ? item.name_hr : item.name_en
                  const qty = Number(item.quantity ?? 1)
                  const isTbq = item.is_price_on_request === true
                  const unitPrice = Number(item.price ?? 0)
                  const lineTotal = unitPrice * qty
                  const itemDiscount = Number(item.item_discount ?? 0)
                  const netPrice = lineTotal - itemDiscount
                  const discountType = item.item_discount_type as string | null
                  const discountValue = Number(item.item_discount_value ?? 0)
                  const discountDisplay = !isTbq && itemDiscount > 0
                    ? discountType === 'percentage'
                      ? `-${discountValue}%`
                      : `-${formatPrice(itemDiscount)}`
                    : null
                  return (
                    <View key={item.id} style={s.row} wrap={false}>
                      <View style={{ width: '38%', paddingLeft: 6 }}>
                        <Text style={s.cellName}>{itemName ?? '—'}</Text>
                      </View>
                      <View style={{ width: '8%', alignItems: 'center' }}>
                        <Text style={{ fontSize: 8, color: TEXT_BODY, textAlign: 'center' }}>{qty}</Text>
                      </View>
                      <View style={{ width: '16%' }}>
                        <Text style={s.cellPrice}>{isTbq ? labels.priceOnRequest : formatPrice(unitPrice)}</Text>
                      </View>
                      <View style={{ width: '14%' }}>
                        {discountDisplay && (
                          <Text style={s.cellDisc}>{discountDisplay}</Text>
                        )}
                      </View>
                      <View style={{ width: '24%' }}>
                        <Text style={s.cellNet}>{isTbq ? labels.priceOnRequest : formatPrice(netPrice)}</Text>
                      </View>
                    </View>
                  )
                })}
              </Fragment>
            ))}
            </View>
          </>
        )}

        {/* Pricing Summary — list price / discount (/ net + VAT) + highlighted total box.
            All prices above are net; VAT is only added here when vat_included. */}
        <View style={s.pricingWrap} wrap={false}>
          <View style={s.pricingSummary}>
            <View style={s.pSumRow}>
              <Text style={s.pSumLbl}>{labels.total}</Text>
              <Text style={s.pSumVal}>{formatPrice(totalBeforeDiscount)}</Text>
            </View>
            {totalDiscountAmount > 0 && (
              <View style={s.pSumRow}>
                <Text style={s.pSumDiscLbl}>{combinedDiscountLabel}</Text>
                <Text style={s.pSumDiscVal}>-{formatPrice(totalDiscountAmount)}</Text>
              </View>
            )}
            {quote.vat_included && (
              <>
                <View style={s.pSumDivider} />
                <View style={s.pSumRow}>
                  <Text style={s.pSumNetLbl}>{labels.totalExclVat}</Text>
                  <Text style={s.pSumNetVal}>{formatPrice(grandTotal)}</Text>
                </View>
                <View style={s.pSumRow}>
                  <Text style={s.pSumVatLbl}>{labels.vat} ({vatPct}%)</Text>
                  <Text style={s.pSumVatVal}>{formatPrice(vatAmount)}</Text>
                </View>
              </>
            )}
          </View>

          <View style={s.pricingColTotal}>
            <Text style={s.pTotalLbl}>
              {quote.vat_included ? labels.totalInclVat : labels.totalExclVat}
            </Text>
            <Text style={s.pTotalVal}>
              {formatPrice(quote.vat_included ? totalWithVat : grandTotal)}
            </Text>
          </View>
        </View>

        {/* Notes under the totals: VAT notice (net quotes) and TBQ disclaimer.
            No italic — only the regular font face is registered, italic throws. */}
        {(!quote.vat_included || hasTbq) && (
          <View style={s.totalsNotes}>
            {!quote.vat_included && <Text style={s.smallNote}>{labels.vatChargedNote}</Text>}
            {hasTbq && <Text style={s.tbqNote}>* {labels.tbqNote}</Text>}
          </View>
        )}

        {/* Notes */}
        {quote.notes && (
          <>
            {renderSecRow(labels.quoteDetails)}
            <Text style={s.noteText}>{quote.notes}</Text>
          </>
        )}

        {/* Delivery Terms */}
        {deliveryTermsText && (
          <>
            {renderSecRow(labels.deliveryTerms)}
            <Text style={s.noteText}>{deliveryTermsText}</Text>
          </>
        )}

        {/* Payment + Terms (keep together) */}
        <View wrap={false}>
          {renderSecRow(labels.paymentDetails)}
          <View style={s.paySection}>
            <View style={s.payLeft}>
              <View style={s.payBlock}>
                <Text style={s.payTitle}>{labels.recipient}</Text>
                {settings.name && <Text style={s.payBold}>{settings.name}</Text>}
                <Text style={s.payText}>
                  {[
                    settings.address,
                    [settings.postal_code, settings.city].filter(Boolean).join(' '),
                    settings.oib ? `OIB: ${settings.oib}` : null,
                  ]
                    .filter(Boolean)
                    .join('\n')}
                </Text>
              </View>
              <View style={s.payBlock}>
                <Text style={s.payTitle}>{labels.bankDetails}</Text>
                {settings.iban && <Text style={s.payBankDetail}>IBAN: {settings.iban}</Text>}
                {settings.bic && <Text style={s.payBankDetail}>BIC/SWIFT: {settings.bic}</Text>}
                {settings.bank_name && <Text style={s.payText}>{settings.bank_name}</Text>}
                <Text style={s.payText}>
                  {labels.callNumber}: {quote.quote_number}
                </Text>
              </View>
            </View>
            {barcodeDataUrl && (
              <View style={s.barcodeWrap}>
                <Image
                  src={barcodeDataUrl}
                  style={isQR ? s.qrImg : s.barcodeImg}
                />
                <Text style={s.barcodeLbl}>{barcodeLabelText}</Text>
              </View>
            )}
          </View>

          {(paymentTermsText || terms) && (
            <View style={s.termsWrap}>
              <Text style={s.termsTitle}>{labels.termsOfPayment}</Text>
              <Text style={s.termsBody}>{paymentTermsText || terms}</Text>
            </View>
          )}
        </View>

        {/* Signatures — kept together: whole block moves to next page if it doesn't fit */}
        <View style={s.sigWrap} wrap={false}>
          <View style={s.sigRow}>
            <View style={s.sigCol}>
              <View style={s.sigLine} />
              <Text style={s.sigLabel}>{labels.signatureBuyer}</Text>
              <Text style={s.sigName}>{company?.name ?? ''}</Text>
            </View>
            <View style={s.sigCol}>
              <View style={s.sigLine} />
              <Text style={s.sigLabel}>{labels.signatureSeller}</Text>
              <Text style={s.sigName}>{settings.name ?? 'Navis Marine d.o.o.'}</Text>
            </View>
          </View>
          <Text style={s.footnote}>{labels.notAnInvoice}</Text>
        </View>
      </Page>
    </Document>
  )
}
