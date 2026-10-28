import picocolors from 'picocolors'
import { initTRPC, TRPCError } from '@trpc/server'
import superjson from 'superjson'
import type { H3Event } from 'h3'
import { StructureType, UserRole } from '@prisma/client'
import type {
  SecurityRuleGrantee,
  SecurityRuleStructure
} from '../security/rules/types'
import type { AppContext } from './createContext'
import { forbiddenError } from './trpcErrors'
import { shouldLog } from '~~/server/utils/logging'
import { TRPC_REQUEST_LOG_MSG } from '~~/server/utils/constants'

const t = initTRPC.context<AppContext>().create({
  transformer: superjson,
  errorFormatter(opts) {
    const { shape, error } = opts
    return {
      ...shape,
      data: {
        ...shape.data,
        // Allow the 'MSS_CODE' field to be available on error.data.MSS_CODE on the frontend.
        // It's meant to be used when the backend needs to send a specific error code.
        ...(error?.cause !== undefined && 'MSS_CODE' in error.cause
          ? { MSS_CODE: error.cause.MSS_CODE }
          : {})
      }
    }
  }
})

export const { router, createCallerFactory } = t

const localDevelopmentMiddleware = t.middleware(async opts => {
  const start = Date.now()
  const result = await opts.next()
  const durationMs = Date.now() - start
  // eslint-disable-next-line no-console
  console.log(
    picocolors.bgCyan(picocolors.bold(picocolors.whiteBright(' tRPC '))),
    picocolors.dim(opts.type.charAt(0).toUpperCase() + opts.type.slice(1)),
    '|',
    picocolors.underline(opts.path),
    '|',
    picocolors.bold(durationMs + 'ms'),
    durationMs > 100 ? '❌' : durationMs > 50 ? '⚠️' : '✅'
  )
  return result
})

const baseMiddleware = shouldLog('trpc')
  ? localDevelopmentMiddleware.unstable_pipe
  : t.middleware

/**
 * Reusable middleware to ensure
 * users are logged in
 */
const userMiddleware = baseMiddleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Not authenticated'
    })
  }
  if (ctx.user.status !== 'Active') {
    throw forbiddenError('User status non active')
  }
  return next({
    ctx: {
      // infers the user as non-nullable
      user: { ...ctx.user, structureId: ctx.user.structure?.id || null }
    }
  })
})

const loggingMiddleware = userMiddleware.unstable_pipe(async opts => {
  const result = await opts.next()
  if (!useRuntimeConfig().logs.activateRequestLogging) {
    return result
  }
  const log = opts.ctx.event.context.logger
  if (result.ok) {
    log.info(
      { path: opts.path, type: opts.type, ok: true },
      TRPC_REQUEST_LOG_MSG
    )
  } else {
    log.info(
      {
        path: opts.path,
        type: opts.type,
        ok: false,
        err_code: result.error.code
      },
      TRPC_REQUEST_LOG_MSG
    )
  }
  return result
})

const structureMiddleware = loggingMiddleware.unstable_pipe(({ ctx, next }) => {
  if (ctx.user.role === 'Administrator' || !ctx.user.structure?.id) {
    throw forbiddenError('User routes are not available to admins')
  }
  if (!ctx.user.structure?.id) {
    throw forbiddenError('User is not part of any structure')
  }
  return next({
    ctx: {
      // infers the user as part of structure
      user: { ...ctx.user, structureId: ctx.user.structure.id },
      structure: ctx.user.structure
    }
  })
})

const adminMiddleware = loggingMiddleware.unstable_pipe(({ ctx, next }) => {
  if (ctx.user.role !== 'Administrator') {
    throw forbiddenError('User is not an administrator')
  }
  return next({
    ctx: {
      user: { ...ctx.user, role: UserRole.Administrator }
    }
  })
})

/**
 * Review app only: the Cross-Structure Observer reads the statistics of every
 * structure. The user is rewritten to an admin inside this procedure only, so
 * the constraints return every structure; nothing is stored as admin.
 *
 * `structure` is a placeholder: `createRoute.execute` refuses a context
 * without one, and the reused stat handlers only read `ctx.user`. Any handler
 * reading `ctx.structure` would get this placeholder, so only wire handlers
 * that never read it.
 */
const crossStructureMiddleware = loggingMiddleware.unstable_pipe(
  ({ ctx, next }) => {
    return next({
      ctx: {
        user: { ...ctx.user, role: UserRole.Administrator, structureId: null },
        structure: {
          id: '',
          type: StructureType.Ccas,
          externalRdvspActive: false
        }
      }
    })
  }
)

// FIXME: There is no way to infer the context type of protectedProcedure
export type AuthContext = {
  event: H3Event
  user: SecurityRuleGrantee
}

/**
 * App procedure
 */

export const protectedProcedure = t.procedure.use(structureMiddleware)

export type ProtectedAppContext = AuthContext & {
  structure: SecurityRuleStructure
}

/**
 * Cross-structure statistics procedure (review app only)
 */

export const crossStructureProcedure = t.procedure.use(crossStructureMiddleware)

/**
 * Admin procedure
 */

export const adminProcedure = t.procedure.use(adminMiddleware)

export type AdminContext = {
  event: H3Event
  user: SecurityRuleGrantee & { role: (typeof UserRole)['Administrator'] }
}

/** Server side calls for tests */
export const test = {
  createCallerFactory
}
