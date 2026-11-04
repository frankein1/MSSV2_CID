import type { MenuItem } from '~~/types/menu'
import type { StatsCardConfig } from '~~/types/stat'
import { EventCategory, type ExportEventAction } from '~~/types/matomo'
import {
  exportStats,
  zipAndDownloadImages,
  type ExportFileName
} from '~/utils/stats/exportStats'

type StatsExportMenusOptions = {
  hasData: () => boolean
  // Read on click, so cards depending on modules or filters are up to date
  cardConfig: () => StatsCardConfig
  // Excel export route, called with the current filters
  mutation: () => Promise<{ data: string }>
  fileName: ExportFileName
  matomoEvents: {
    images: ExportEventAction
    excel: ExportEventAction
  }
}

// Card buttons (tooltips, expand) are not exported in images
const buttonFilter = (node: HTMLElement | Node) =>
  (node as HTMLElement).tagName !== 'BUTTON'

export function useStatsExportMenus({
  hasData,
  cardConfig,
  mutation,
  fileName,
  matomoEvents
}: StatsExportMenusOptions) {
  const matomo = useMatomo()

  const isExporting = ref(false)

  const downloadImages = () => {
    matomo.trackEvent(EventCategory.ExportStats, matomoEvents.images)
    isExporting.value = true
    const date = new Date()
    // Let the export alert render before the images are generated
    setTimeout(() => {
      zipAndDownloadImages(
        `${fileName} - ${date.toLocaleDateString()}`,
        cardConfig(),
        buttonFilter,
        () => {
          isExporting.value = false
        }
      )
    }, 200)
  }

  const downloadExcel = () => {
    matomo.trackEvent(EventCategory.ExportStats, matomoEvents.excel)
    exportStats(mutation, fileName)
  }

  const menus = computed<MenuItem[]>(() => {
    if (!hasData()) {
      return []
    }
    return [
      {
        label: 'En images (.zip)',
        icon: 'fr-icon-folder-image-line',
        onClick: downloadImages
      },
      {
        label: 'En tableur (.xlsx)',
        icon: 'fr-icon-file-excel-line',
        onClick: downloadExcel
      }
    ]
  })

  return { menus, isExporting }
}
