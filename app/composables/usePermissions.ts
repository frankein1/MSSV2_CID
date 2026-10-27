import type { AppContextPermissions } from '~~/server/security'

export const defaultPermissions = (): AppContextPermissions => ({
  view: {
    admin: false,
    cgu: { asManager: false }
  },
  export: {
    history: false
  },
  edit: {
    structure: false,
    structureTypeSurvey: false,
    health: { nir: false },
    beneficiary: { referent: false }
  },
  archiveBeforeDelay: {
    beneficiary: false
  },
  module: {
    users: false,
    statsByReferent: false,
    health: false,
    ministere: false,
    helpRequest: false,
    partner: false,
    vulnerablePerson: false,
    budget: false,
    rdv: false
  },
  workshop: {
    duplicateParticipants: false
  }
})

export function usePermissions() {
  const application = useState<AppContextPermissions>(
    'permissions:app',
    defaultPermissions
  )

  function reset() {
    application.value = defaultPermissions()
  }

  return { application, reset }
}
