<script setup lang="ts">
import { UserPlus, Mail, Lock, Eye, EyeOff, Gamepad2, Sparkles, Zap, Check, ShieldCheck, AlertCircle } from 'lucide-vue-next'
import { useAuthStore } from '../../stores/auth'

definePageMeta({
  layout: false
})

const auth = useAuth()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const success = ref(false)

const passwordsMatch = computed(() => password.value === confirmPassword.value)
const isValidPassword = computed(() => password.value.length >= 6)

const passwordStrength = computed(() => {
  const p = password.value
  if (!p) return 0
  let score = 0
  if (p.length >= 6) score++
  if (p.length >= 10) score++
  if (/[A-Z]/.test(p)) score++
  if (/[0-9]/.test(p)) score++
  if (/[^A-Za-z0-9]/.test(p)) score++
  return Math.min(score, 4)
})

const strengthLabel = computed(() => {
  const labels = ['', 'Débil', 'Regular', 'Fuerte', '¡Épica!']
  return labels[passwordStrength.value]
})

const strengthColor = computed(() => {
  const colors = ['', 'bg-destructive', 'bg-exp-hard', 'bg-exp-medium', 'bg-exp-easy']
  return colors[passwordStrength.value]
})

async function handleSubmit() {
  if (!email.value || !password.value || !passwordsMatch.value || !isValidPassword.value) return
  
  const result = await auth.signUp(email.value, password.value)
  
  if (result.success) {
    success.value = true
  }
}

function handleGoogleSignIn() {
  auth.signInWithGoogle()
}
</script>

<template>
  <div class="min-h-screen-safe flex flex-col animated-gradient-bg overflow-hidden relative">
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute top-20 right-20 w-32 h-32 bg-secondary/10 rounded-full blur-3xl" />
      <div class="absolute bottom-32 left-16 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
      <div class="absolute top-1/3 left-1/4 w-64 h-64 bg-accent/5 rounded-full blur-3xl" />
    </div>

    <div class="flex-1 flex items-center justify-center p-4 relative z-10">
      <div class="w-full max-w-md">
        <div class="glass rounded-3xl p-8 space-y-6 glow-border">
          <header class="text-center space-y-4">
            <div class="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-linear-to-br from-primary via-accent to-secondary p-[2px] mb-2">
              <div class="w-full h-full rounded-2xl bg-card flex items-center justify-center">
                <Gamepad2 class="h-10 w-10 text-primary" />
              </div>
            </div>
            
            <div>
              <h1 class="text-3xl font-bold text-gradient">FreakDays</h1>
              <div class="flex items-center justify-center gap-2 mt-2">
                <Sparkles class="h-4 w-4 text-accent" />
                <p class="text-muted-foreground text-sm">Tu vida, gamificada</p>
                <Zap class="h-4 w-4 text-secondary" />
              </div>
            </div>

            <h2 class="text-xl font-semibold text-foreground pt-2">Únete a la aventura</h2>
          </header>

          <div v-if="success" class="text-center space-y-6 py-4">
            <div class="inline-flex items-center justify-center w-20 h-20 rounded-full bg-exp-easy/20 border-2 border-exp-easy/50">
              <Check class="h-10 w-10 text-exp-easy" />
            </div>
            <div class="space-y-2">
              <h3 class="text-xl font-bold text-exp-easy">¡Cuenta creada!</h3>
              <p class="text-muted-foreground text-sm">
                Revisa tu email para confirmar tu cuenta<br/>
                <span class="text-xs">y desbloquear tu primera quest 🎮</span>
              </p>
            </div>
            <Button as-child class="w-full h-12 bg-linear-to-r from-primary to-accent">
              <NuxtLink to="/login" class="font-semibold">
                Ir al Login
              </NuxtLink>
            </Button>
          </div>

          <template v-else>
            <Button 
              type="button"
              variant="outline" 
              class="w-full h-12 text-base font-medium gap-3"
              :disabled="authStore.loading"
              @click="handleGoogleSignIn"
            >
              <svg class="h-5 w-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Registrarse con Google
            </Button>

            <div class="flex items-center gap-4">
              <Separator class="flex-1" />
              <span class="text-xs text-muted-foreground uppercase tracking-wider">o con email</span>
              <Separator class="flex-1" />
            </div>

            <form class="space-y-4" @submit.prevent="handleSubmit">
              <div class="space-y-2">
                <Label for="email" class="text-sm font-medium">Email</Label>
                <div class="relative group">
                  <Mail class="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                  <Input
                    id="email"
                    v-model="email"
                    type="email"
                    placeholder="tu@email.com"
                    class="w-full pl-11 h-12 bg-background/50 border-border/50 focus:border-primary transition-all"
                    required
                  />
                </div>
              </div>

              <div class="space-y-2">
                <Label for="password" class="text-sm font-medium">Contraseña</Label>
                <div class="relative group">
                  <Lock class="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                  <Input
                    id="password"
                    v-model="password"
                    :type="showPassword ? 'text' : 'password'"
                    placeholder="Mínimo 6 caracteres"
                    class="w-full pl-11 pr-12 h-12 bg-background/50 border-border/50 focus:border-primary transition-all"
                    required
                  />
                  <button
                    type="button"
                    class="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    @click="showPassword = !showPassword"
                  >
                    <Eye v-if="!showPassword" class="h-4 w-4" />
                    <EyeOff v-else class="h-4 w-4" />
                  </button>
                </div>
                
                <div v-if="password" class="space-y-2">
                  <div class="flex gap-1 h-1.5">
                    <div 
                      v-for="i in 4" 
                      :key="i"
                      class="flex-1 rounded-full transition-all duration-300"
                      :class="i <= passwordStrength ? strengthColor : 'bg-muted'"
                    />
                  </div>
                  <div class="flex justify-between items-center text-xs">
                    <span class="text-muted-foreground">Fuerza:</span>
                    <span :class="passwordStrength >= 3 ? 'text-exp-easy' : passwordStrength >= 2 ? 'text-exp-medium' : 'text-destructive'">
                      {{ strengthLabel }}
                    </span>
                  </div>
                </div>
              </div>

              <div class="space-y-2">
                <Label for="confirmPassword" class="text-sm font-medium">Confirmar Contraseña</Label>
                <div class="relative group">
                  <ShieldCheck class="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                  <Input
                    id="confirmPassword"
                    v-model="confirmPassword"
                    type="password"
                    placeholder="Repite la contraseña"
                    class="w-full pl-11 h-12 bg-background/50 border-border/50 focus:border-primary transition-all"
                    :class="confirmPassword && !passwordsMatch ? 'border-destructive focus:border-destructive' : ''"
                    required
                  />
                  <Check 
                    v-if="confirmPassword && passwordsMatch"
                    class="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-exp-easy"
                  />
                </div>
                <p v-if="confirmPassword && !passwordsMatch" class="text-xs text-destructive flex items-center gap-1">
                  <span>⚠️</span> Las contraseñas no coinciden
                </p>
              </div>

              <div v-if="authStore.error" class="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
                <AlertCircle class="h-4 w-4 shrink-0" />
                {{ authStore.error }}
              </div>

              <Button 
                type="submit" 
                class="w-full h-12 text-base font-semibold bg-linear-to-r from-primary to-accent hover:opacity-90 transition-opacity" 
                :disabled="authStore.loading || !passwordsMatch || !isValidPassword"
              >
                <UserPlus v-if="!authStore.loading" class="h-5 w-5 mr-2" />
                <span v-if="authStore.loading" class="flex items-center gap-2">
                  <span class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creando cuenta...
                </span>
                <span v-else>Crear Cuenta</span>
              </Button>
            </form>

            <p class="text-center text-sm text-muted-foreground">
              ¿Ya tienes cuenta?
              <NuxtLink 
                to="/login" 
                class="text-primary hover:text-accent transition-colors font-semibold ml-1"
              >
                Inicia sesión
              </NuxtLink>
            </p>
          </template>
        </div>

        <p class="text-center text-xs text-muted-foreground/60 mt-6">
          🎮 Nivel 1 · +500 XP de bienvenida
        </p>
      </div>
    </div>
  </div>
</template>
