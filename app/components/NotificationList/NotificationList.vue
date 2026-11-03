<template>
  <section class="feature-section">
    <NotificationListHeader />
    <NotificationFilters @filter="filters = $event" />
    <hr v-if="error || pending || !notifications.length" />
    <AtomAlert
      v-if="error"
      :alert-type="AlertType.Error"
      message="Les notifications n'ont pas pu être chargées."
    />
    <div
      v-if="pending"
      class="notification-list__loader-container"
    >
      <AtomLoader class="fr-mx-auto" />
    </div>
    <template v-if="data">
      <ul
        v-if="notifications.length"
        class="notifications__list"
      >
        <NotificationItem
          v-for="notification in notifications"
          :key="notification.id"
          :notification="notification"
          @toggle-read-state="onToggleReadState(notification.id, $event)"
        />
      </ul>
      <NotificationListEmptyState
        v-else
        :notification-type="filters?.type"
      />
      <hr />
      <div class="notification-list__footer">
        <button
          v-if="canSeeMore"
          class="fr-btn fr-btn--tertiary fr-btn--sm"
          @click="page++"
        >
          Voir plus
        </button>
        <NotificationListReadToggle
          v-model:read="showReadNotifications"
          class="fr-ml-auto"
        />
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
  import { NotificationType } from '@prisma/client'
  import { AlertType } from '~/utils/constants/alert'
  import { NotificationTypeFilterValue } from '~~/client/options'
  import type { ActiveNotificationType } from '~~/client/options'
  import { NOTIFICATIONS_REQUEST_LIMIT_DEFAULT } from '~/utils/constants'
  import ArchiveNotificationModal from '~/components/Archive/ArchiveNotificationModal.vue'
  import { routes } from '~/utils/routes'
  // ANONYMIZED: formatBeneficiaryName no longer used here
  import type { NotificationItemType } from './types'

  const trpcClient = useTrpcClient()
  const route = useRoute()

  const filters = ref<{ type?: NotificationTypeFilterValue | '' }>({})
  const showReadNotifications = ref(false)
  const page = ref(1)
  const queryfilter = route.query.filter as string

  const notificationTypes = computed<ActiveNotificationType[] | null>(() => {
    switch (filters.value.type) {
      case NotificationTypeFilterValue.DueDate:
        return [
          NotificationType.DueDateOneMonth,
          NotificationType.DueDateToday,
          NotificationType.EndOfSupport,
          NotificationType.EndOfSupportOneMonth,
          NotificationType.DocumentExpirationOneMonth,
          NotificationType.DocumentExpirationToday,
          NotificationType.SupportProgramEndTwoMonths,
          NotificationType.SupportProgramEndToday
        ]
      case NotificationTypeFilterValue.NewComment:
        return [NotificationType.NewComment]
      case NotificationTypeFilterValue.NewItem:
        return [
          NotificationType.NewDocument,
          NotificationType.NewSocialSupportSubject,
          NotificationType.NewFollowupElement,
          NotificationType.NewFileInstructionElement
        ]
      case NotificationTypeFilterValue.Archivage:
        return [
          NotificationType.ArchiveDueToday,
          NotificationType.ArchiveDueOneMonth,
          NotificationType.ArchiveDueSevenDays
        ]
      default:
        return [
          // All except Archive type
          NotificationType.NewDocument,
          NotificationType.NewComment,
          NotificationType.DueDateToday,
          NotificationType.DueDateOneMonth,
          NotificationType.EndOfSupport,
          NotificationType.EndOfSupportOneMonth,
          NotificationType.NewFileInstructionElement,
          NotificationType.UpdateFileInstructionElement,
          NotificationType.NewFollowupElement,
          NotificationType.UpdateFollowupElement,
          NotificationType.NewSocialSupportSubject,
          NotificationType.DocumentExpirationOneMonth,
          NotificationType.DocumentExpirationToday,
          NotificationType.SupportProgramEndTwoMonths,
          NotificationType.SupportProgramEndToday
        ]
    }
  })

  const queryInput = computed(() => {
    return {
      onlyUnread: !showReadNotifications.value,
      types: notificationTypes.value,
      perPage: NOTIFICATIONS_REQUEST_LIMIT_DEFAULT,
      page: 1
    }
  })

  const { data, error, pending } =
    await trpcClient.notification.get.useQuery(queryInput)

  // get archive notifications
  const { data: archiveData } =
    await trpcClient.archiveNotification.get.useQuery()

  const notifications = computed(() => {
    return addArchiveNotifications(
      data.value?.notifications as NotificationItemType[],
      archiveData.value as NotificationItemType[],
      filters.value.type,
      showReadNotifications.value
    )
  })
  const totalCount = computed(() => data.value?.totalCount || 0)

  const canSeeMore = computed(
    () => notifications.value.length < totalCount.value
  )

  watch(filters, () => {
    page.value = 1
  })

  const addArchiveNotifications = (
    baseNotifications: NotificationItemType[],
    archiveNotifications: NotificationItemType[],
    filterType: NotificationTypeFilterValue | '' | undefined,
    showReadNotifications: boolean
  ) => {
    const moreNotification: NotificationItemType = {
      id: 'MORE_ARCHIVE',
      type: NotificationType.ArchiveDueToday,
      title: 'Archive',
      description: 'Voir toutes les notifications',
      descriptionHint: `Vous avez ${archiveNotifications.length} dossiers en attente d'archivage.`,
      created: new Date(),
      onClick: () => {
        filters.value.type = NotificationTypeFilterValue.Archivage
        selectArchiveTag()
        showAllNotifications()
      }
    }
    if (filterType != null) {
      return baseNotifications
    }
    const threeFirstArchiveNotifications = archiveNotifications
      .filter(notif => {
        if (showReadNotifications) {
          return notif
        }
        return !notif.readAt
      })
      .slice(0, 3)
    if (archiveNotifications.length > 3) {
      threeFirstArchiveNotifications.push(moreNotification)
    }
    if (baseNotifications.length > 0) {
      return threeFirstArchiveNotifications.concat(
        baseNotifications as NotificationItemType[]
      )
    }
    return threeFirstArchiveNotifications
  }

  const selectArchiveTag = () => {
    const archiveTags = document.querySelectorAll('input[value=Archivage]')
    if (archiveTags.length && archiveTags.length > 0) {
      const archiveTag = archiveTags[0] as HTMLInputElement
      archiveTag.click()
    }
  }
  const showAllNotifications = () => {
    if (!showReadNotifications.value) {
      const toogleButtons = document.querySelectorAll(
        '#notification-toggle > input[name=read]'
      )
      if (toogleButtons.length && toogleButtons.length > 0) {
        const toogleButton = toogleButtons[0] as HTMLInputElement
        toogleButton.click()
      }
    }
  }

  if (queryfilter === 'archivage') {
    setTimeout(() => {
      selectArchiveTag()
    }, 200)
  }

  watch(page, async page => {
    if (page === 1) {
      return
    }
    const newPage = await loadNotificationPage()
    if (!data.value) {
      data.value = newPage
      return
    }

    data.value = {
      ...data.value,
      notifications: [...data.value.notifications, ...newPage.notifications]
    }
  })

  function loadNotificationPage() {
    return trpcClient.notification.get.query({
      ...queryInput.value,
      page: page.value
    })
  }

  /**
   * It does not use the refresh function from `useQuery` as multiple pages may have been loaded
   */
  function onToggleReadState(notificationId: string, read: boolean) {
    // normal data
    if (data.value) {
      data.value = {
        totalCount: data.value.totalCount,
        notifications: data.value.notifications.map(notification =>
          notification.id === notificationId
            ? { ...notification, readAt: read ? new Date() : null }
            : notification
        )
      }

      if (!showReadNotifications.value && read) {
        data.value = {
          totalCount: data.value.totalCount - 1,
          notifications: data.value.notifications.filter(
            ({ id }) => id !== notificationId
          )
        }
      }
    }
    // archive data
    if (archiveData.value) {
      archiveData.value = archiveData.value.map(notification =>
        notification.id === notificationId
          ? { ...notification, readAt: read ? new Date() : null }
          : notification
      )

      if (!showReadNotifications.value && read) {
        archiveData.value = archiveData.value.filter(
          ({ id }) => id !== notificationId
        )
      }
    }
  }

  const beneficiariesToArchived = computed(() => {
    if (archiveData && archiveData.value) {
      return archiveData.value
        .filter(notification => {
          if (notification.archiveDate == null) {
            return false
          }
          // display only notifications with archive date passed
          const archiveDate = notification.archiveDate.getTime()
          const today = new Date().getTime()
          return archiveDate < today
        })
        .filter(notification => !notification.readAt)
        .map(notification => ({
          archiveDate: notification.archiveDate,
          archiveDueDate: notification.beneficiary?.archiveDueDate,
          beneficiary: notification.beneficiary,
          actionUrl: notification.beneficiary?.id
            ? routes.beneficiary.AppBeneficiariesArchive.path(
                notification.beneficiary.id
              )
            : null
        }))
    }
  })
  type BeneficiariesToArchived = typeof beneficiariesToArchived.value

  const modal = useModal()
  const unwatch = watch([modal.isReady, beneficiariesToArchived], () => {
    if (modal.isReady && beneficiariesToArchived.value?.[0]) {
      const firstNotification = beneficiariesToArchived.value[0]
      // ANONYMIZED: beneficiary name fields no longer available
      const beneficiaryNames = beneficiariesToArchived.value.map(
        notification =>
          notification?.beneficiary?.id
            ? `Dossier ${notification.beneficiary.id.slice(0, 8)}`
            : 'Dossier'
      )
      modal.open(ArchiveNotificationModal, {
        triggerOpen: true,
        title: archiveModalTitle(
          beneficiariesToArchived.value,
          beneficiaryNames
        ),
        beneficiaryNames: Array.from(new Set(beneficiaryNames)),
        validate: () => {
          navigateTo(firstNotification.actionUrl)
          modal.close()
        }
      })

      unwatch()
    }
  })

  const archiveModalTitle = (
    beneficiariesToArchived: BeneficiariesToArchived,
    beneficiaryNames: string[]
  ) => {
    if (beneficiariesToArchived && beneficiariesToArchived.length > 1) {
      return `Plusieurs dossiers sont inactifs : une action est requise.`
    }
    if (
      beneficiariesToArchived &&
      beneficiariesToArchived[0] &&
      beneficiariesToArchived[0].archiveDueDate
    ) {
      return `Le dossier de ${beneficiaryNames[0]} a été conservé 1 an supplémentaire : une action est requise.`
    }
    return `Le dossier de ${beneficiaryNames[0]} est inactif depuis 2 ans : une action est requise.`
  }
</script>

<style lang="scss" scoped>
  .feature-section {
    padding: 0;
  }

  .notifications__list {
    --ul-start: 0;
    --xl-block: 0;
    --ul-type: none;
  }

  .notification-list__loader-container {
    padding: 0.5rem 1rem 1.5rem;
  }

  .notification-list__footer {
    padding: 0 1.5rem 0.5rem;
    display: flex;

    > .fr-btn.fr-btn--sm {
      height: fit-content;
    }
  }
</style>
