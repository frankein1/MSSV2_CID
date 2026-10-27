import { AppRoute } from './utils'

const StructureRoute = `${AppRoute}/structure`

export const routes = {
  AppPartners: {
    name: 'AppPartners',
    title: 'Annuaire des partenaires',
    path: () => `${AppRoute}/partners`
  },
  AppStructure: {
    name: 'AppStructure',
    title: 'Configurer votre structure',
    path: () => StructureRoute
  },
  AppStructureUsers: {
    name: 'AppStructureUsers',
    title: 'Utilisateurs',
    path: () => `${StructureRoute}/users`
  },
  AppStructureInfo: {
    name: 'AppStructureInfo',
    title: 'Infos structure',
    path: () => `${StructureRoute}/info`
  },
  AppStructureCustomObjects: {
    name: 'AppStructureCustomObjects',
    title: 'Accompagnements et Dispositifs',
    path: () => `${StructureRoute}/custom-objects`
  },
  AppStructureEdit: {
    name: 'AppStructureEdit',
    title: 'Modifier les informations de votre structure',
    path: () => `${StructureRoute}/edit`
  },
  AppStructureSocialSupportSubjectsEdit: {
    name: 'AppStructureSocialSupportSubjectsEdit',
    title: 'Ajouter un accompagnement',
    path: () => `${StructureRoute}/custom-objects/social-support-subjects/edit`
  },
  AppStructureUserEdit: {
    name: 'AppStructureUserEdit',
    title: (userName: string) => `Modifier le compte de ${userName}`,
    path: (userId: string) => `${StructureRoute}/users/${userId}/edit`
  },
  AppStructureUserDelete: {
    name: 'AppStructureUserDelete',
    title: (userName: string) => `Supprimer le compte de ${userName}`,
    path: (userId: string) => `${StructureRoute}/users/${userId}/delete`
  },
  AppStructureUserAdd: {
    name: 'AppStructureUserAdd',
    title: `Ajouter un nouvel utilisateur`,
    path: () => `${StructureRoute}/users/add`
  },
  AppStructureDora: {
    name: 'AppStructureDora',
    title: `Rechercher un acteur du territoire sur DORA`,
    path: () => `${StructureRoute}/dora`
  },
  AppStructureTypeSurvey: {
    name: 'AppStructureTypeSurvey',
    title: 'Informations sur votre structure',
    path: () => `${StructureRoute}/structure-type`
  }
} as const
