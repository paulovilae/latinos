import type { CollectionConfig } from 'payload'

import { authenticated } from '../../access/authenticated'

export const Accounts: CollectionConfig = {
  slug: 'accounts',
  access: {
    admin: authenticated,
    create: authenticated,
    delete: authenticated,
    read: authenticated,
    update: authenticated,
  },
  admin: {
    defaultColumns: ['provider', 'providerAccountId', 'user'],
    useAsTitle: 'provider',
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
    },
    {
      name: 'provider',
      type: 'text',
      required: true,
    },
    {
      name: 'providerAccountId',
      type: 'text',
      required: true,
    },
    {
      name: 'type',
      type: 'text',
      required: true,
    },
    {
      name: 'access_token',
      type: 'text',
    },
    {
      name: 'refresh_token',
      type: 'text',
    },
    {
      name: 'expires_at',
      type: 'number',
    },
    {
      name: 'token_type',
      type: 'text',
    },
    {
      name: 'scope',
      type: 'text',
    },
    {
      name: 'id_token',
      type: 'textarea',
    },
  ],
  timestamps: true,
}