import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="px-6 pb-8 pt-20" style={{ backgroundColor: '#0A0B0D' }}>
      <div className="max-w-6xl mx-auto">
        <div
          className="rounded-3xl p-10 border backdrop-blur-xl"
          style={{
            backgroundColor: 'rgba(17,18,20,0.5)',
            borderColor: 'rgba(255,255,255,0.05)',
            boxShadow: '0 -4px 30px rgba(0,0,0,0.3)',
          }}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
            <div className="col-span-2 md:col-span-1">
              <Link to="/" className="flex items-center mb-4">
                <img
                  src="/logo/hedgify.png"
                  alt="Hedgify"
                  className="h-6 w-auto max-h-6 object-contain"
                />
              </Link>
              <p className="text-[13px] leading-relaxed max-w-[220px]" style={{ color: '#8A8C93' }}>
                ai-powered portfolio insurance. stop-loss for people who don't want to sell.
              </p>
            </div>

            {[
              {
                title: 'product',
                links: [
                  { label: 'features', href: '#features' },
                  { label: 'how it works', href: '#how-it-works' },
                  { label: 'dashboard', to: '/dashboard' },
                  { label: 'faq', href: '#faq' },
                ],
              },
              {
                title: 'developers',
                links: [
                  { label: 'github', href: 'https://github.com/builtbyrehan/hedgify' },
                  { label: 'documentation', href: '#' },
                  { label: 'api reference', href: '#' },
                ],
              },
              {
                title: 'legal',
                links: [
                  { label: 'privacy policy', href: '#' },
                  { label: 'terms of service', href: '#' },
                  { label: 'risk disclosure', href: '#' },
                ],
              },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="text-[11px] font-mono font-bold uppercase tracking-wider mb-4" style={{ color: '#54565C' }}>
                  {col.title}
                </h4>
                <ul className="space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      {'to' in link && link.to ? (
                        <Link
                          to={link.to}
                          className="text-[13px] transition-colors hover:text-[#ECEEF1]"
                          style={{ color: '#8A8C93' }}
                        >
                          {link.label}
                        </Link>
                      ) : (
                        <a
                          href={link.href!}
                          target={link.href?.startsWith('http') ? '_blank' : undefined}
                          rel={link.href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                          className="text-[13px] transition-colors hover:text-[#ECEEF1]"
                          style={{ color: '#8A8C93' }}
                        >
                          {link.label}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div
            className="mt-10 pt-6 flex items-center justify-end gap-3"
            style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full pulse-live" style={{ backgroundColor: '#22c55e' }} />
              <span className="text-[12px] font-mono" style={{ color: '#54565C' }}>paper trading live</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
