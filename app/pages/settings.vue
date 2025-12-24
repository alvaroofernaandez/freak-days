<script setup lang="ts">
import { ChevronLeft, Power, RefreshCw, Settings as SettingsIcon, Check, Dumbbell, BookOpen, Tv, Swords, Users, Calendar, AlertTriangle, X } from 'lucide-vue-next'
import { useModulesStore } from '../../stores/modules'
import { useAuthStore } from '~~/stores/auth'

const modulesStore = useModulesStore()
const supabase = useSupabase()
const authStore = useAuthStore()
const saving = ref(false)
const saved = ref(false)
const showConfirmDialog = ref(false)
const moduleToDisable = ref<{ id: string; name: string } | null>(null)

// Forzar reactividad de los módulos
const modules = computed(() => modulesStore.modules)

const iconMap: Record<string, any> = {
  dumbbell: Dumbbell,
  'book-open': BookOpen,
  tv: Tv,
  sword: Swords,
  users: Users,
  calendar: Calendar
}

async function handleToggle(moduleId: string) {
  const module = modulesStore.modules.find(m => m.id === moduleId)
  if (!module) return

  // Si el módulo está activado y se intenta desactivar, mostrar confirmación
  if (module.enabled) {
    moduleToDisable.value = { id: moduleId, name: module.name }
    showConfirmDialog.value = true
  } else {
    // Si se está activando, hacerlo directamente
    modulesStore.toggleModule(moduleId as any)
    await syncModules()
  }
}

async function confirmDisable() {
  if (!moduleToDisable.value) return
  
  modulesStore.toggleModule(moduleToDisable.value.id as any)
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
    <header class="flex items-center gap-3">
      <NuxtLink to="/" class="lg:hidden">
        <Button variant="ghost" size="icon" class="h-9 w-9">
          <ChevronLeft class="h-5 w-5" />
        </Button>
      </NuxtLink>
      <div class="flex-1">
        <h1 class="text-xl sm:text-2xl font-bold flex items-center gap-2">
          <SettingsIcon class="h-6 w-6 text-primary" />
          Configuración
        </h1>
        <p class="text-muted-foreground text-sm">
          Gestiona tus módulos activos
        </p>
      </div>
      <div v-if="saving || saved" class="flex items-center gap-2 text-sm">
        <div v-if="saving" class="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
        <div v-else-if="saved" class="flex items-center gap-1 text-exp-easy">
          <Check class="h-4 w-4" />
          <span>Guardado</span>
        </div>
      </div>
    </header>

    <section class="space-y-3">
      <h2 class="text-sm font-medium text-muted-foreground uppercase tracking-wider">
        Módulos
      </h2>
      
      <div class="space-y-2">
        <Card 
          v-for="module in modules" 
          :key="`module-${module.id}-${module.enabled}`"
          class="transition-all hover:border-primary/30"
          :class="module.enabled ? 'border-primary/50 bg-primary/5' : ''"
        >
          <CardHeader class="flex flex-row items-center justify-between py-3 px-4">
            <div class="flex items-center gap-3 flex-1 min-w-0">
              <div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <component :is="iconMap[module.icon]" class="h-5 w-5 text-primary" />
              </div>
              <div class="flex-1 min-w-0">
                <CardTitle class="text-sm font-medium">{{ module.name }}</CardTitle>
                <CardDescription class="text-xs truncate">{{ module.description }}</CardDescription>
              </div>
            </div>
            <Switch 
              :key="`switch-${module.id}-${module.enabled}`"
              :checked="module.enabled === true"
              @update:checked="(checked) => {
                if (checked) {
                  // Activar directamente
                  if (!module.enabled) {
                    modulesStore.toggleModule(module.id as any)
                    syncModules()
                  }
                } else {
                  // Desactivar con confirmación
                  if (module.enabled) {
                    handleToggle(module.id)
                  }
                }
              }"
            />
          </CardHeader>
        </Card>
      </div>
    </section>

    <Separator />

    <section class="space-y-3">
      <h2 class="text-sm font-medium text-muted-foreground uppercase tracking-wider">
        Acciones Rápidas
      </h2>
      
      <div class="grid grid-cols-2 gap-2">
        <Button 
          variant="outline"
          class="h-auto py-3 flex-col gap-1"
          @click="handleDisableAll"
        >
          <Power class="h-4 w-4" />
          <span class="text-xs">Desactivar Todos</span>
        </Button>
        
        <Button 
          variant="outline"
          class="h-auto py-3 flex-col gap-1"
          as-child
        >
          <NuxtLink to="/onboarding">
            <RefreshCw class="h-4 w-4" />
            <span class="text-xs">Reconfigurar</span>
          </NuxtLink>
        </Button>
      </div>
    </section>

    <Separator />

    <section class="space-y-3">
      <h2 class="text-sm font-medium text-muted-foreground uppercase tracking-wider">
        Información
      </h2>
      
      <Card>
        <CardContent class="py-4 space-y-2">
          <div class="flex justify-between text-sm">
            <span class="text-muted-foreground">Versión</span>
            <span class="font-mono">1.0.0</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-muted-foreground">Módulos activos</span>
            <Badge variant="secondary">{{ modulesStore.enabledModules.length }}</Badge>
          </div>
        </CardContent>
      </Card>
    </section>

    <!-- Confirmation Dialog -->
    <div v-if="showConfirmDialog" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/95 backdrop-blur-sm">
      <Card class="w-full max-w-md shadow-xl border-2">
        <CardHeader class="flex flex-row items-center justify-between pb-3 sm:pb-4 border-b">
          <CardTitle class="text-lg sm:text-xl flex items-center gap-2">
            <AlertTriangle class="h-5 w-5 text-exp-hard" />
            Confirmar desactivación
          </CardTitle>
          <Button 
            variant="ghost" 
            size="icon" 
            class="h-8 w-8 sm:h-9 sm:w-9 hover:bg-muted hover:text-foreground cursor-pointer" 
            @click="cancelDisable"
          >
            <X class="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent class="pt-4 sm:pt-6 space-y-4">
          <p class="text-sm sm:text-base text-muted-foreground">
            ¿Estás seguro que quieres desactivar el módulo <span class="font-semibold text-foreground">{{ moduleToDisable?.name }}</span>?
          </p>
          <p class="text-xs sm:text-sm text-muted-foreground/70">
            Podrás reactivarlo en cualquier momento desde esta página.
          </p>
        </CardContent>
        <CardFooter class="flex gap-2 pt-4 border-t">
          <Button 
            variant="outline" 
            class="flex-1"
            @click="cancelDisable"
            :disabled="saving"
          >
            Cancelar
          </Button>
          <Button 
            variant="destructive"
            class="flex-1"
            @click="confirmDisable"
            :disabled="saving"
          >
            <Power v-if="!saving" class="h-4 w-4 mr-2" />
            <div v-else class="animate-spin w-4 h-4 border-2 border-destructive-foreground border-t-transparent rounded-full mr-2" />
            Desactivar
          </Button>
        </CardFooter>
      </Card>
    </div>
  </div>
</template>
