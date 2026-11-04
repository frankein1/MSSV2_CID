export enum EventCategory {
  BeneficiaryFilter = 'Filtre Bénéficiaires',
  BeneficiaryHistoryFilter = "Filtre Historique d'un bénéficiaire",
  FollowupFilter = 'Filtre Entretien',
  HelpRequestFilter = "Filtre Demande d'aide",
  StatFilter = 'Filtre Statistiques',
  Document = 'Document',
  CreateBeneficiary = 'Créer un bénéficiaire',
  UsersActivity = 'Historique des changements',
  AccessBeneficiaryAdd = 'Accès à Créer un bénéficiaire',
  ExportBeneficiary = 'Export des bénéficiaires',
  ExportHistory = 'Export des accompagnements',
  OverviewToHistory = 'Accès Tableau de bord > Accompagnements',
  History = 'Historique',
  Beneficiary = 'Beneficiaire',
  ExportStats = 'Export des statistiques',
  ExportBudget = 'Export du budget',
  BeneficiaryArchive = 'Archive Bénéficiaire',
  FamilyFile = 'Dossier Foyer',
  FollowupForm = 'Formulaire Entretien',
  CreateFollowup = 'Créer une synthèse',
  Workshop = 'Atelier',
  User = 'Utilisateur'
}

export enum FamilyFileAction {
  CreateBeneficiary = 'Créer un bénéficiaire',
  LinkBeneficiary = 'Lier un bénéficiaire',
  CopyAccommodation = `Copier les infos d'hébèrgement d'un membre du foyer`
}

export enum BeneficiaryFilterEventAction {
  SocialSupportSubject = "Type d'accompagnement",
  Referent = 'Référent',
  City = 'Ville',
  Status = 'Statut',
  AgeGroup = "Tranche d'âge",
  VulnerablePerson = 'Registre des personnes vulnérables',
  NotFilled = 'Champ non renseigné',
  QPV = 'Quartier prioritaire de la politique de la ville',
  MinistereDepartementServiceAc = "Département ou service de l'Administration Centrale",
  MinistereStructure = 'Structure de rattachement',
  SupportProgram = "Dispositifs ou axes d'intervention concernés"
}

export enum BeneficiaryHistoryAction {
  Print = 'Imprimer',
  PrintAllHelpRequest = 'Imprimer - Instruction de dossier',
  PrintFinancialHelpRequest = 'Imprimer - Instruction de dossier - Aide financière',
  PrintHousingHelpRequest = 'Imprimer - Instruction de dossier -Demande de logement',
  PrintOtherHelpRequest = 'Imprimer - Instruction de dossier - Autre',
  PrintFollowup = "Imprimer - Synthèse d'entretien",
  PlanAppointment = 'Prendre rendez-vous pour un bénéficiaire',
  UpdateAppointment = 'Modifier le rendez-vous dans RDV Service Public',
  ReconnectToRdsvp = "Se reconnecter à l'intégration RDVSP",
  SearchDoraStructure = 'Recherche un acteur du territoire sur Dora',
  UpdateAppointmentStatus = 'Modifier le statut du rendez-vous'
}

export enum BeneficiaryAction {
  Print = 'Imprimer',
  Split = 'Dissocier',
  ExportAll = 'Exporter tous les bénéficiaires',
  MassReferentTransferRemoval = "Transfert massif d'agent référent / Supression",
  MassReferentTransferAddition = "Transfert massif d'agent référent / Ajout"
}

export enum BeneficiaryHistoryFilterEventAction {
  TypeSuivi = 'Type de suivi',
  SocialSupportSubject = "Type d'accompagnement",
  Referent = 'Référent',
  InvolvedBeneficiary = 'Bénéficiaire concerné',
  SupportProgram = "Dispositifs ou axes d'intervention concernés"
}

export enum BeneficiaryArchiveAction {
  ExportArchive = "Export de l'archive",
  DeleteWithoutArchive = 'Suppression sans archive',
  DeleteWithArchiveAndKeepName = 'Suppression avec archive et conservation du nom',
  DeleteWithArchive = 'Suppression avec archive sans conservation du nom',
  DelayArchive = 'Conserver 1 an supplémentaire'
}

export enum FollowupFilterEventAction {
  Status = 'Statut',
  Medium = "Type d'entretien",
  SocialSupportSubject = "Objet de l'entretien",
  Agent = 'Agent',
  Period = 'Période',
  Ministre = 'Ministre',
  NotFilled = 'Champ non renseigné',
  MinistereDepartementServiceAc = "Département ou service de l'Administration Centrale",
  MinistereStructure = 'Structure de rattachement'
}

export enum FollowupFormAction {
  SocialSupportSubjectLink = "Vers page Personnalisation d'objet d'accompagnement",
  PartnersLink = 'Vers page Annuaire de partenaires'
}
export enum FollowupAction {
  CreateFromBeneficiarySearch = 'Depuis la recherche bénéficiaire'
}

export enum HelpRequestFilterEventAction {
  FileInstructionType = "Type de dossier d'instruction",
  Status = 'Statut',
  SocialSupportSubject = 'Objet de la demande',
  ExaminationDate = 'Date de passage en commission',
  Agent = 'Agent',
  Ministre = 'Ministre',
  RoomCount = 'Nombre de pièces',
  LowIncomeHousingType = 'Logement à loyer modéré',
  NotFilled = 'Champ non renseigné',
  Period = 'Période',
  MinistereDepartementServiceAc = "Département ou service de l'Administration Centrale",
  MinistereStructure = 'Structure de rattachement'
}

export enum StatFilterEventAction {
  HelpRequestSubject = "Thématique d'instruction",
  Period = 'Période',
  SocialSupportSubject = "Objet de l'accompagnement",
  City = 'Ville',
  SupportProgram = "Dispositifs ou axes d'intervention concernés",
  Referent = 'Référent',
  BeneficiaryStatus = 'Statut du bénéficiaire',
  Agent = 'Agent',
  Minister = 'Ministre',
  MinistryDepartementServiceAc = "Département ou service de l'Administration Centrale",
  MinistryStructure = 'Structure de rattachement',
  AgeGroup = "Tranche d'âge",
  QPV = 'Quartier prioritaire de la politique de la ville',
  Employer = 'Employeur',
  School = 'Établissement scolaire fréquenté'
}

export enum DocumentEventAction {
  See = 'Voir',
  Download = 'Télécharger',
  Edit = 'Modifier'
}

export enum CreateBeneficiaryEventAction {
  SaveForm = 'Enregistrer Formulaire',
  SaveAndCompleteForm = 'Enregistrer Formulaire et compléter'
}

export enum UserActivityEventAction {
  ExpandBeneficiaries = 'Déplie Bénéficiaires'
}

export enum AccessBeneficiaryAddEventAction {
  FromOverview = 'Depuis Tableau de bord'
}

export enum ExportHistoryEventAction {
  Followups = "Export Synthèses d'entretien",
  FileInstructions = "Export Dossiers d'instruction"
}

export enum OverviewToHistoryEventAction {
  Todo = "Synthèses d'entretien - À traiter",
  InProgress = "Synthèses d'entretien - En cours",
  WaitingAdditionalInformation = "Dossiers d'instruction - En attente de justificatifs",
  InvestigationOngoing = "Dossiers d'instruction - En cours d'instruction",
  RdvSeen = 'Rendez-vous - Honoré',
  RdvNoShow = 'Rendez-vous - Absence non excusée',
  RdvExcused = "Rendez-vous - Annulé à l'initiative de l'usager",
  RdvRevoked = "Rendez-vous - Annulé à l'initiative du service",
  RdvDraft = 'Rendez-vous - Brouillon',
  RdvUnknown = 'Rendez-vous - Inconnu'
}

export enum ExportEventAction {
  DownloadExcel = 'Télécharger en document Excel',
  DownloadBeneficiaryStatsImages = 'Export des stats Bénéficiaires en images',
  DownloadBeneficiaryStatsExcel = 'Export des stats Bénéficiaires en document Excel',
  DownloadFolloupStatsImages = 'Export des stats Entretiens en images',
  DownloadFolloupStatsExcel = 'Export des stats Entretiens en document Excel',
  DownloadHelpRequestStatsImages = 'Export des stats Instructions de dossier en images',
  DownloadHelpRequestStatsExcel = 'Export des stats Instructions de dossier en document Excel',
  DownloadWorkshopStatsImages = 'Export des stats Ateliersen images',
  DownloadWorkshopStatsExcel = 'Export des stats Ateliers en document Excel',
  DownloadSupportProgramStatsImages = 'Export des stats Parcours et dispositifs en images',
  DownloadSupportProgramStatsExcel = 'Export des stats Parcours et dispositifs en document Excel'
}

export enum WorkshopAction {
  ChangeOneName = "Modifier un seul nom d'atelier",
  ChangeAllNames = "Modifier tous les noms d'atelier",
  RemoveAttendee = 'Supprimer un participant',
  TransferAttendee = 'Transférer un participant',
  DownloadPresenceList = 'Télécharger la liste de présence',
  DeleteWorkshop = 'Supprimer un atelier',
  DuplicateWorkshopAndChangeDateTime = 'Dupliquer un atelier en changeant l’heure',
  DuplicateWorkshop = 'Dupliquer un atelier',
  DuplicateWorkshopAndParticipants = 'Dupliquer un atelier et ses participants',
  DuplicateWorkshopWithoutParticipants = 'Dupliquer un atelier sans les participants',
  RegisterToOneWorkshop = 'Inscription à un atelier',
  RegisterToManyWorkshops = 'Inscription à plusieurs ateliers'
}

export enum UserAction {
  DeleteUser = 'Supprimier un utilisateur'
}

export type EventAction =
  | BeneficiaryFilterEventAction
  | BeneficiaryHistoryFilterEventAction
  | FollowupFilterEventAction
  | HelpRequestFilterEventAction
  | StatFilterEventAction
  | DocumentEventAction
  | CreateBeneficiaryEventAction
  | UserActivityEventAction
  | AccessBeneficiaryAddEventAction
  | ExportHistoryEventAction
  | OverviewToHistoryEventAction
  | BeneficiaryHistoryAction
  | BeneficiaryAction
  | ExportEventAction
  | BeneficiaryArchiveAction
  | FamilyFileAction
  | FollowupFormAction
  | FollowupAction
  | WorkshopAction
  | UserAction

export type MatomoApi = {
  trackEvent: (category: EventCategory, action: EventAction) => void
}
