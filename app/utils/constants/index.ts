import { buildKeys } from '../keys/keyBuilder'

export const UNKNOWN_ERROR_MESSAGE = 'Une erreur est survenue.'
export const FAILED_DOWNLOAD_ERROR_MESSAGE = 'Le téléchargement a échoué.'
export const INVALID_CODE_ERROR_MESSAGE = 'Le code est erroné ou expiré.'
export const SENSITIVE_DATA_HINT =
  "Il est fortement recommandé de ne stocker que les informations utiles au suivi du bénéficiaire et d'éviter le recueil d'informations sensibles (données de santé, mots de passe, etc)."

export const REQUEST_LIMIT_KEYS = buildKeys({
  '5': '5',
  '10': '10',
  '15': '15',
  '20': '20',
  '30': '30',
  '60': '60'
})

export const REQUEST_LIMIT_DEFAULT = 20
export const BENEFICIARIES_REQUEST_LIMIT_DEFAULT = 60
export const NOTIFICATIONS_REQUEST_LIMIT_DEFAULT = 10
export const WORKSHOPS_REQUEST_LIMIT_DEFAULT = 20
export const SCHOOL_REQUEST_LIMIT_DEFAULT = 25

export const INPUT_DEFER_DURATION = 400

export const EMPTY_TABLE_CELL = '-'

// Upon updating this value, nginx client_max_body_size must also be updated
export const MAX_UPLOAD_SIZE_BYTES = 20971520

export const SEARCH_NUMBER_CHARACTERS = 2
// The geocoding API (data.geopf.fr) rejects queries shorter than 3 characters
export const ADDRESS_SEARCH_NUMBER_CHARACTERS = 3
export const SEARCH_DEFER_MS = 100

export const APP_NAME = 'Mon Suivi Social'
export const APP_DESCRIPTION = 'Logiciel de suivi des bénéficiaires'
export const CODE_URL =
  'https://gitlab.com/incubateur-territoires/startups/monsuivisocial/monsuivisocial-v2'
export const SUPPORT_EMAIL = 'support@monsuivisocial.incubateur.anct.gouv.fr'
export const HABILITATION_TABLE_URL =
  'https://docs-ia.beta.numerique.gouv.fr/docs/20bcdeba-384a-4f49-af18-ae54196001db/'

// Interval upon which the values for countdown are refreshed in local storage
export const DEFAULT_INTERVAL_TIME_FOR_STORAGE_REFRESH = 5 * 1000 // minutesToMillis(5)

// Local storage label for the countdown for automatic session refresh
export const COUNTDOWN_SESSION_LABEL = 'mss_countdown_session'

// Local storage label for the countdown for user inactivity
export const COUNTDOWN_INACTIVITY_LABEL = 'mss_countdown_inactivity'

export const MAX_BENEFICIARIES_REFERENT_TRANSFER = 500
