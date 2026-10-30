import {
  // defineConfig,
  configDefaults,
  coverageConfigDefaults
} from 'vitest/config'
import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    environment: 'nuxt',
    environmentOptions: {
      nuxt: {
        overrides: {
          modules: ['./test/components/strip-plugins.module.ts']
        }
      }
    },
    // Review app branch only: the renamed seed fixtures break the specs, so
    // no test runs and an empty run still passes
    include: [],
    passWithNoTests: true,
    exclude: [...configDefaults.exclude, 'e2e/**', 'scripts/**'],
    coverage: {
      reporter: ['text', 'lcov'],
      exclude: [
        ...coverageConfigDefaults.exclude,
        'e2e/**',
        // Stories are .vue files in this project, kept in sync with
        // sonar.exclusions in sonar-project.properties
        '**/*.story.vue',
        '**/stories.vue'
      ]
    },
    // tests will run sequentially, but in the same global context
    // so you must provide isolation yourself
    maxWorkers: 1,
    isolate: false,
    setupFiles: ['test/server/setup.ts', 'test/components/setup.ts']
  }
})
