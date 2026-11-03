import { httpBatchLink, createTRPCNuxtClient } from 'trpc-nuxt/client'
import superjson from 'superjson'
import type { AppRouter } from '~~/server/trpc/routers'
import { splitLink } from '@trpc/client'
import { headerAllowlist } from '~/utils/api/header-allowlist'

export default defineNuxtPlugin(() => {
  // Read once here, in the plugin's synchronous Nuxt context. The batch link calls
  // headers() from a setTimeout, where useRequestHeaders() would throw NUXT_E1001
  // during SSR since the Nuxt instance is no longer available (no asyncContext).
  const headers = headerAllowlist()

  const batchLinkOptions = {
    // Relative URL so that SSR calls stay in-process instead of leaving the dyno
    // and coming back through the router under the shared egress IP
    url: '/api/trpc',
    transformer: superjson,
    // Allowlist only: forwarding every request header would also pass a stale
    // host / content-length / client x-forwarded-for to the in-process SSR call.
    // x-real-ip keeps SSR calls rate-limited per client.
    headers() {
      return headers
    }
  }
  const client = createTRPCNuxtClient<AppRouter>({
    links: [
      splitLink({
        condition(operation) {
          // Stats queries should always use POST to avoid URL length issues, when using a lot of filters
          const shouldUsePOST =
            operation.type === 'query' && operation.path.startsWith('stat.')
          return shouldUsePOST
        },
        // force POST method
        true: httpBatchLink({
          ...batchLinkOptions,
          methodOverride: 'POST',
          maxItems: 1
        }),
        // regular requests
        false: httpBatchLink(batchLinkOptions)
      })
    ]
  })

  return {
    provide: {
      trpcClient: client
    }
  }
})
