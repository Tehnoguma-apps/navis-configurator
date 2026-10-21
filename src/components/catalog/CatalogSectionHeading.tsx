interface CatalogSectionHeadingProps {
  title: string
  count: number
}

/** Small heading above a group of catalog results (e.g. "Brands 3"). */
export const CatalogSectionHeading = ({ title, count }: CatalogSectionHeadingProps) => {
  return (
    <h2 className="mb-2 flex items-baseline gap-2 text-sm font-semibold text-navy">
      {title}
      <span className="text-xs font-normal tabular-nums text-muted-foreground">{count}</span>
    </h2>
  )
}
