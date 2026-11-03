<template>
  <ComboBox
    v-model="selectedAddress"
    :label="label"
    :required="required"
    :loading="loading"
    :options="addressOptions"
    :format-display-value="displayAddressName"
    :error="error"
    :hint="hint"
    @input="onSearch"
    @select="onSelectAddress"
    @clear="setValue(null)"
  >
    <template #default="{ option }">
      {{ option.properties.name }}, {{ option.properties.postcode }}
      {{ option.properties.city }}
    </template>
  </ComboBox>
</template>

<script lang="ts" setup>
  import { useField } from 'vee-validate'
  import { useDebounceFn } from '@vueuse/core'
  import type {
    BanFeature,
    BanQueryParams,
    BanResponse,
    AddressSelected
  } from './types'
  import {
    ADDRESS_SEARCH_NUMBER_CHARACTERS,
    SEARCH_DEFER_MS
  } from '~/utils/constants'

  const props = withDefaults(
    defineProps<{
      name: string
      label: string
      required?: boolean
      zipCode?: string | null
      hint?: string
      requestLimit?: number
    }>(),
    { required: false, zipCode: '', hint: '', requestLimit: 3 }
  )

  const emit = defineEmits<{
    addressSelected: [address: AddressSelected]
  }>()

  type AddressOption = BanFeature & { disabled?: boolean }

  const name = toRef(() => props.name)
  const {
    setValue,
    value: fieldValue,
    errorMessage: error
  } = useField<string | null>(name)

  function buildPlaceholderAddress(name: string): AddressOption {
    return {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [0, 0] },
      properties: {
        id: '',
        banId: '',
        name,
        postcode: '',
        label: '',
        score: 0,
        citycode: '',
        x: 0,
        y: 0,
        city: '',
        context: '',
        type: '',
        importance: 0,
        _type: ''
      }
    }
  }

  const selectedAddress = ref<AddressOption | null>(
    fieldValue.value ? buildPlaceholderAddress(fieldValue.value) : null
  )
  const addressOptions = ref<AddressOption[]>([])
  const loading = ref(false)

  // The field can be updated from outside this component. selectedAddress/
  // ComboBox's displayedValue only change through onSearch/onSelectAddress/
  // @clear, so without this, an external update never reaches the visible input.
  watch(fieldValue, newValue => {
    if (selectedAddress.value?.properties.name === newValue) {
      return
    }
    selectedAddress.value = newValue ? buildPlaceholderAddress(newValue) : null
  })

  function displayAddressName(address: AddressOption) {
    return address.properties.name
  }

  // Keeps the field in sync with whatever the user typed, so an address
  // that isn't picked from the results list still gets saved as-is.
  function onSearch(search: string) {
    setValue(search)
    if (search.trim().length < ADDRESS_SEARCH_NUMBER_CHARACTERS) {
      addressOptions.value = []
      return
    }
    debouncedFn(search.trim())
  }

  const debouncedFn = useDebounceFn(async (search: string) => {
    const params: BanQueryParams = {
      q: search.toLocaleLowerCase(),
      limit: props.requestLimit
    }
    if (props.zipCode) {
      params.postcode = props.zipCode
    }

    const geocodageApiUrl = 'https://data.geopf.fr/geocodage/search/'
    loading.value = true
    try {
      const res = await $fetch<BanResponse>(geocodageApiUrl, { params })
      addressOptions.value = res.features
    } finally {
      loading.value = false
    }
  }, SEARCH_DEFER_MS)

  function onSelectAddress(address: AddressOption) {
    setValue(address.properties.name)
    const addressParts = address.properties.context.split(',')
    const region = addressParts[2]?.trim() || ''
    const departement = addressParts[1]?.trim() || ''
    emit('addressSelected', {
      zipCode: address.properties.postcode,
      city: address.properties.city,
      region,
      departement,
      coordinates: address.geometry.coordinates
    })
  }
</script>
