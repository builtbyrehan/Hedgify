import { Link } from 'react-router-dom'

interface FeatureSectionProps {
  number: string
  kicker: string
  headline: string
  body: string
  bullets: string[]
  cta?: { label: string; href: string }
  align?: 'left' | 'right'
  mockPanel?: React.ReactNode
}

export default function FeatureSection({
  number,
  kicker,
  headline,
  body,
  bullets,
  cta,
  align = 'left',
  mockPanel,
}: FeatureSectionProps) {
  const isRight = align === 'right'

  return (
    <div className={`grid lg:grid-cols-2 gap-12 items-center ${isRight ? 'lg:[direction:rtl]' : ''}`}>
      <div className={isRight ? 'lg:[direction:ltr]' : ''}>
        <div
          className="inline-block px-2.5 py-1 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider mb-4"
          style={{ backgroundColor: 'rgba(34,197,94,0.1)', color: '#22c55e' }}
        >
          {number}
        </div>

        <div
          className="inline-block px-3 py-1 rounded-full text-[11px] font-mono font-medium uppercase tracking-wider mb-4 ml-2 border"
          style={{ color: '#8A8C93', borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.02)' }}
        >
          {kicker}
        </div>

        <h2
          className="text-[clamp(1.6rem,3vw,2.2rem)] font-bold tracking-[-0.02em] leading-[1.1] mb-4"
          style={{ fontFamily: 'var(--font-sans)', color: '#ECEEF1' }}
        >
          {headline}
        </h2>

        <p className="text-[15px] leading-relaxed mb-6" style={{ color: '#8A8C93' }}>
          {body}
        </p>

        <ul className="space-y-3 mb-6">
          {bullets.map((b, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: '#22c55e' }} />
              <span className="text-[13px] font-mono" style={{ color: '#8A8C93' }}>{b}</span>
            </li>
          ))}
        </ul>

        {cta && (
          <Link
            to={cta.href}
            className="inline-flex items-center gap-1.5 text-[13px] font-mono font-medium transition-colors hover:gap-2.5"
            style={{ color: '#22c55e' }}
          >
            {cta.label}
            <span>→</span>
          </Link>
        )}
      </div>

      {mockPanel && (
        <div className={`${isRight ? 'lg:[direction:ltr]' : ''}`}>
          {mockPanel}
        </div>
      )}
    </div>
  )
}
