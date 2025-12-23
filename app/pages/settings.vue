<script setup lang="ts">
import { ChevronLeft, Power, RefreshCw, Settings as SettingsIcon, Check } from 'lucide-vue-next'
import { useModulesStore } from '../../stores/modules'
import { useAuthStore } from '~~/stores/auth'

const modulesStore = useModulesStore()
const supabase = useSupabase()
const authStore = useAuthStore()
const saving = ref(false)
const saved = ref(false)

const iconMap: Record<string, string> = {
  dumbbell: '🏋️',
  'book-open': '📚',
  tv: '📺',
  sword: '⚔️',
  users: '👥',
  calendar: '📅'
}

async function handleToggle(moduleId: string) {
  modulesStore.toggleModule(moduleId as any)
  await syncModules()
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
          v-for="module in modulesStore.modules" 
          :key="module.id"
          class="transition-all cursor-pointer hover:border-primary/30"
          :class="module.enabled ? 'border-primary/50 bg-primary/5' : ''"
          @click="handleToggle(module.id)"
        >
          <CardHeader class="flex flex-row items-center justify-between py-3 px-4">
            <div class="flex items-center gap-3 flex-1 min-w-0">
              <span class="text-2xl">{{ iconMap[module.icon] }}</span>
              <div class="flex-1 min-w-0">
                <CardTitle class="text-sm font-medium">{{ module.name }}</CardTitle>
                <CardDescription class="text-xs truncate">{{ module.description }}</CardDescription>
              </div>
            </div>
            <Switch 
              :checked="module.enabled"
              @click.stop
              @update:checked="handleToggle(module.id)"
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
  </div>
</template>
