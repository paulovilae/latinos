import React from 'react'

type BotDashboardProps = {
  height?: number
  blockType?: string
}

type Props = BotDashboardProps & {
  disableInnerContainer?: boolean
}

export const BotDashboardBlock: React.FC<Props> = ({ height = 800, disableInnerContainer }) => {
  return (
    <section className="relative my-16 p-8 bg-gray-50 rounded-xl border">
      <iframe
        src="http://localhost:3003/"
        height={height}
        width="100%"
        style={{
          border: 'none',
          borderRadius: '0.75rem',
          minHeight: `${height}px`,
        }}
        title="Bot Dashboard Embed"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation"
      />
    </section>
  )
}