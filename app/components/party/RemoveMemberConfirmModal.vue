<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { UserMinus } from 'lucide-vue-next'
import type { Party, PartyMember } from '@/composables/useParties'

type ReadonlyParty = Readonly<Omit<Party, 'members'>> & {
  readonly members: readonly Readonly<PartyMember>[]
}

type ReadonlyPartyMember = Readonly<PartyMember>

interface Props {
  open: boolean
  party: ReadonlyParty | Party | null
  member: ReadonlyPartyMember | PartyMember | null
  isSubmitting: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  confirm: [partyId: string, memberId: string]
}>()
</script>

<template>
  <ClientOnly>
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="open && party && member"
          class="fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-6 bg-background/95 backdrop-blur-sm overflow-y-auto"
          style="pointer-events: auto;"
          @click.self="emit('close')"
          @keydown.esc="emit('close')"
          role="dialog"
          aria-modal="true"
          aria-labelledby="remove-member-title"
        >
          <Card class="w-full max-w-md shadow-xl border-2 border-destructive/20 my-auto" @click.stop>
            <CardHeader class="p-4 sm:p-6">
              <CardTitle id="remove-member-title" class="text-destructive text-lg sm:text-xl">
                Expulsar Miembro
              </CardTitle>
              <CardDescription class="text-sm sm:text-base mt-2">
                ¿Estás seguro de que quieres expulsar a
                <strong>{{ member.profile?.displayName || member.profile?.username || 'este miembro' }}</strong>
                de "{{ party.name }}"?
              </CardDescription>
            </CardHeader>
            <CardContent class="flex flex-col sm:flex-row gap-2 p-4 sm:p-6 pt-0">
              <Button variant="outline" class="flex-1 min-h-[44px]" @click="emit('close')" :disabled="isSubmitting">
                Cancelar
              </Button>
              <Button variant="destructive" class="flex-1 min-h-[44px]" @click="emit('confirm', party.id, member.id)"
                :disabled="isSubmitting">
                <UserMinus v-if="!isSubmitting" class="h-4 w-4 mr-2" />
                <span v-else class="animate-spin mr-2">⏳</span>
                {{ isSubmitting ? 'Expulsando...' : 'Expulsar' }}
              </Button>
            </CardContent>
          </Card>
        </div>
      </Transition>
    </Teleport>
  </ClientOnly>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>

