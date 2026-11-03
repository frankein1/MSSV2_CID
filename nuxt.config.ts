// https://github.com/prisma/prisma/issues/12504#issuecomment-1372635653
import { createRequire } from 'module'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { MAX_UPLOAD_SIZE_BYTES } from './app/utils/constants'

const prismaClientPath = createRequire(import.meta.url).resolve(
  '@prisma/client'
)

const connectSrcCsp = [
  "'self'",
  'https://data.geopf.fr',
  'https://geo.api.gouv.fr',
  // FIXME: Use runtime config once it is allowed by nuxt-security - See https://github.com/Baroshem/nuxt-security/pull/233
  'https://matomo.dev.incubateur.anct.gouv.fr',
  'https://matomo.incubateur.anct.gouv.fr',
  'https://sentry.incubateur.net',
  'https://conversations-widget.brevo.com/'
]

export default defineNuxtConfig({
  // https://nuxt.com/blog/v3-8
  typescript: {
    tsConfig: {
      compilerOptions: {
        verbatimModuleSyntax: true,
        noUncheckedIndexedAccess: true
      },
      // Nuxt 4's app tsconfig only scans app/ by default — e2e/ needs to be
      // added explicitly so editors resolve ~ aliases in Playwright specs.
      include: ['../e2e/**/*']
    }
  },

  // Global CSS: https://go.nuxtjs.dev/config-css
  css: [
    // DSFR STYLES
    '@gouvfr/dsfr/dist/core/core.min.css',
    '@gouvfr/dsfr/dist/dsfr.print.css',
    '@gouvfr/dsfr/dist/component/accordion/accordion.min.css',
    '@gouvfr/dsfr/dist/component/alert/alert.min.css',
    '@gouvfr/dsfr/dist/component/badge/badge.min.css',
    '@gouvfr/dsfr/dist/component/breadcrumb/breadcrumb.min.css',
    '@gouvfr/dsfr/dist/component/button/button.min.css',
    '@gouvfr/dsfr/dist/component/callout/callout.min.css',
    '@gouvfr/dsfr/dist/component/card/card.min.css',
    '@gouvfr/dsfr/dist/component/checkbox/checkbox.min.css',
    '@gouvfr/dsfr/dist/component/connect/connect.min.css',
    '@gouvfr/dsfr/dist/component/content/content.min.css',
    '@gouvfr/dsfr/dist/component/download/download.min.css',
    '@gouvfr/dsfr/dist/component/footer/footer.min.css',
    '@gouvfr/dsfr/dist/component/form/form.min.css',
    '@gouvfr/dsfr/dist/component/header/header.min.css',
    '@gouvfr/dsfr/dist/component/input/input.min.css',
    '@gouvfr/dsfr/dist/component/link/link.min.css',
    '@gouvfr/dsfr/dist/component/logo/logo.min.css',
    '@gouvfr/dsfr/dist/component/modal/modal.min.css',
    '@gouvfr/dsfr/dist/component/navigation/navigation.min.css',
    '@gouvfr/dsfr/dist/component/pagination/pagination.min.css',
    '@gouvfr/dsfr/dist/component/quote/quote.min.css',
    '@gouvfr/dsfr/dist/component/radio/radio.min.css',
    '@gouvfr/dsfr/dist/component/search/search.min.css',
    '@gouvfr/dsfr/dist/component/select/select.min.css',
    '@gouvfr/dsfr/dist/component/sidemenu/sidemenu.min.css',
    '@gouvfr/dsfr/dist/component/tab/tab.min.css',
    '@gouvfr/dsfr/dist/component/table/table.min.css',
    '@gouvfr/dsfr/dist/component/tag/tag.min.css',
    '@gouvfr/dsfr/dist/component/toggle/toggle.min.css',
    '@gouvfr/dsfr/dist/component/tooltip/tooltip.min.css',
    '@gouvfr/dsfr/dist/component/notice/notice.min.css',
    '@gouvfr/dsfr/dist/component/segmented/segmented.min.css',
    '@gouvfr/dsfr/dist/component/skiplink/skiplink.min.css',

    // DSFR ICONS
    '@gouvfr/dsfr/dist/utility/icons/icons-buildings/icons-buildings.min.css',
    '@gouvfr/dsfr/dist/utility/icons/icons-business/icons-business.min.css',
    '@gouvfr/dsfr/dist/utility/icons/icons-communication/icons-communication.min.css',
    '@gouvfr/dsfr/dist/utility/icons/icons-design/icons-design.min.css',
    '@gouvfr/dsfr/dist/utility/icons/icons-document/icons-document.min.css',
    '@gouvfr/dsfr/dist/utility/icons/icons-media/icons-media.min.css',
    '@gouvfr/dsfr/dist/utility/icons/icons-system/icons-system.min.css',
    '@gouvfr/dsfr/dist/utility/icons/icons-user/icons-user.min.css',
    '@gouvfr/dsfr/dist/utility/icons/icons-map/icons-map.min.css',
    '@gouvfr/dsfr/dist/utility/icons/icons-device/icons-device.min.css',
    '@gouvfr/dsfr/dist/utility/icons/icons-finance/icons-finance.min.css',
    '@gouvfr/dsfr/dist/utility/icons/icons-weather/icons-weather.min.css',
    '@gouvfr/dsfr/dist/utility/icons/icons-others/icons-others.min.css',
    '@gouvfr/dsfr/dist/utility/icons/icons-arrows/icons-arrows.min.css',

    // GLOBAL STYLES
    '@/assets/style/main.scss',
    '@/assets/style/button.scss',
    '@/assets/style/icons.css',
    '@/assets/style/tab.scss',
    '@/assets/style/stats.scss',
    '@/assets/style/form.scss',
    '@/assets/style/menu.scss',
    '@/assets/style/dsfr-default.scss'
  ],

  // Modules: https://v3.nuxtjs.org/api/configuration/nuxt.config#modules
  modules: [
    '@vee-validate/nuxt',
    'nuxt-security',
    'vue-dsfr-nuxt-module',
    '@nuxt/eslint',
    '@nuxt/test-utils/module'
  ],

  // trpc-nuxt's client types import AsyncData/AsyncDataOptions from #imports,
  // but Nuxt only generates that facade entry for names it detects in app code.
  // Without this, the missing types silently degrade to `any` under skipLibCheck.
  imports: {
    imports: [
      { name: 'AsyncData', type: true, from: '#app' },
      { name: 'AsyncDataOptions', type: true, from: '#app' }
    ]
  },
  app: {
    head: {
      meta: [{ name: 'robots', content: 'noindex' }]
    }
  },
  // Build Configuration: https://go.nuxtjs.dev/config-build
  vite: {
    server: {
      ws: {
        // Fix websocket errors cf. https://github.com/nuxt/nuxt/discussions/27779
        clientPort: 3000
      }
    },
    // Adds sourcemaps for Sentry (may not work)
    build: {
      sourcemap: true
    },
    // https://github.com/nuxt/nuxt/issues/24196
    optimizeDeps: {
      include: [
        '@prisma/client',
        'vee-validate',
        '@vee-validate/zod',
        'zod',
        'vue-scrollto',
        'node-fetch-native',
        '@vueuse/core',
        '@trpc/client',
        '@gouvminint/vue-dsfr',
        'html-to-image',
        '@zip.js/zip.js',
        '@tiptap/vue-3',
        '@tiptap/starter-kit',
        '@tiptap/extension-link',
        '@tiptap/pm/model',
        '@braintree/sanitize-url',
        'remove-accents',
        '@turf/turf'
      ]
    },
    css: {
      preprocessorOptions: {
        scss: {
          loadPaths: [
            resolve(dirname(fileURLToPath(import.meta.url)), 'node_modules'),
            resolve(
              dirname(fileURLToPath(import.meta.url)),
              'node_modules/@gouvfr/dsfr'
            )
          ],
          silenceDeprecations: ['import', 'global-builtin'],
          quietDeps: true
        }
      },
      // DSFR ships legacy IE `\0` media query hacks that lightningcss
      // (Vite's default CSS minifier) rejects outright rather than stripping.
      lightningcss: {
        errorRecovery: true
      }
    },
    resolve: {
      alias: {
        '.prisma/client/index-browser': prismaClientPath.replace(
          '@prisma/client/default.js',
          '.prisma/client/index-browser.js'
        )
      }
    }
  },

  build: {
    transpile: ['trpc-nuxt']
  },

  ignore: [
    '**/*.stories.{js,cts,mts,ts,jsx,tsx}',
    '**/*.{spec,test}.{js,cts,mts,ts,jsx,tsx}',
    '**/*.d.{cts,mts,ts}',
    '**/.{pnpm-store,vercel,netlify,output,git,cache,data}',
    '**/*.sock',
    '.nuxt/analyze',
    '.nuxt',
    '**/-*.*',
    '**/*.story.{js,cts,mts,ts,jsx,tsx}',
    'scheduler'
  ],

  runtimeConfig: {
    auth: {
      jwtKey: process.env.NUXT_AUTH_JWT_KEY,
      sessionSecret: process.env.NUXT_AUTH_SESSION_SECRET,
      proconnectIssuer: process.env.NUXT_AUTH_PROCONNECT_ISSUER_URL,
      proconnectClientId: process.env.NUXT_AUTH_PROCONNECT_CLIENT_ID,
      proconnectClientSecret: process.env.NUXT_AUTH_PROCONNECT_CLIENT_SECRET,
      proconnectSigningAlgorithm:
        process.env.NUXT_AUTH_PROCONNECT_SIGNING_ALGORITHM || 'RS256',
      proconnectProvider: 'ProConnect',
      proconnectLabel: 'proconnect'
    },
    rdvsp: {
      issuer: process.env.NUXT_RDVSP_ISSUER || '',
      clientId: process.env.NUXT_RDVSP_CLIENT_ID || '',
      clientSecret: process.env.NUXT_RDVSP_CLIENT_SECRET || ''
    },
    brevo: {
      apiKey: process.env.NUXT_BREVO_API_KEY || ''
    },
    dataInclusion: {
      apiUrl: process.env.NUXT_DATA_INCLUSION_API_URL || '',
      apiToken: process.env.NUXT_DATA_INCLUSION_API_TOKEN || ''
    },
    email: {
      smtpHost: process.env.NUXT_EMAIL_SMTP_HOST || '',
      smtpPassword: process.env.NUXT_EMAIL_SMTP_PASSWORD || '',
      smtpPort: parseInt(process.env.NUXT_EMAIL_SMTP_PORT || '587'),
      smtpSecure: (process.env.NUXT_EMAIL_SMTP_SECURE || 'false') === 'true',
      smtpUser: process.env.NUXT_EMAIL_SMTP_USER || ''
    },
    s3: {
      accessKeyId: process.env.NUXT_S3_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.NUXT_S3_SECRET_ACCESS_KEY || '',
      region: process.env.NUXT_S3_REGION || '',
      bucket: process.env.NUXT_S3_BUCKET || '',
      endpoint: process.env.NUXT_S3_ENDPOINT || '',
      forcePathStyle:
        (process.env.NUXT_S3_FORCE_PATH_STYLE || 'false') === 'true'
    },
    kms: {
      accessKeyId: process.env.NUXT_KMS_ACCESS_KEY_ID || '',
      secretKey: process.env.NUXT_KMS_SECRET_KEY || '',
      organizationId: process.env.NUXT_KMS_ORGANIZATION_ID || '',
      projectId: process.env.NUXT_KMS_PROJECT_ID || '',
      region: process.env.NUXT_KMS_REGION || '',
      apiUrl: process.env.NUXT_KMS_API_URL || '',
      keyId: process.env.NUXT_KMS_KEY_ID || ''
    },
    logs: {
      level: process.env.NUXT_LOGS_LEVEL || 'info',
      activateRequestLogging:
        (process.env.NUXT_LOGS_ACTIVATE_REQUEST_LOGGING ?? 'true') === 'true'
    },
    document: {
      useS3Storage:
        (process.env.NUXT_DOCUMENT_USE_S3_STORAGE || 'false') === 'true',
      encryptionVersion: '1',
      encryptionAlgorithm: 'aes_256_gcm'
    },
    public: {
      version: {
        commitSha: process.env.COMMIT_SHA || '',
        commitRefName: process.env.COMMIT_REF_NAME || '',
        commitTag: process.env.COMMIT_TAG || ''
      },
      cguVersion: '1.2',
      appUrl: process.env.NUXT_PUBLIC_APP_URL,
      landingPageUrl: process.env.NUXT_PUBLIC_LANDING_PAGE_URL,
      auth: {
        cookieKey: 'MSS_SESSION_TOKEN',
        tokenValidationInMinutes: parseInt(
          process.env.TOKEN_VALIDATION_IN_MINUTES || '60'
        )
      },
      disconnect: {
        threshold: parseInt(process.env.DISCONNECT_THRESHOLD || '60'),
        alertThreshold: parseInt(process.env.DISCONNECT_ALERT_THRESHOLD || '5')
      },
      matomo: {
        host: process.env.NUXT_PUBLIC_MATOMO_HOST,
        siteId: parseInt(process.env.NUXT_PUBLIC_MATOMO_SITE_ID || '1')
      },
      mssEnvironment: process.env.NUXT_PUBLIC_MSS_ENVIRONMENT || 'local',
      email: {
        from: process.env.NUXT_PUBLIC_EMAIL_FROM || ''
      },
      sentry: {
        dsn: process.env.NUXT_PUBLIC_SENTRY_DSN,
        debug: (process.env.SENTRY_DEBUG || 'false') === 'true',
        tracesSampleRate: parseFloat(
          process.env.NUXT_PUBLIC_SENTRY_TRACE_SAMPLE_RATE || '0.1'
        )
      },
      metabase: {
        publicUrl: process.env.NUXT_PUBLIC_METABASE_PUBLIC_URL
      },
      dataInclusion: {
        token: process.env.NUXT_PUBLIC_DATA_INCLUSION_TOKEN
      }
    }
  },

  // Prevent nuxt to export types.ts files as components
  components: [
    {
      path: '~/components',
      pathPrefix: false,
      extensions: ['.vue']
    }
  ],

  // Adds sourcemaps for Sentry (may not been working until releases and auth token are used)
  sourcemap: {
    client: true,
    server: true
  },

  security: {
    removeLoggers: false,
    headers: {
      contentSecurityPolicy:
        process.env.NODE_ENV === 'production'
          ? { 'connect-src': connectSrcCsp }
          : false,
      crossOriginEmbedderPolicy: false
    },
    // Resolve the client IP from the nginx-forwarded X-Real-IP (set from
    // $remote_addr) instead of the default X-Forwarded-For entry which is spoofable.
    // Also applies into the per-route limiters below.
    rateLimiter: {
      tokensPerInterval: 600,
      interval: 300000,
      ipHeader: 'x-real-ip'
    },
    requestSizeLimiter: {
      // 1M
      maxRequestSizeInBytes: 1048576,
      // 20M
      maxUploadFileRequestInBytes: MAX_UPLOAD_SIZE_BYTES,
      throwError: false
    }
  },

  routeRules: {
    '/api/document/upload': {
      security: {
        xssValidator: false
      }
    },
    // The export functionality is limited to 5 calls per minute to prevent brute forcing the validation step
    '/api/trpc/user.authorizeExport': {
      security: {
        rateLimiter: {
          interval: 60_000,
          tokensPerInterval: 5
        }
      }
    },
    // The Proconnect only logout is limited to 2 calls per minute
    '/api/proconnect/proconnect-logout': {
      security: {
        rateLimiter: {
          interval: 60_000,
          tokensPerInterval: 2
        }
      }
    }
  },

  // Deliberately left on the Nuxt 3 era default as of 2026-08-21: bumping it
  // switches on newer Nitro/Nuxt behaviour defaults and needs a full e2e run,
  // so it is tracked as its own task rather than drifting silently.
  compatibilityDate: '2024-08-30'
})
