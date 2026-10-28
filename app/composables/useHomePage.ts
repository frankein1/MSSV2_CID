import { routes } from '~/utils/routes'

// Review app (Pilotage territorial): the panel is the only home page
export function useHomePage() {
  return routes.crossStructure.PilotageTerritorial.path()
}
