import type { Prisma } from '@prisma/client'
import { UserStatus, UserActivityType } from '@prisma/client'
import pkg from 'jsonwebtoken'
import { signJwt } from '~~/server/lib/jwt'
import { getProConnectClient } from '~~/server/lib/proconnect.client'
import { structureContextSelect } from '~~/server/utils/fetchUserContext'
import type {
  ProConnectUserInfo,
  ProConnectClient
} from '~~/server/lib/proconnect.client'
import { addUserActivity } from '~~/server/query/userActivity/addUserActivity'
import { UserRepo } from '~~/server/database'
import { prismaClient } from '~~/server/prisma'
import { cleanEmail } from '~/utils/user/cleanEmail'
import type { AuthSession } from '~~/server/types/session'
import { forbidden, unauthorized } from '~/utils/api/errors'
import { cookieOptions } from '~/utils/cookie'
import { routes } from '~/utils/routes'
import { isSafeRedirectUrl } from '~/utils/isSafeRedirectUrl'
import { getAppContextPermissions } from '~~/server/security'
import jwksClient from 'jwks-rsa'

const { verify, decode } = pkg

const {
  auth: {
    sessionSecret,
    proconnectProvider,
    proconnectIssuer,
    proconnectClientId,
    proconnectSigningAlgorithm,
    jwtKey
  },
  public: {
    mssEnvironment,
    auth: { cookieKey, tokenValidationInMinutes }
  }
} = useRuntimeConfig()

const proConnectJwksClient = jwksClient({
  jwksUri: `${proconnectIssuer}/jwks`
})

// TODO: throw all errors at the same time
// add server messages & client messages
// always clear session

export default defineEventHandler(async event => {
  const { code, state } = getQuery(event)

  if (!code) {
    throw unauthorized('[ProConnect] no code returned from ProConnect')
  }
  if (!state) {
    throw unauthorized('[ProConnect] no state returned from ProConnect')
  }

  const session = await useSession<AuthSession>(event, {
    password: sessionSecret
  })

  const { nonce: sessionNonce, state: sessionState, redirectUrl } = session.data

  if (!sessionNonce || !sessionState) {
    throw unauthorized('[ProConnect] state or nonce are not in session')
  }

  if (sessionState !== state) {
    throw unauthorized('[ProConnect] `states` must be equal')
  }

  if (redirectUrl && !isSafeRedirectUrl(redirectUrl)) {
    console.log('[ProConnect] Rejected unsafe redirect URL at login callback')
    event.context.sentry?.captureMessage(
      '[ProConnect] Rejected unsafe redirect URL at login callback',
      {
        level: 'warning',
        extra: { redirectUrl }
      }
    )
    throw unauthorized('[ProConnect] invalid redirect')
  }
  const validatedRedirectUrl = redirectUrl

  const client = getProConnectClient()

  const proConnectToken = await fetchProConnnectToken(client, code as string)

  // ProConnect tokens are signed with HS256
  const { accessToken, idToken } = proConnectToken

  // Validate id token signature
  // See https://curity.io/resources/learn/jwt-best-practices/ sections 3 to 6
  let validatedIdToken: { nonce: string; amr: string[] } | null

  try {
    const decoded = decode(idToken, { complete: true })
    if (!decoded) {
      throw unauthorized('[ProConnect] Unable to decode id token')
    }
    const { header } = decoded

    const proConnectKey = await proConnectJwksClient.getSigningKey(header.kid)
    const proConnectSigningKey = proConnectKey.getPublicKey()
    if (!proConnectSigningKey) {
      throw unauthorized('[ProConnect] Unable to get signing key')
    }

    validatedIdToken = verify(idToken, proConnectSigningKey, {
      algorithms: [proconnectSigningAlgorithm as pkg.Algorithm],
      audience: proconnectClientId,
      issuer: proconnectIssuer,
      nonce: sessionNonce
    }) as {
      nonce: string
      amr: string[]
    }
  } catch {
    throw unauthorized('[ProConnect] invalid id token')
  }

  const userinfo = await fetchUserInfo(client, accessToken)

  // Validate jwt user info signature
  let validatedUserInfo: ProConnectUserInfo | null
  try {
    const decoded = decode(userinfo, { complete: true })
    if (!decoded) {
      throw unauthorized('[ProConnect] Unable to decode userinfo')
    }
    const { header } = decoded

    const proConnectKey = await proConnectJwksClient.getSigningKey(header.kid)
    const proConnectSigningKey = proConnectKey.getPublicKey()

    validatedUserInfo = verify(userinfo, proConnectSigningKey, {
      algorithms: [proconnectSigningAlgorithm as pkg.Algorithm],
      audience: proconnectClientId,
      issuer: proconnectIssuer
    }) as ProConnectUserInfo
  } catch {
    throw unauthorized('[ProConnect] invalid user info')
  }

  if (!validatedUserInfo.email || !validatedUserInfo.sub) {
    throw forbidden('[ProConnect] missing email or sub')
  }

  const { email: em, sub } = validatedUserInfo

  // Some Proconnect FI allow uppercase emails
  const email = cleanEmail(em)

  const account = await getAccount({ sub })

  let user: UserAuthInfo | null
  if (account) {
    user = account.user
  } else {
    user = await getUser(email)
  }

  // If user has not been previously created through admin panel
  // forbid access and provide a logout link to retry in the error page
  if (!user) {
    await provideLogoutUrl(session, idToken, state)
    throw forbidden('[ProConnect] Access denied: unknown user')
  }

  enrichLogger(event, user)

  // If user deactivated, provide a logout link to retry in the error page
  if (user.status !== UserStatus.Active) {
    await provideLogoutUrl(session, idToken, state)
    throw forbidden('[ProConnect] Access denied: deactivated user')
  }

  // If structure disabled, provide a logout link to retry in the error page
  if (user.structure && user.structure.disabled) {
    await provideLogoutUrl(session, idToken, state)
    throw forbidden('[ProConnect] Access denied: deactivated structure')
  }

  // Check 2FA presence when authenticating as an admin
  if (user.role === 'Administrator') {
    const emailIsValid =
      mssEnvironment === 'local' ||
      user.email.endsWith('@beta.gouv.fr') ||
      user.email.endsWith('@ext.anct.gouv.fr')

    // If already authenticated, going through login flow does not fill amr field and entails 403.
    // This is mitigated by :
    // - redirecting to admin panel when admin is already logged in (via a skip auth middleware)
    // - providing a proconnect-only logout link in the error page for backup
    const authenticationModes = (validatedIdToken?.amr || []) as string[]

    if (!emailIsValid) {
      const logoutUrl = client.getLogoutUrl({ idToken, state })
      await session.update({ logoutUrl })
      throw forbidden('[ProConnect] Access denied')
    }

    if (!authenticationModes.includes('mfa')) {
      const logoutUrl = client.getLogoutUrl({ idToken, state })
      await session.update({ logoutUrl })
      throw forbidden('[ProConnect] Access denied: MFA necessary')
    }
  }

  // Update account with session information: idToken and state will be needed for logout
  await upsertAccount({
    providerAccountId: sub,
    user,
    idToken,
    state: state as string
  })

  // Update email information with current proconnect info. This allows to update the email
  // of the user when she changes her proconnect account (when proconnect allow email change)
  if (cleanEmail(user.email) !== email) {
    updateEmail(user.id, email)
  }

  // Generate MSS token
  const { id, firstAccess } = user

  const sessionToken = signJwt({ id }, jwtKey, tokenValidationInMinutes)

  const now = new Date()
  const data: Prisma.UserUpdateInput = {
    ...(!firstAccess && { firstAccess: now }),
    lastAccess: now
  }

  // The admin role is not linked to a structure so check is necessary
  if (user.structure) {
    data.structure = {
      update: {
        lastAccess: now,
        deactivationAlertEmail: 0,
        deactivationAlertEmailDate: null
      }
    }
  }

  await UserRepo.prisma.update({
    where: {
      id: user.id
    },
    data
  })

  setCookie(
    event,
    cookieKey,
    sessionToken,
    cookieOptions({ expiresInMinutes: tokenValidationInMinutes })
  )

  // The login activities are traced in the DB
  await addUserActivity({
    key: 'auth.validateToken',
    user,
    activity: UserActivityType.LOGIN,
    object: 'User',
    objectId: user.id
  })

  // TODO: session should always be cleared or replaced with logouturl on failure
  await session.clear()

  // After successful login:
  // - redirect to specified url if exist
  // - redirect to admin panel if admin
  // - redirect to structure type survey if not filled yet (the user can skip it)
  // - redirect to user panel otherwise
  // Fetching user information and permissions will be executed on first page loading with auth plugin
  if (validatedRedirectUrl) {
    return sendRedirect(event, validatedRedirectUrl)
  }

  if (user.role === 'Administrator') {
    return sendRedirect(event, routes.admin.AdminOverview.path())
  }

  if (
    getAppContextPermissions({ user, structure: user.structure }).edit
      .structureTypeSurvey &&
    !user.structure?.typeSurvey
  ) {
    return sendRedirect(event, routes.structure.AppStructureTypeSurvey.path())
  }

  return sendRedirect(event, routes.user.AppOverview.path())
})

async function fetchUserInfo(client: ProConnectClient, accessToken: string) {
  const response = await client.getUserInfo({
    accessToken
  })
  return response
}

async function fetchProConnnectToken(client: ProConnectClient, code: string) {
  const proConnectTokenResponse = await client.getToken({ code })

  if (proConnectTokenResponse.error) {
    throw new Error(`[ProConnect] ${proConnectTokenResponse.error.description}`)
  }
  if (!proConnectTokenResponse.data) {
    throw new Error(
      '[ProConnect] no access token found un pro connect response'
    )
  }

  return proConnectTokenResponse.data
}

async function updateEmail(userId: string, email: string) {
  return await prismaClient.user.update({
    where: { id: userId },
    data: {
      email: cleanEmail(email)
    }
  })
}

const userSelect = {
  select: {
    id: true,
    email: true,
    role: true,
    status: true,
    structureId: true,
    firstAccess: true,
    structure: {
      select: {
        ...structureContextSelect,
        disabled: true,
        typeSurvey: { select: { id: true } }
      }
    }
  }
} satisfies { select: Prisma.UserSelect }

async function getAccount({ sub }: { sub: string }) {
  return await prismaClient.account.findUnique({
    where: {
      provider_providerAccountId: {
        provider: proconnectProvider,
        providerAccountId: sub
      }
    },
    select: {
      user: userSelect
    }
  })
}

async function upsertAccount({
  user,
  providerAccountId,
  idToken,
  state
}: {
  user: UserAuthInfo
  providerAccountId: string
  idToken: string
  state: string
}) {
  return await prismaClient.account.upsert({
    where: {
      provider_providerAccountId: {
        provider: proconnectProvider,
        providerAccountId
      }
    },
    create: {
      userId: user.id,
      provider: proconnectProvider,
      providerAccountId,
      idToken,
      sessionState: state
    },
    update: {
      idToken,
      sessionState: state
    }
  })
}

async function getUser(email: string) {
  return await UserRepo.prisma.findUnique({
    where: { email: cleanEmail(email) },
    select: userSelect.select
  })
}

async function provideLogoutUrl(
  session: NitroSession,
  idToken: string,
  state: string
) {
  const client = getProConnectClient()
  const logoutUrl = client.getLogoutUrl({ idToken, state })
  await session.update({ logoutUrl })
}

type UserAuthInfo = NonNullable<Awaited<ReturnType<typeof getUser>>>
type NitroSession = Awaited<ReturnType<typeof useSession<AuthSession>>>
