<script setup lang="ts">
import { Check, ChevronRight, Dumbbell, BookOpen, Tv, Swords, Users, Calendar } from 'lucide-vue-next'
import { useModulesStore } from '../../stores/modules'
import { useAuthStore } from '../../stores/auth'
import type { ModuleId } from '../../domain/types'
import Logo from '../components/Logo.vue'

const modulesStore = useModulesStore()
const authStore = useAuthStore()
const supabase = useSupabase()
const router = useRouter()

const selectedModules = ref<Set<ModuleId>>(new Set())
const saving = ref(false)

const iconMap: Record<string, any> = {
  dumbbell: Dumbbell,
  'book-open': BookOpen,
  tv: Tv,
  sword: Swords,
  users: Users,
  calendar: Calendar
}

function toggleSelection(id: ModuleId) {
  if (selectedModules.value.has(id)) {
    selectedModules.value.delete(id)
  } else {
    selectedModules.value.add(id)
  }
}

async function completeOnboarding() {
  if (!authStore.userId || saving.value) return
  
  saving.value = true
  try {
    modulesStore.enableModules([...selectedModules.value])
    await modulesStore.syncToDatabase(supabase, authStore.userId)
    router.push('/')
  } finally {
    saving.value = false
  }
}

const canContinue = computed(() => selectedModules.value.size > 0 && !saving.value)
</script>


<template>
  <div class="min-h-screen-safe flex flex-col bg-background">
    <div class="flex-1 flex flex-col max-w-lg mx-auto w-full px-4 py-6 sm:py-10">
      <header class="text-center space-y-3 mb-6">
        <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-2">
          <Logo class="h-7 w-7" />
        </div>
        <h1 class="text-2xl sm:text-3xl font-bold">Configura tu Aventura</h1>
        <p class="text-muted-foreground text-sm sm:text-base">
          Elige los módulos que quieres usar
        </p>
      </header>

      <div class="flex-1 space-y-3 overflow-auto">
        <button
          v-for="module in modulesStore.modules" 
          :key="module.id"
          type="button"
          class="w-full text-left"
          @click="toggleSelection(module.id)"
        >
          <Card 
            :class="[
              'transition-all duration-200 active:scale-[0.98]',
              selectedModules.has(module.id) 
                ? 'border-primary bg-primary/5 glow-primary' 
                : 'hover:border-muted-foreground/50'
            ]"
          >
            <CardHeader class="flex flex-row items-center gap-4 py-4">
              <div class="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <component :is="iconMap[module.icon]" class="h-6 w-6 text-primary" />
              </div>
              <div class="flex-1 min-w-0">
                <CardTitle class="text-base">{{ module.name }}</CardTitle>
                <CardDescription class="text-xs truncate">{{ module.description }}</CardDescription>
              </div>
              <div 
                class="shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all"
                :class="selectedModules.has(module.id) 
                  ? 'bg-primary border-primary text-primary-foreground' 
                  : 'border-muted-foreground/30'"
              >
                <Check v-if="selectedModules.has(module.id)" class="h-4 w-4" />
              </div>
            </CardHeader>
          </Card>
        </button>
      </div>

      <footer class="pt-4 space-y-3">
        <div class="flex items-center justify-between text-sm">
          <span class="text-muted-foreground">
            {{ selectedModules.size }} de {{ modulesStore.modules.length }} módulos
          </span>
          <Badge v-if="selectedModules.size > 0" variant="secondary">
            {{ selectedModules.size }} seleccionados
          </Badge>
        </div>
        
        <Button 
          size="lg"
          class="w-full h-14 text-base glow-primary"
          :disabled="!canContinue"
          @click="completeOnboarding"
        >
          <span>Comenzar Aventura</span>
          <ChevronRight class="h-5 w-5 ml-2" />
        </Button>

        <p class="text-center text-xs text-muted-foreground">
          Podrás cambiar esto en cualquier momento
        </p>
      </footer>
    </div>
  </div>
</template>
