import { setUser } from '@sentry/node'
import { ID_CROSS_STRUCTURE_OBSERVER } from '~~/server/lib/crossStructureObserver'

declare module 'h3' {
  interface H3EventContext {
    auth?: {
      userId: string
    }
  }
}

// Review app only: every visitor runs as the seeded Cross-Structure Observer.
// If the persona is not seeded, the bypass fails closed.
export default defineEventHandler(event => {
  // Any session cookie, valid or not, is ignored
  event.context.auth = { userId: ID_CROSS_STRUCTURE_OBSERVER }
  setUser({ id: ID_CROSS_STRUCTURE_OBSERVER })
})
