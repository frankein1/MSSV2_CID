import {
  preparePrescribingOrganizationStats,
  prepareHelpRequestStatFilters
} from '../helpers'
import { SocialSupportRepo } from '~~/server/database'
import type { StatFilterInput } from '~~/server/schema'
import type { SecurityRuleGrantee } from '~~/server/security/rules/types'

export async function getHelpRequestPrescribingOrganizationStatsQuery(
  user: SecurityRuleGrantee,
  input: StatFilterInput
) {
  const preparedFilters = prepareHelpRequestStatFilters(input)

  const socialSupports = await SocialSupportRepo.findMany(user, {
    where: preparedFilters,
    select: {
      fileInstruction: {
        select: {
          helpRequest: {
            select: {
              prescribingOrganization: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          },
          housingHelpRequest: {
            select: {
              prescribingOrganization: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        }
      }
    }
  })

  const requests = []
  for (const { fileInstruction } of socialSupports) {
    if (fileInstruction?.helpRequest) {
      requests.push(fileInstruction.helpRequest)
    } else if (fileInstruction?.housingHelpRequest) {
      requests.push(fileInstruction.housingHelpRequest)
    }
  }

  return preparePrescribingOrganizationStats(requests)
}
