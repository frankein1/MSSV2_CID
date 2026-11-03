import type { Prisma } from '@prisma/client'

// ANONYMIZED: firstName, lastName, email, authorizationCode, authorizationCodeValidity removed from User
export const userFieldLabels = {
  id: 'Identifiant',
  lastName: 'Nom',
  firstName: 'Prénom',
  email: 'Email',
  role: 'Rôle',
  status: 'Accès',
  aidantConnectAuthorisation: 'Aidants Connect',
  firstAccess: 'Premier accès',
  lastAccess: 'Dernier accès',
  created: 'Date de création',
  updated: 'Date de mise à jour',
  structureId: 'Identifiant de la structure',
  externalRdvspId: 'Identifiant Rendez-vous Service Public',
  authorizationCode: "Code d'autorisation",
  authorizationCodeValidity: "Validité du code d'autorisation",
  accountReminderEmail: "Nombre d'e-mail de rappel de création de compte"
} as const

/**
 * Prisma `_count` key behind each blocking relation. Every restricting foreign
 * key pointing to `user` must be listed here, otherwise the delete fails with
 * an internal error instead of a clear refusal.
 */
export const userBlockingRelationCounts = {
  referentFor: 'referentFor',
  createdDocuments: 'createdDocuments',
  createdSocialSupports: 'createdSocialSupports',
  createdComments: 'createdComments',
  workshops: 'createdWorkshops',
  workshopNames: 'createdWorkshopNames',
  archivedBeneficiaries: 'archivedBeneficiaries',
  redirectionReasons: 'createdRedirectionReasons',
  supportProgramNames: 'createdSupportProgramNames'
} as const satisfies Record<
  UserBlockingRelation,
  keyof Prisma.UserCountOutputTypeSelect
>

export const userBlockingRelationLabels = {
  referentFor: 'dossiers dont la personne est référente',
  createdDocuments: 'documents créés',
  createdSocialSupports: 'accompagnements créés',
  createdComments: 'commentaires créés',
  workshops: 'ateliers créés',
  workshopNames: "noms d'atelier créés",
  archivedBeneficiaries: 'bénéficiaires archivés',
  redirectionReasons: 'motifs de réorientation créés',
  supportProgramNames: "dispositifs ou axes d'intervention créés"
} as const

export type UserBlockingRelation = keyof typeof userBlockingRelationLabels
