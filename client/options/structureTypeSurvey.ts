import { SurveySocialSupportType, SurveyStructureType } from '@prisma/client'
import { buildKeys } from '~/utils/keys/keyBuilder'

// Keys are declared in alphabetical order of their label, "Autre" last
export const surveyStructureTypeKeys = buildKeys({
  [SurveyStructureType.AcademieRectorat]: 'Académie / Rectorat',
  [SurveyStructureType.Association]: 'Association',
  [SurveyStructureType.Aci]: 'Atelier ou chantier d’insertion (ACI)',
  [SurveyStructureType.CaisseDesEcoles]: 'Caisse des écoles (CE)',
  [SurveyStructureType.Ccas]: 'CCAS',
  [SurveyStructureType.Cdas]: 'CDAS',
  [SurveyStructureType.CentreDeGestion]: 'Centre De Gestion (CDG)',
  [SurveyStructureType.CentreSocial]: 'Centre social',
  [SurveyStructureType.Cias]: 'CIAS',
  [SurveyStructureType.Commune]: 'Commune',
  [SurveyStructureType.Crous]: 'CROUS',
  [SurveyStructureType.Departement]: 'Département / CD',
  [SurveyStructureType.Epci]: 'EPCI / Intercommunalité',
  [SurveyStructureType.Ept]: 'Etablissement Public Territorial (EPT)',
  [SurveyStructureType.GroupementInteretPublic]: 'Groupement d’Intérêt Public',
  [SurveyStructureType.Hopital]: 'Hôpital',
  [SurveyStructureType.Ministere]: 'Ministère',
  [SurveyStructureType.Musee]: 'Musée',
  [SurveyStructureType.Prefecture]: 'Préfecture',
  [SurveyStructureType.RegieAutonome]: 'Régie autonome',
  [SurveyStructureType.Sdis]: 'SDIS',
  [SurveyStructureType.Universite]: 'Université',
  [SurveyStructureType.Autre]: 'Autre...'
})

// Keys are declared in alphabetical order of their label
export const surveySocialSupportTypeKeys = buildKeys({
  [SurveySocialSupportType.InsertionEmploi]: 'Insertion par l’emploi',
  [SurveySocialSupportType.ProgrammeReussiteEducative]:
    'Programme de réussite éducative (PRE)',
  [SurveySocialSupportType.LogementHebergementResidence]:
    'Service logement / hébergement / résidence',
  [SurveySocialSupportType.ServiceSocialPersonnel]:
    'Services social du personnel',
  [SurveySocialSupportType.SuiviEtudiant]: 'Suivi étudiant',
  [SurveySocialSupportType.SuiviSocialGeneraliste]: 'Suivi social généraliste'
})
