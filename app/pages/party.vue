<script setup lang="ts">
import { Users, Plus, Crown, UserPlus, X, Copy, Check, LogOut } from 'lucide-vue-next'
import type { Party } from '@/composables/useParties'

const partiesApi = useParties()
const authStore = useAuthStore()

const parties = ref<Party[]>([])
const loading = ref(true)
const showCreateModal = ref(false)
const showJoinModal = ref(false)
const copiedCode = ref<string | null>(null)

const newParty = ref({
  name: '',
  description: ''
})

const joinCode = ref('')

onMounted(async () => {
  await loadParties()
})

async function loadParties() {
  loading.value = true
  try {
    parties.value = await partiesApi.fetchUserParties()
  } finally {
    loading.value = false
  }
}

async function createParty() {
  if (!newParty.value.name.trim()) return

  const created = await partiesApi.createParty(newParty.value.name, newParty.value.description || undefined)
  if (created) {
    parties.value.push(created)
    newParty.value = { name: '', description: '' }
    showCreateModal.value = false
  }
}

async function joinParty() {
  if (!joinCode.value.trim()) return

  const joined = await partiesApi.joinByCode(joinCode.value)
  if (joined) {
    parties.value.push(joined)
    joinCode.value = ''
    showJoinModal.value = false
  }
}

async function leaveParty(partyId: string) {
  const success = await partiesApi.leaveParty(partyId)
  if (success) {
    parties.value = parties.value.filter(p => p.id !== partyId)
  }
}

function copyInviteCode(code: string) {
  navigator.clipboard.writeText(code)
  copiedCode.value = code
  setTimeout(() => {
    copiedCode.value = null
  }, 2000)
}

function isOwner(party: Party): boolean {
  return party.ownerId === authStore.userId
}
</script>

<template>
  <div class="space-y-6">
    <header class="flex items-center justify-between">
      <div>
        <h1 class="text-xl sm:text-2xl font-bold flex items-center gap-2">
          <Users class="h-6 w-6 text-primary" />
          Party System
        </h1>
        <p class="text-muted-foreground text-sm">
          Crea grupos con tus amigos
        </p>
      </div>
      <Button size="icon" class="h-10 w-10 rounded-full glow-primary" @click="showCreateModal = true">
        <Plus class="h-5 w-5" />
      </Button>
    </header>

    <section v-if="!loading && parties.length > 0" class="space-y-3">
      <h2 class="text-sm font-medium text-muted-foreground uppercase tracking-wider">
        Tus Parties
      </h2>
      
      <Card v-for="party in parties" :key="party.id" class="hover:border-primary/30 transition-colors">
        <CardHeader class="flex flex-col gap-3 py-4 px-4">
          <div class="flex items-center gap-3">
            <Avatar class="h-12 w-12">
              <AvatarFallback class="bg-primary/20 text-primary text-lg">
                {{ party.name.charAt(0) }}
              </AvatarFallback>
            </Avatar>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <CardTitle class="text-base font-medium">{{ party.name }}</CardTitle>
                <Crown v-if="isOwner(party)" class="h-4 w-4 text-exp-medium" />
              </div>
              <CardDescription class="text-sm">{{ party.members.length }} miembros</CardDescription>
            </div>
          </div>
          
          <div class="flex items-center justify-between gap-2">
            <div v-if="party.inviteCode" class="flex items-center gap-2">
              <code class="px-2 py-1 bg-muted rounded text-xs font-mono">{{ party.inviteCode }}</code>
              <Button 
                variant="ghost" 
                size="icon" 
                class="h-7 w-7"
                @click="copyInviteCode(party.inviteCode!)"
              >
                <Check v-if="copiedCode === party.inviteCode" class="h-3 w-3 text-exp-easy" />
                <Copy v-else class="h-3 w-3" />
              </Button>
            </div>
            <Button 
              v-if="!isOwner(party)"
              variant="ghost" 
              size="sm"
              class="text-destructive hover:text-destructive"
              @click="leaveParty(party.id)"
            >
              <LogOut class="h-4 w-4 mr-1" />
              Salir
            </Button>
          </div>

          <div class="flex -space-x-2">
            <Avatar v-for="member in party.members.slice(0, 5)" :key="member.id" class="h-8 w-8 border-2 border-background">
              <AvatarFallback class="text-xs">
                {{ member.profile?.username?.charAt(0) ?? '?' }}
              </AvatarFallback>
            </Avatar>
            <div v-if="party.members.length > 5" class="h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs">
              +{{ party.members.length - 5 }}
            </div>
          </div>
        </CardHeader>
      </Card>
    </section>

    <div v-if="loading" class="text-center py-8">
      <div class="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
    </div>

    <Card class="border-dashed border-2">
      <CardHeader class="text-center py-8">
        <UserPlus class="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
        <CardTitle class="text-base">Únete a una Party</CardTitle>
        <CardDescription class="text-sm">
          Usa un código de invitación para unirte
        </CardDescription>
        <Button variant="outline" class="mt-4" @click="showJoinModal = true">
          Introducir Código
        </Button>
      </CardHeader>
    </Card>

    <div v-if="showCreateModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <Card class="w-full max-w-sm">
        <CardHeader class="flex flex-row items-center justify-between">
          <CardTitle>Crear Party</CardTitle>
          <Button variant="ghost" size="icon" @click="showCreateModal = false">
            <X class="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="space-y-2">
            <Label for="name">Nombre</Label>
            <Input id="name" v-model="newParty.name" placeholder="Ej: Nakamas del Anime" class="w-full" />
          </div>
          <div class="space-y-2">
            <Label for="description">Descripción (opcional)</Label>
            <Input id="description" v-model="newParty.description" placeholder="Descripción del grupo" class="w-full" />
          </div>
          <Button class="w-full" @click="createParty" :disabled="!newParty.name.trim()">
            Crear Party
          </Button>
        </CardContent>
      </Card>
    </div>

    <div v-if="showJoinModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <Card class="w-full max-w-sm">
        <CardHeader class="flex flex-row items-center justify-between">
          <CardTitle>Unirse a Party</CardTitle>
          <Button variant="ghost" size="icon" @click="showJoinModal = false">
            <X class="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="space-y-2">
            <Label for="code">Código de Invitación</Label>
            <Input 
              id="code" 
              v-model="joinCode" 
              placeholder="ABC123" 
              class="w-full font-mono uppercase text-center text-lg tracking-widest"
              maxlength="6"
            />
          </div>
          <Button class="w-full" @click="joinParty" :disabled="joinCode.length !== 6">
            Unirse
          </Button>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
