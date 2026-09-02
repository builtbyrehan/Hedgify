const items = [
  'real-time monitoring',
  'autonomous hedging',
  'zero liquidation',
  'protective puts',
  'multi-agent system',
  'paper trading safe',
  '24/7 portfolio watch',
  'idempotent execution',
  'websocket live push',
  'drawdown detection',
]

function Separator() {
  return (
    <span
      className="inline-block mx-5 shrink-0 self-center"
      style={{ color: '#0A0B0D', fontSize: '10px' }}
      aria-hidden="true"
    >
      ◆
    </span>
  )
}

export default function MarqueeStrip() {
  return (
    <div
      style={{
        position: 'relative',
        height: '160px',
        marginLeft: 'calc(-50vw + 50%)',
        marginRight: 'calc(-50vw + 50%)',
        width: '100vw',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '-40px',
          left: '-10vw',
          right: '-10vw',
          bottom: '-40px',
          display: 'flex',
          alignItems: 'center',
          transform: 'rotate(-3deg)',
          transformOrigin: 'center center',
        }}
      >
        <div
          style={{
            backgroundColor: '#22c55e',
            width: '110vw',
          }}
        >
          <div className="py-5 overflow-hidden w-full">
            <div className="marquee-track relative z-10">
              {[...items, ...items, ...items, ...items].map((item, i) => (
                <div key={i} className="flex items-center shrink-0">
                  <span
                    className="whitespace-nowrap font-mono font-black text-[14px] uppercase tracking-[0.12em]"
                    style={{
                      color: '#0A0B0D',
                      textRendering: 'optimizeLegibility',
                      WebkitFontSmoothing: 'antialiased',
                    }}
                  >
                    {item}
                  </span>
                  <Separator />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
