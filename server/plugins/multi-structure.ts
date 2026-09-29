import { prismaClient } from '~~/server/prisma/prismaClient'

const N_STRUCTURES = 10
const MIN_BENEFICIARIES_PER_STRUCTURE = 500

export default defineNitroPlugin(async nitroApp => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Multi-structure POC plugin must not run in production')
  }

  const structures = await prismaClient.structure.findMany({
    select: {
      id: true,
      _count: {
        select: {
          beneficiaries: true
        }
      }
    },
    where: {
      disabled: false
    }
  })

  const selected = structures
    .filter(s => s._count.beneficiaries >= MIN_BENEFICIARIES_PER_STRUCTURE)
    .sort(() => Math.random() - 0.5)
    .slice(0, N_STRUCTURES)
    .map(s => s.id)

  // eslint-disable-next-line no-console
  console.log('[multi-structure] Selected structure IDs:', selected)

  nitroApp.hooks.hook('request', event => {
    event.context.multiStructureIds = selected
  })
})
