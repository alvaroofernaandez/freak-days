<script setup lang="ts">
import { ArrowRight } from 'lucide-vue-next'
import Logo from '@/components/Logo.vue'
</script>

<template>
  <section class="flex flex-col items-center text-center space-y-6 py-8">
    <div class="relative">
      <div class="absolute -inset-4 bg-primary/20 blur-3xl rounded-full animate-pulse" />
      <Logo class="relative h-16 w-16" />
    </div>

    <div class="space-y-2">
      <h1 class="text-3xl sm:text-4xl font-bold text-gradient">
        Bienvenido a FreakDays
      </h1>
      <p class="text-muted-foreground text-base sm:text-lg max-w-md mx-auto">
        Tu compañero para gestionar tu vida friki
      </p>
    </div>

    <Button size="lg" class="glow-primary" as-child>
      <NuxtLink to="/onboarding" class="flex items-center gap-2">
        Comenzar Aventura
        <ArrowRight class="h-4 w-4" />
      </NuxtLink>
    </Button>
  </section>
</template>

