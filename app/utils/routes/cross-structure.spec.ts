import { describe, test, expect } from 'vitest'
import { routes } from './cross-structure'

describe('cross-structure routes', () => {
  test('PilotageTerritorial path returns /pilotage-territorial', () => {
    expect(routes.PilotageTerritorial.path()).toBe('/pilotage-territorial')
  })
})
