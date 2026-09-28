// ANONYMIZED: host, description removed from Workshop; firstName, lastName, email, phone, birthDate from WorkshopExternalAttendee
export const workshopLabels = {
  id: 'Identifiant',
  name: 'Nom de l’atelier / thématique',
  date: 'Date',
  startTime: 'Heure de début',
  endTime: 'Heure de fin',
  location: 'Lieu',
  partnerOrganizationId: 'Partenaire ou organisme financeur',
  supportProgramNameId: "Dispositif ou axe d'intervention",
  host: 'Personne intervenante',
  sessionName: 'Nom ou numéro de cette séance',
  description: 'Description / notes',
  attendeeLimit: 'Nombre de personnes participantes',
  ageLimitCondition: "Conditions d'âge (à titre informatif)",
  ageLimit: 'Âge (ans)',
  chargeable: 'Atelier payant'
} as const

export const workshopAttendeeLabels = {
  paymentReceived: 'Règlement',
  paymentAmount: 'Montant'
}

export const workshopExternalAttendeeLabels = {
  id: 'Identifiant',
  firstName: 'Prénom',
  lastName: 'Nom',
  gender: 'Genre',
  email: 'Email',
  phone: 'Téléphone',
  birthDate: 'Date de naissance',
  city: 'Ville'
} as const
