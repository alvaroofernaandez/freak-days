<script setup lang="ts">
import type { MangaEntry } from '@/composables/useManga'
import { BookOpen, CheckCircle2, Heart, TrendingUp, Euro } from 'lucide-vue-next'
import { Card } from '@/components/ui/card'

interface Props {
  mangas: MangaEntry[]
}

const props = defineProps<Props>()

const stats = computed(() => {
    const total = props.mangas.length
    const totalVolumes = props.mangas.reduce((sum, m) => sum + m.ownedVolumes.length, 0)
    const completed = props.mangas.filter(m => m.status === 'completed').length
    const wishlist = props.mangas.filter(m => m.status === 'wishlist').length
    const collecting = props.mangas.filter(m => m.status === 'collecting').length
    
    const totalCost = props.mangas.reduce((sum, m) => {
      const cost = m.totalCost ?? 0
      return sum + cost
    }, 0)

    return {
      total,
      totalVolumes,
      completed,
      wishlist,
      collecting,
      totalCost: Math.round(totalCost * 100) / 100,
    }
  })
</script>

<template>
  <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
    <Card class="text-center py-3">
      <div class="text-2xl font-bold text-primary">{{ stats.total }}</div>
      <div class="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-1">
        <BookOpen class="h-3 w-3" />
        Series
      </div>
    </Card>

    <Card class="text-center py-3">
      <div class="text-2xl font-bold text-exp-easy">{{ stats.totalVolumes }}</div>
      <div class="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-1">
        <BookOpen class="h-3 w-3" />
        Tomos
      </div>
    </Card>

    <Card class="text-center py-3">
      <div class="text-2xl font-bold text-exp-legendary">{{ stats.completed }}</div>
      <div class="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-1">
        <CheckCircle2 class="h-3 w-3" />
        Completas
      </div>
    </Card>

    <Card class="text-center py-3">
      <div class="text-2xl font-bold text-secondary">{{ stats.collecting }}</div>
      <div class="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-1">
        <TrendingUp class="h-3 w-3" />
        En curso
      </div>
    </Card>

    <Card class="text-center py-3">
      <div class="text-2xl font-bold text-accent">{{ stats.wishlist }}</div>
      <div class="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-1">
        <Heart class="h-3 w-3" />
        Wishlist
      </div>
    </Card>

    <Card class="text-center py-3">
      <div class="text-2xl font-bold text-exp-medium">{{ stats.totalCost.toFixed(2) }}€</div>
      <div class="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-1">
        <Euro class="h-3 w-3" />
        Total
      </div>
    </Card>
  </div>
</template>

