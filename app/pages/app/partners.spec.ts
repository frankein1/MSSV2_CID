// @vitest-environment nuxt
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { ref } from 'vue'
import PartnersPage from './partners.vue'
import {
  createFakeTrpcClient,
  createFakePartner
} from '~~/test/components/helpers'
import type { OpenSnackbarEvent } from '~~/types/snackbar'

const fakeTrpcClient = createFakeTrpcClient()

mockNuxtImport('useTrpcClient', () => () => fakeTrpcClient)

const fakeModal = { open: vi.fn(), close: vi.fn() }
mockNuxtImport('useModal', () => () => fakeModal)

const fakeAppPermissions = ref({
  module: {
    partner: true
  }
})

mockNuxtImport('usePermissions', () => () => ({
  application: fakeAppPermissions,
  reset: vi.fn()
}))

const fakePartners = ref<ReturnType<typeof createFakePartner>[]>([])
const fakeRefresh = vi.fn()

function makePartner(name: string, overrides?: Record<string, unknown>) {
  return createFakePartner({
    id: crypto.randomUUID(),
    name,
    ...overrides
  })
}

async function mountPage() {
  const wrapper = await mountSuspended(PartnersPage)
  await flushPromises()
  return wrapper
}

describe('page partners', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    fakePartners.value = []
    fakeAppPermissions.value.module.partner = true
    fakeTrpcClient.partner.getAll.useQuery.mockResolvedValue({
      data: fakePartners,
      refresh: fakeRefresh
    })
    fakeTrpcClient.partner.create.mutate.mockResolvedValue(undefined)
    fakeTrpcClient.partner.update.mutate.mockResolvedValue(undefined)
    fakeTrpcClient.partner.remove.mutate.mockResolvedValue(undefined)
    fakeTrpcClient.partner.makeActive.mutate.mockResolvedValue(undefined)
  })

  describe('Rendering', () => {
    it('displays partner count and cards for each partner', async () => {
      fakePartners.value = [
        makePartner('Alpha'),
        makePartner('Beta'),
        makePartner('Gamma')
      ]

      const wrapper = await mountPage()

      expect(wrapper.find('.partner-subtitle').text()).toContain(
        '3 organismes partenaires de votre structure'
      )
      const cards = wrapper.findAll('.partner-card')
      expect(cards).toHaveLength(3)
      const names = cards.map(c => c.find('h3').text())
      expect(names).toContain('Alpha')
      expect(names).toContain('Beta')
      expect(names).toContain('Gamma')
    })

    it('displays "0 organismes" when list is empty', async () => {
      fakePartners.value = []

      const wrapper = await mountPage()

      expect(wrapper.find('.partner-subtitle').text()).toContain(
        '0 organismes partenaires de votre structure'
      )
      expect(wrapper.findAll('.partner-card')).toHaveLength(0)
    })
  })

  describe('Search filtering', () => {
    it('filters partners by name (case-insensitive)', async () => {
      fakePartners.value = [
        makePartner('Alpha'),
        makePartner('Beta'),
        makePartner('Gamma')
      ]

      const wrapper = await mountPage()
      const input = wrapper.find<HTMLInputElement>('input[name="filter"]')
      input.element.value = 'beta'
      await input.trigger('input')
      await flushPromises()

      const cards = wrapper.findAll('.partner-card')
      expect(cards).toHaveLength(1)
      expect(cards[0]!.find('h3').text()).toBe('Beta')
    })

    it('filters partners by SIRET', async () => {
      fakePartners.value = [
        makePartner('Alpha', { siret: '11111111111111' }),
        makePartner('Beta', { siret: '22222222222222' }),
        makePartner('Gamma', { siret: '33333333333333' })
      ]

      const wrapper = await mountPage()
      const input = wrapper.find<HTMLInputElement>('input[name="filter"]')
      input.element.value = '22222222'
      await input.trigger('input')
      await flushPromises()

      const cards = wrapper.findAll('.partner-card')
      expect(cards).toHaveLength(1)
      expect(cards[0]!.find('h3').text()).toBe('Beta')
    })

    it('shows no cards when filter matches nothing', async () => {
      fakePartners.value = [
        makePartner('Alpha'),
        makePartner('Beta'),
        makePartner('Gamma')
      ]

      const wrapper = await mountPage()
      const input = wrapper.find<HTMLInputElement>('input[name="filter"]')
      input.element.value = 'zzzzz'
      await input.trigger('input')
      await flushPromises()

      expect(wrapper.findAll('.partner-card')).toHaveLength(0)
    })
  })

  describe('Authorizations', () => {
    it('shows "Ajouter" button when module.partner is true', async () => {
      fakeAppPermissions.value.module.partner = true

      const wrapper = await mountPage()

      const ajouterButton = wrapper
        .findAll('button')
        .find(b => b.text().includes('Ajouter'))
      expect(ajouterButton).toBeDefined()
    })

    it('hides "Ajouter" button when module.partner is false', async () => {
      fakeAppPermissions.value.module.partner = false

      const wrapper = await mountPage()

      const ajouterButton = wrapper
        .findAll('button')
        .find(b => b.text().includes('Ajouter'))
      expect(ajouterButton).toBeUndefined()
    })
  })

  describe('Mutations — success path', () => {
    it('finishCreation success: calls create.mutate, snackbar success, modal.close, refresh', async () => {
      fakePartners.value = [makePartner('Alpha')]
      const wrapper = await mountPage()

      const { $globalEventEmitter } = useNuxtApp()
      const snackbarEvents: OpenSnackbarEvent[] = []
      $globalEventEmitter.on('openSnackbar', (e: OpenSnackbarEvent) =>
        snackbarEvents.push(e)
      )

      const ajouterButton = wrapper
        .findAll('button')
        .find(b => b.text().includes('Ajouter'))!
      await ajouterButton.trigger('click')

      const finishCreation = fakeModal.open.mock.calls[0]![1].finish
      const input = {
        name: 'New Partner',
        siret: '99999999999999',
        dataSource: 'Custom' as const
      }
      await finishCreation(input)
      await flushPromises()

      expect(fakeTrpcClient.partner.create.mutate).toHaveBeenCalledWith(input)
      expect(snackbarEvents[0]!.message).toBe('Organisme partenaire ajouté')
      expect(fakeModal.close).toHaveBeenCalled()
      expect(fakeRefresh).toHaveBeenCalled()

      $globalEventEmitter.off('openSnackbar')
    })

    it('finishEdition success: calls update.mutate, snackbar success, modal.close, refresh', async () => {
      const partner = makePartner('Alpha')
      fakePartners.value = [partner]
      const wrapper = await mountPage()

      const { $globalEventEmitter } = useNuxtApp()
      const snackbarEvents: OpenSnackbarEvent[] = []
      $globalEventEmitter.on('openSnackbar', (e: OpenSnackbarEvent) =>
        snackbarEvents.push(e)
      )

      const editButton = wrapper
        .findAll('button')
        .find(b => b.text().includes("Modifier l'organisme"))!
      await editButton.trigger('click')

      const finishEdition = fakeModal.open.mock.calls[0]![1].finish
      const input = {
        id: partner.id,
        name: 'Updated Partner',
        siret: '99999999999999',
        dataSource: 'Custom' as const
      }
      await finishEdition(input)
      await flushPromises()

      expect(fakeTrpcClient.partner.update.mutate).toHaveBeenCalledWith(input)
      expect(snackbarEvents[0]!.message).toBe('Organisme partenaire mis à jour')
      expect(fakeModal.close).toHaveBeenCalled()
      expect(fakeRefresh).toHaveBeenCalled()

      $globalEventEmitter.off('openSnackbar')
    })

    it('finishDeletion success: calls remove.mutate, snackbar success, modal.close, refresh', async () => {
      const partner = makePartner('Alpha')
      fakePartners.value = [partner]
      const wrapper = await mountPage()

      const { $globalEventEmitter } = useNuxtApp()
      const snackbarEvents: OpenSnackbarEvent[] = []
      $globalEventEmitter.on('openSnackbar', (e: OpenSnackbarEvent) =>
        snackbarEvents.push(e)
      )

      const deleteButton = wrapper
        .findAll('button')
        .find(b => b.text().includes("Supprimer l'organisme"))!
      await deleteButton.trigger('click')

      const finishDeletion = fakeModal.open.mock.calls[0]![1].finish
      await finishDeletion(partner.id as string)
      await flushPromises()

      expect(fakeTrpcClient.partner.remove.mutate).toHaveBeenCalledWith({
        id: partner.id
      })
      expect(snackbarEvents[0]!.message).toBe('Organisme partenaire supprimé')
      expect(fakeModal.close).toHaveBeenCalled()
      expect(fakeRefresh).toHaveBeenCalled()

      $globalEventEmitter.off('openSnackbar')
    })
  })

  describe('Mutations — failure path', () => {
    it('finishCreation failure: snackbar error', async () => {
      fakeTrpcClient.partner.create.mutate.mockRejectedValueOnce(
        new Error('fail')
      )
      fakePartners.value = [makePartner('Alpha')]
      const wrapper = await mountPage()

      const { $globalEventEmitter } = useNuxtApp()
      const snackbarEvents: OpenSnackbarEvent[] = []
      $globalEventEmitter.on('openSnackbar', (e: OpenSnackbarEvent) =>
        snackbarEvents.push(e)
      )

      const ajouterButton = wrapper
        .findAll('button')
        .find(b => b.text().includes('Ajouter'))!
      await ajouterButton.trigger('click')

      const finishCreation = fakeModal.open.mock.calls[0]![1].finish
      await finishCreation({
        name: 'New Partner',
        siret: '99999999999999',
        dataSource: 'Custom' as const
      })
      await flushPromises()

      expect(snackbarEvents[0]!.message).toBe("L'ajout a échoué")
      expect(fakeModal.close).not.toHaveBeenCalled()

      $globalEventEmitter.off('openSnackbar')
    })

    it('finishEdition failure: snackbar error', async () => {
      fakeTrpcClient.partner.update.mutate.mockRejectedValueOnce(
        new Error('fail')
      )
      const partner = makePartner('Alpha')
      fakePartners.value = [partner]
      const wrapper = await mountPage()

      const { $globalEventEmitter } = useNuxtApp()
      const snackbarEvents: OpenSnackbarEvent[] = []
      $globalEventEmitter.on('openSnackbar', (e: OpenSnackbarEvent) =>
        snackbarEvents.push(e)
      )

      const editButton = wrapper
        .findAll('button')
        .find(b => b.text().includes("Modifier l'organisme"))!
      await editButton.trigger('click')

      const finishEdition = fakeModal.open.mock.calls[0]![1].finish
      await finishEdition({
        id: partner.id,
        name: 'Updated',
        siret: '99999999999999',
        dataSource: 'Custom' as const
      })
      await flushPromises()

      expect(snackbarEvents[0]!.message).toBe('La mise à jour a échoué')
      expect(fakeModal.close).not.toHaveBeenCalled()

      $globalEventEmitter.off('openSnackbar')
    })

    it('finishDeletion failure: snackbar error', async () => {
      fakeTrpcClient.partner.remove.mutate.mockRejectedValueOnce(
        new Error('fail')
      )
      const partner = makePartner('Alpha')
      fakePartners.value = [partner]
      const wrapper = await mountPage()

      const { $globalEventEmitter } = useNuxtApp()
      const snackbarEvents: OpenSnackbarEvent[] = []
      $globalEventEmitter.on('openSnackbar', (e: OpenSnackbarEvent) =>
        snackbarEvents.push(e)
      )

      const deleteButton = wrapper
        .findAll('button')
        .find(b => b.text().includes("Supprimer l'organisme"))!
      await deleteButton.trigger('click')

      const finishDeletion = fakeModal.open.mock.calls[0]![1].finish
      await finishDeletion(partner.id as string)
      await flushPromises()

      expect(snackbarEvents[0]!.message).toBe('La suppression a échoué')
      expect(fakeModal.close).not.toHaveBeenCalled()

      $globalEventEmitter.off('openSnackbar')
    })
  })

  describe('Restore', () => {
    it('restorePartner: calls makeActive.mutate, closes modal, refreshes', async () => {
      const partner = makePartner('Alpha', { inactive: true })
      fakePartners.value = [partner]
      const wrapper = await mountPage()

      const editButton = wrapper
        .findAll('button')
        .find(b => b.text().includes("Modifier l'organisme"))!
      await editButton.trigger('click')

      const restore = fakeModal.open.mock.calls[0]![1].restore
      await restore(partner)
      await flushPromises()

      expect(fakeTrpcClient.partner.makeActive.mutate).toHaveBeenCalledWith({
        id: partner.id
      })
      expect(fakeModal.close).toHaveBeenCalled()
      expect(fakeRefresh).toHaveBeenCalled()
    })
  })
})
