type Tag = 'h1' | 'h2' | 'h3' | 'p' | 'div'

/** Display heading split into masked lines for the "lines" reveal. */
export function Lines({
  as: Tag = 'h2',
  lines,
  className = 'display display--l',
  reveal = true,
  id,
}: {
  as?: Tag
  lines: string[]
  className?: string
  reveal?: boolean
  id?: string
}) {
  return (
    <Tag className={className} data-reveal={reveal ? 'lines' : undefined} id={id}>
      {lines.map((line, i) => (
        <span className="line" key={i}>
          <span>{line}</span>
        </span>
      ))}
    </Tag>
  )
}
