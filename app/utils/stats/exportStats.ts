import type { StatsCardConfig } from '~~/types/stat'
import { toBlob } from 'html-to-image'
import { getExportUrl } from '~/utils/export/getExportUrl'
import { getExportFilename } from '~/utils/export/getExportFilename'
import { FAILED_DOWNLOAD_ERROR_MESSAGE } from '~/utils/constants'
import { BlobWriter, BlobReader, ZipWriter } from '@zip.js/zip.js'

// Export Cards as image
const extractIds = (config: StatsCardConfig) => {
  return Object.values(config).map(item => item.id)
}

type Filter = (node: HTMLElement | Node) => boolean

const createBlob = async (
  node: HTMLElement,
  size: {
    width: number
    height: number
  },
  filter: Filter
) => {
  const scale = 1
  const blob = await toBlob(node, {
    width: size.width * scale,
    height: size.height * scale,
    style: {
      transform: 'scale(' + scale + ')',
      transformOrigin: 'top left'
    },
    quality: 0.9,
    filter: filter
  })
  return blob
}

const findImageName = (statsCardConfig: StatsCardConfig, node: HTMLElement) => {
  return (
    Object.values(statsCardConfig).find(el => el.id === node.id)?.name ||
    'image'
  )
}

export const zipAndDownloadImages = async (
  zipname: string,
  statsCardConfig: StatsCardConfig,
  filter: Filter,
  finallyFn: () => void
) => {
  const configIds = extractIds(statsCardConfig)
  const nodes = configIds
    .map(id => {
      const node = document.getElementById(id)
      if (node) {
        return node
      }
    })
    .filter(node => node != null)

  const zipWriter = new ZipWriter(new BlobWriter('application/zip'))

  const promises = nodes.map(async node => {
    const expandButton = node?.getElementsByClassName(
      'btn-unexpanded'
    )[0] as HTMLElement
    if (expandButton) {
      expandButton.click()
      // Wait for the card to expand before capturing it
      await new Promise(resolve => setTimeout(resolve, 300))
    }
    const width = node.clientWidth
    const height = node.clientHeight

    const blob = await createBlob(node, { width, height }, filter)
    if (blob == null) {
      throw new Error(`L'image n'a pas pu être exportée ${node.id}`)
    }
    return zipWriter.add(
      findImageName(statsCardConfig, node) + '.png',
      new BlobReader(blob)
    )
  })
  try {
    await Promise.all(promises)
    const finalBlob = await zipWriter.close()
    const link = document.createElement('a')
    link.download = zipname + '.zip'
    link.href = URL.createObjectURL(finalBlob)
    link.click()
    link.remove()
  } catch {
    useSnackbar().error("Les images n'ont pas pu être exportées.")
  } finally {
    finallyFn()
  }
}

export type ExportFileName =
  | 'stats_entretiens'
  | 'stats_instructions_dossier'
  | 'stats_beneficiaires'
  | 'stats_ateliers'
  | 'stats_parcours_dispositifs'

// export as Excel file
export const exportStats = async (
  mutation: () => Promise<{ data: string }>,
  fileName: ExportFileName
) => {
  try {
    const exportedFile = await mutation()
    if (!exportedFile.data) {
      throw new Error('no data')
    }
    const downloadLink = document.createElement('a')
    downloadLink.href = getExportUrl(exportedFile.data)
    downloadLink.download = getExportFilename(fileName)
    downloadLink.click()
    downloadLink.remove()
  } catch {
    useSnackbar().error(FAILED_DOWNLOAD_ERROR_MESSAGE)
  }
}
