/**
 * Mint a local auth token to bypass ProConnect login on an anonymized DB.
 *
 * Usage:
 *   pnpm tsx scripts/mint-local-token.ts [user-id]
 *
 * Without user-id, picks the first active StructureManager.
 * Outputs the cookie value and a browser JS snippet to set it.
 */

import { PrismaClient, UserStatus, UserRole } from '@prisma/client'
import { signJwt } from '../server/lib/jwt'

const EXPIRATION_MINUTES = 600 // 10 hours — comfortable for local dev

async function main() {
  if (process.env.NODE_ENV === 'production') {
    console.error('Error: this script must not run in production.')
    process.exit(1)
  }

  const jwtKey = process.env.NUXT_AUTH_JWT_KEY
  if (!jwtKey) {
    console.error(
      'Error: NUXT_AUTH_JWT_KEY is not set.\n' +
        'Load your .env first, e.g.:\n' +
        '  source .env && pnpm tsx scripts/mint-local-token.ts\n' +
        '  — or —\n' +
        '  NUXT_AUTH_JWT_KEY=your-secret pnpm tsx scripts/mint-local-token.ts'
    )
    process.exit(1)
  }

  const prisma = new PrismaClient()

  try {
    const userIdArg = process.argv[2]

    let user: { id: string; role: UserRole; status: UserStatus } | null

    if (userIdArg) {
      user = await prisma.user.findUnique({
        where: { id: userIdArg },
        select: { id: true, role: true, status: true }
      })
      if (!user) {
        console.error(`No user found with id: ${userIdArg}`)
        process.exit(1)
      }
    } else {
      // Pick a usable user — prefer StructureManager, then SocialWorker
      user = await prisma.user.findFirst({
        where: {
          status: UserStatus.Active,
          structureId: { not: null },
          role: { in: [UserRole.StructureManager, UserRole.SocialWorker] }
        },
        orderBy: { role: 'asc' },
        select: { id: true, role: true, status: true }
      })
      if (!user) {
        // Fallback: any active user with a structure
        user = await prisma.user.findFirst({
          where: { status: UserStatus.Active, structureId: { not: null } },
          select: { id: true, role: true, status: true }
        })
      }
      if (!user) {
        console.error('No active user with a structure found in the database.')
        process.exit(1)
      }
    }

    const token = signJwt({ id: user.id }, jwtKey, EXPIRATION_MINUTES)

    console.log(`\n✓ Token minted for user:`)
    console.log(`  id:     ${user.id}`)
    console.log(`  role:   ${user.role}`)
    console.log(`  status: ${user.status}`)
    console.log(`  expires in ${EXPIRATION_MINUTES} minutes\n`)

    console.log(`── Cookie value ──`)
    console.log(token)

    console.log(`\n── Paste in browser console (on localhost) ──`)
    console.log(
      `document.cookie = "MSS_SESSION_TOKEN=${token}; path=/; max-age=${EXPIRATION_MINUTES * 60}";`
    )

    console.log(`\nThen reload the page. You should land on the dashboard.\n`)
  } finally {
    await prisma.$disconnect()
  }
}

main()
