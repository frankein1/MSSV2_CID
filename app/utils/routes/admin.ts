export const AdminRoute = '/admin'

export const routes = {
  Admin: {
    name: 'Admin',
    title: "Mon espace d'administration",
    path: () => `${AdminRoute}`
  },
  AdminOverview: {
    name: 'AdminOverview',
    title: 'Tableau de bord',
    path: () => `${AdminRoute}/overview`
  },
  AdminLogin: {
    name: 'AdminLogin',
    title: '',
    path: () => ''
  },
  AdminStructures: {
    name: 'AdminStructures',
    title: 'Structures',
    path: () => `${AdminRoute}/structures`
  },
  AdminStructureAdd: {
    name: 'AdminStructureAdd',
    title: 'Ajouter une structure',
    path: () => `${AdminRoute}/structures/add`
  },
  AdminStructure: {
    name: 'AdminStructure',
    title: 'Structure',
    path: (structureId: string) => `${AdminRoute}/structures/${structureId}`
  },
  AdminStructureEdit: {
    name: 'AdminStructureEdit',
    title: 'Modifier les informations de la structure',
    path: (structureId: string) =>
      `${AdminRoute}/structures/${structureId}/edit`
  },
  AdminStructureSubjects: {
    name: 'AdminStructureSubjects',
    title: '',
    path: (structureId: string) =>
      `${AdminRoute}/structures/${structureId}/subjects`
  },
  AdminUsers: {
    name: 'AdminUsers',
    title: 'Utilisateurs',
    path: () => `${AdminRoute}/users`
  },
  AdminUsersAdd: {
    name: 'AdminUsersAdd',
    title: 'Ajouter un utilisateur',
    path: () => `${AdminRoute}/users/add`
  },
  AdminUser: {
    name: 'AdminUser',
    title: '',
    path: (userId: string) => `${AdminRoute}/users/${userId}`
  },
  AdminEmails: {
    name: 'AdminEmails',
    title: 'E-mails',
    path: () => `${AdminRoute}/emails`
  },
  AdminMinisters: {
    name: 'AdminMinisters',
    title: 'Ministres',
    path: () => `${AdminRoute}/ministers`
  },
  AdminMinisterAdd: {
    name: 'AdminMinisterAdd',
    title: 'Ajouter un ministre',
    path: () => `${AdminRoute}/ministers/add`
  },
  AdminMinisterEdit: {
    name: 'AdminMinisterEdit',
    title: 'Modifier un ministre',
    path: (ministerId: string) => `${AdminRoute}/ministers/${ministerId}/edit`
  }
} as const
