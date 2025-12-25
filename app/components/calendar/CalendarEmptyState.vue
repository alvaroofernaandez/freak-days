<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Calendar as CalendarIcon, Plus, Sparkles } from 'lucide-vue-next'
</script>

<template>
  <Card
    class="border-dashed border-2 border-primary/30 bg-linear-to-br from-background to-muted/20 relative overflow-hidden"
  >
    <div class="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
    <div class="absolute bottom-0 left-0 w-24 h-24 bg-accent/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

    <CardContent class="relative py-12 sm:py-16 px-4 sm:px-6">
      <div class="flex flex-col items-center text-center space-y-4 sm:space-y-6 max-w-md mx-auto">
        <div class="relative">
          <div class="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
          <div class="relative bg-linear-to-br from-primary/20 to-accent/20 p-4 sm:p-6 rounded-full">
            <CalendarIcon class="h-12 w-12 sm:h-16 sm:w-16 text-primary" />
          </div>
        </div>

        <div class="space-y-2">
          <h3 class="text-xl sm:text-2xl font-bold bg-linear-to-r from-primary to-accent bg-clip-text text-transparent">
            ¡Comienza a planificar!
          </h3>
          <p class="text-muted-foreground text-sm sm:text-base leading-relaxed px-2">
            Añade eventos, episodios de anime y tomos de manga a tu calendario para no perderte ningún lanzamiento
          </p>
        </div>

        <Button size="lg" class="glow-primary group relative overflow-hidden min-h-[44px]" @click="$emit('add')">
          <span class="relative z-10 flex items-center justify-center">
            <Plus class="h-5 w-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
            <span>Añadir Primer Evento</span>
          </span>
          <div
            class="absolute inset-0 bg-linear-to-r from-primary to-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          />
        </Button>

        <div class="pt-3 sm:pt-4 border-t border-border/50 w-full px-2">
          <p class="text-xs text-muted-foreground flex items-center justify-center gap-2 flex-wrap">
            <Sparkles class="h-3 w-3 shrink-0" />
            <span class="text-center">Arrastra eventos entre fechas para reorganizarlos fácilmente</span>
          </p>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

