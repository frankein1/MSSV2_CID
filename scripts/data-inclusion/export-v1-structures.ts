import { PrismaClient } from '@prisma/client'
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'

const prisma = new PrismaClient()

async function main() {
  const structures = await prisma.dataInclusionStructureV1.findMany({
    select: { id: true, name: true, siret: true, zipcode: true }
  })
  console.log(`Loaded ${structures.length} v1 structures`)

  const outPath = join(__dirname, `v1-structures.ignore.json`)
  writeFileSync(outPath, JSON.stringify(structures))
  console.log(`Written to ${outPath}`)
}

main()
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
