import { prismaClient } from '~~/server/prisma/prismaClient'

const N_STRUCTURES = 10
const MIN_BENEFICIARIES_PER_STRUCTURE = 500

export default defineNitroPlugin(async nitroApp => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Multi-structure POC plugin must not run in production')
  }

  // LOCAL ONLY (stats-history-count-perf ticket 24): pin the structures of the 01/10 captures
  const selected = [
    '6e1ddbf1-af82-400c-9314-cc376bb43779',
    '469bb1c6-0912-4417-96ef-ece36891eb6f',
    'feb9040d-1c52-4b0a-8324-39152a8d5b35',
    '01050839-f722-42a0-af30-c75874b12eec',
    '4c443522-4c2c-4453-b751-db5609e8b584',
    'ac8c0491-9cf0-43c9-81f2-bbccb6aff1a9',
    '4cf42d18-c079-47cd-97fd-f55a3fcd3465',
    '6ff68d9c-a61f-4f23-af19-5413f18832c6',
    '31e13e1d-57f0-452f-a20a-dbbb7fba1b31',
    '15ebcb19-3f49-416b-809c-504755068103'
  ]

  // eslint-disable-next-line no-console
  console.log('[multi-structure] Selected structure IDs:', selected)

  nitroApp.hooks.hook('request', event => {
    event.context.multiStructureIds = selected
  })
})
