import type { SecurityRuleContext, SecurityRuleGrantee } from '../rules'
import type { SecurityRuleStructure } from '../rules/types'
import { getGranteRole } from '../rules/helpers'

export type AppContextPermissions = {
  view: {
    admin: boolean
    cgu: {
      asManager: boolean
    }
  }
  export: {
    history: boolean
  }
  edit: {
    structure: boolean
    structureTypeSurvey: boolean
    health: {
      nir: boolean
    }
    beneficiary: {
      referent: boolean
    }
  }
  archiveBeforeDelay: {
    // Allows to archive before inactivity threshold
    // The per beneficiary authorization is available in permissions.service.ts/getArchivePermissions
    beneficiary: boolean
  }
  module: {
    users: boolean // User management
    statsByReferent: boolean
    health: boolean
    ministere: boolean
    helpRequest: boolean
    partner: boolean
    vulnerablePerson: boolean
    budget: boolean
    rdv: boolean
  }
  workshop: {
    duplicateParticipants: boolean
  }
}

export function getAppContextPermissions({
  user,
  structure
}: {
  user: SecurityRuleGrantee
  structure: SecurityRuleStructure | null | undefined
}) {
  if (structure && user.role !== 'Administrator') {
    return getUserContextPermissions({ user, structure })
  }
  return getAdminContextPermissions()
}

function getAdminContextPermissions(): AppContextPermissions {
  return {
    view: {
      admin: true,
      cgu: {
        asManager: false
      }
    },
    export: {
      history: false
    },
    edit: {
      structure: true,
      structureTypeSurvey: false,
      health: {
        nir: false
      },
      beneficiary: {
        referent: false
      }
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
  }
}

function getUserContextPermissions(
  ctx: SecurityRuleContext
): AppContextPermissions {
  const {
    manager,
    socialWorker,
    instructor,
    referent,
    receptionAgent,
    // Structure types
    ministryAgent,
    ngo,
    cias,
    ccas,
    city
  } = getGranteRole(ctx)
  const hasRdvAccess = ctx.structure.externalRdvspActive || false

  return {
    view: {
      admin: false,
      cgu: {
        asManager: manager
      }
    },
    export: {
      history: manager || socialWorker || referent || instructor
    },
    edit: {
      structure: manager,
      structureTypeSurvey: manager,
      health: {
        nir: cias || ccas || city
      },
      beneficiary: {
        referent: manager || socialWorker || referent || instructor
      }
    },
    archiveBeforeDelay: {
      beneficiary: manager
    },
    module: {
      users: manager,
      statsByReferent: socialWorker || manager,
      health: true,
      ministere: ministryAgent,
      helpRequest: manager || socialWorker || instructor || referent,
      partner: manager || socialWorker,
      vulnerablePerson: !ngo && !ministryAgent,
      budget: !receptionAgent,
      rdv: hasRdvAccess
    },
    workshop: {
      duplicateParticipants: !referent
    }
  }
}
