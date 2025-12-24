<script setup lang="ts">
import { User, Edit2, Save, LogOut, Sparkles, Trophy, Calendar, Target, X } from 'lucide-vue-next'
import type { UserProfile } from '@/composables/useProfile'
import { useAuthStore } from '~~/stores/auth'

const profileApi = useProfile()
const auth = useAuth()
const authStore = useAuthStore()

const profile = ref<UserProfile | null>(null)
const loading = ref(true)
const saving = ref(false)
const editing = ref(false)

const editForm = ref({
  username: '',
  display_name: ''
})

const expProgress = computed(() => {
  if (!profile.value) return { current: 0, needed: 100, progress: 0 }
  return profileApi.expForNextLevel(profile.value.totalExp)
})

onMounted(async () => {
  await loadProfile()
})

async function loadProfile() {
  loading.value = true
  try {
    profile.value = await profileApi.fetchProfile()
    if (profile.value) {
      editForm.value = {
        username: profile.value.username ?? '',
        display_name: profile.value.displayName ?? ''
      }
    }
  } finally {
    loading.value = false
  }
}

function startEditing() {
  editing.value = true
}

function cancelEditing() {
  editing.value = false
  if (profile.value) {
    editForm.value = {
      username: profile.value.username ?? '',
      display_name: profile.value.displayName ?? ''
    }
  }
}

async function saveProfile() {
  if (!editForm.value.username.trim()) return
  
  saving.value = true
  try {
    const success = await profileApi.updateProfile({
      username: editForm.value.username,
      display_name: editForm.value.display_name || undefined
    })
    
    if (success) {
      await loadProfile()
      editing.value = false
    }
  } finally {
    saving.value = false
  }
}

async function handleLogout() {
  await auth.signOut()
}
</script>

<template>
  <div class="space-y-6">
    <header>
      <h1 class="text-xl sm:text-2xl font-bold flex items-center gap-2">
        <User class="h-6 w-6 text-primary" />
        Mi Perfil
      </h1>
      <p class="text-muted-foreground text-sm">
        Gestiona tu cuenta y estadísticas
      </p>
    </header>

    <div v-if="loading" class="flex justify-center py-12">
      <div class="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
    </div>

    <template v-else-if="profile">
      <Card class="overflow-hidden">
        <div class="h-24 bg-linear-to-r from-primary/20 via-primary/10 to-exp-legendary/20 relative">
          <div class="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(var(--primary),0.3),transparent)]" />
        </div>
        
        <CardContent class="-mt-12 relative">
          <div class="flex flex-col sm:flex-row items-center sm:items-end gap-4">
            <Avatar class="h-24 w-24 border-4 border-background shadow-xl">
              <AvatarFallback class="bg-primary text-3xl text-primary-foreground">
                {{ profile.username?.charAt(0)?.toUpperCase() ?? '?' }}
              </AvatarFallback>
            </Avatar>
            
            <div class="flex-1 text-center sm:text-left space-y-1">
              <h2 class="text-2xl font-bold">
                {{ profile.displayName || profile.username }}
              </h2>
              <p class="text-muted-foreground">@{{ profile.username }}</p>
            </div>

            <div class="flex gap-2">
              <Button 
                v-if="!editing"
                variant="outline" 
                size="sm"
                @click="startEditing"
              >
                <Edit2 class="h-4 w-4 mr-2" />
                Editar
              </Button>
              <template v-else>
                <Button 
                  variant="ghost" 
                  size="sm"
                  @click="cancelEditing"
                >
                  <X class="h-4 w-4" />
                </Button>
                <Button 
                  size="sm"
                  @click="saveProfile"
                  :disabled="saving"
                >
                  <Save class="h-4 w-4 mr-2" />
                  Guardar
                </Button>
              </template>
            </div>
          </div>

          <div v-if="editing" class="mt-6 space-y-4 p-4 bg-muted/50 rounded-lg">
            <div class="space-y-2">
              <Label for="username">Nombre de usuario</Label>
              <Input 
                id="username" 
                v-model="editForm.username" 
                placeholder="Tu nombre de usuario"
                class="w-full"
              />
            </div>
            <div class="space-y-2">
              <Label for="displayName">Nombre para mostrar</Label>
              <Input 
                id="displayName" 
                v-model="editForm.display_name" 
                placeholder="Tu nombre público"
                class="w-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card class="text-center py-4">
          <div class="flex flex-col items-center gap-1">
            <Sparkles class="h-6 w-6 text-exp-legendary" />
            <span class="text-2xl font-bold">{{ profile.level }}</span>
            <span class="text-xs text-muted-foreground">Nivel</span>
          </div>
        </Card>
        <Card class="text-center py-4">
          <div class="flex flex-col items-center gap-1">
            <Trophy class="h-6 w-6 text-exp-medium" />
            <span class="text-2xl font-bold">{{ profile.totalExp }}</span>
            <span class="text-xs text-muted-foreground">EXP Total</span>
          </div>
        </Card>
        <Card class="text-center py-4">
          <div class="flex flex-col items-center gap-1">
            <Target class="h-6 w-6 text-primary" />
            <span class="text-2xl font-bold">{{ expProgress.current }}</span>
            <span class="text-xs text-muted-foreground">EXP Nivel</span>
          </div>
        </Card>
        <Card class="text-center py-4">
          <div class="flex flex-col items-center gap-1">
            <Calendar class="h-6 w-6 text-exp-easy" />
            <span class="text-2xl font-bold">{{ expProgress.needed - expProgress.current }}</span>
            <span class="text-xs text-muted-foreground">Para subir</span>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle class="text-base">Progreso al siguiente nivel</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="space-y-2">
            <div class="flex justify-between text-sm">
              <span>Nivel {{ profile.level }}</span>
              <span>Nivel {{ profile.level + 1 }}</span>
            </div>
            <div class="h-4 bg-muted rounded-full overflow-hidden">
              <div 
                class="h-full bg-linear-to-r from-primary via-exp-medium to-exp-legendary rounded-full transition-all duration-500"
                :style="{ width: `${expProgress.progress}%` }"
              />
            </div>
            <p class="text-center text-sm text-muted-foreground">
              {{ expProgress.current }} / {{ expProgress.needed }} EXP
            </p>
          </div>
        </CardContent>
      </Card>

      <Card class="border-destructive/30">
        <CardHeader>
          <CardTitle class="text-base text-destructive">Zona de peligro</CardTitle>
        </CardHeader>
        <CardContent>
          <Button 
            variant="destructive" 
            class="w-full"
            @click="handleLogout"
          >
            <LogOut class="h-4 w-4 mr-2" />
            Cerrar sesión
          </Button>
        </CardContent>
      </Card>
    </template>
  </div>
</template>
