<script setup lang="ts">
import { useModulesStore } from '~~/stores/modules'
import { useAuthStore } from '~~/stores/auth'
import type { ModuleId } from '@/domain/types'
import SettingsHeader from '@/components/settings/SettingsHeader.vue'
import ModuleList from '@/components/settings/ModuleList.vue'
import QuickActions from '@/components/settings/QuickActions.vue'
import InfoSection from '@/components/settings/InfoSection.vue'
import ConfirmDisableDialog from '@/components/settings/ConfirmDisableDialog.vue'

const modulesStore = useModulesStore()
const supabase = useSupabase()
const authStore = useAuthStore()
const saving = ref(false)
const saved = ref(false)
const showConfirmDialog = ref(false)
const moduleToDisable = ref<{ id: ModuleId; name: string } | null>(null)

const modules = computed(() => modulesStore.modules)

async function handleToggle(moduleId: ModuleId) {
  const module = modulesStore.modules.find(m => m.id === moduleId)
  if (!module) return

  if (module.enabled) {
    moduleToDisable.value = { id: moduleId, name: module.name }
    showConfirmDialog.value = true
  } else {
    modulesStore.toggleModule(moduleId)
    await syncModules()
  }
}

async function confirmDisable() {
  if (!moduleToDisable.value) return
  
  modulesStore.toggleModule(moduleToDisable.value.id)
  await syncModules()
  showConfirmDialog.value = false
  moduleToDisable.value = null
}

function cancelDisable() {
  showConfirmDialog.value = false
  moduleToDisable.value = null
}

async function handleDisableAll() {
  modulesStore.disableAllModules()
  await syncModules()
}

async function syncModules() {
  if (!authStore.userId) return
  
  saving.value = true
  saved.value = false
  
  try {
    await modulesStore.syncToDatabase(supabase, authStore.userId)
    saved.value = true
    setTimeout(() => {
      saved.value = false
    }, 2000)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="space-y-6 max-w-lg mx-auto">
    <SettingsHeader :saving="saving" :saved="saved" />

    <ModuleList :modules="modules" @toggle="handleToggle" />

    <Separator />

    <QuickActions @disable-all="handleDisableAll" />

    <Separator />

    <InfoSection :enabled-modules-count="modulesStore.enabledModules.length" />

    <ConfirmDisableDialog
      :open="showConfirmDialog"
      :module-name="moduleToDisable?.name ?? null"
      :saving="saving"
      @confirm="confirmDisable"
      @cancel="cancelDisable"
    />
  </div>
</template>
