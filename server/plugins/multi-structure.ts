import { prismaClient } from '~~/server/prisma/prismaClient'

export default defineNitroPlugin(async nitroApp => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Multi-structure POC plugin must not run in production')
  }

  const structures = await prismaClient.structure.findMany({
    select: { id: true },
    where: { disabled: false }
  })

  const selected = structures
    .sort(() => Math.random() - 0.5)
    .slice(0, 5)
    .map(s => s.id)

  // eslint-disable-next-line no-console
  console.log('[multi-structure] Selected structure IDs:', selected)

  nitroApp.hooks.hook('request', event => {
    event.context.multiStructureIds = selected
  })
})
