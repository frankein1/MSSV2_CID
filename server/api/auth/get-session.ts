import { UserRepo } from '~~/server/database'
import { signJwt } from '~~/server/lib/jwt'
import { getAppContextPermissions } from '~~/server/security'
import { cookieOptions } from '~/utils/cookie'
import { structureContextSelect } from '~~/server/utils/fetchUserContext'

/** Renew session using most recent user information from database
 *  and reissue a new auth token */
export default defineEventHandler(async event => {
  const userId = event.context.auth?.userId

  const config = useRuntimeConfig()
  const { cookieKey, tokenValidationInMinutes } = config.public.auth

  if (!userId) {
    return null
  }

  // Fetch user and structure info from the token that contains only the user id
  const user = await UserRepo.prisma.findUnique({
    where: {
      id: userId
    },
    select: {
      firstName: true,
      lastName: true,
      id: true,
      email: true,
      role: true,
      status: true,
      structureId: true,
      CGUHistory: {
        select: { version: true },
        orderBy: {
          date: 'desc' as const
        }
      },
      structure: {
        select: {
          ...structureContextSelect,
          typeSurvey: { select: { id: true } }
        }
      }
    }
  })

  if (!user) {
    return null
  }

  enrichLogger(event, user)

  const {
    auth: { jwtKey }
  } = config

  const newSessionToken = signJwt(
    { id: user.id },
    jwtKey,
    tokenValidationInMinutes
  )

  setCookie(
    event,
    cookieKey,
    newSessionToken,
    cookieOptions({ expiresInMinutes: tokenValidationInMinutes })
  )

  const CGUHistoryVersion = user.CGUHistory[0]?.version || null

  const userProfile = {
    firstName: user.firstName,
    lastName: user.lastName,
    id: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
    structureId: user.structure?.id || null,
    structureType: user.structure?.type || null,
    CGUHistoryVersion,
    structureTypeSurveyFilled: !!user.structure?.typeSurvey
  }

  const permissions = getAppContextPermissions({
    user,
    structure: user.structure
  })

  return { user: userProfile, permissions }
})
