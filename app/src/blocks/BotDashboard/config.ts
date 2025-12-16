import type { Block } from 'payload'

export const BotDashboard: Block = {
  slug: 'botDashboard',
  labels: {
    singular: 'Bot Dashboard',
    plural: 'Bot Dashboards',
  },
  fields: [
    {
      name: 'height',
      label: 'Iframe Height (px)',
      type: 'number',
      defaultValue: 800,
      required: true,
      min: 300,
      max: 1200,
    },
  ],
}