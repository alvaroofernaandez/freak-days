#!/usr/bin/env node

/**
 * Script helper para migraciones de Supabase
 * 
 * Este script muestra el SQL de migración y proporciona instrucciones.
 * Para ejecutar la migración, usa el SQL Editor en Supabase Dashboard.
 * 
 * Uso:
 *   node database/migrations/run-migration.js
 */

import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

function showMigration() {
  const migrationFile = join(__dirname, '001_workouts_sets_migration.sql')
  
  try {
    console.log('📋 Script de Migración: Workouts con Series\n')
    console.log('═'.repeat(60))
    console.log('\n📖 Para ejecutar esta migración:\n')
    console.log('1. Ve a tu proyecto en Supabase Dashboard')
    console.log('2. Navega a SQL Editor')
    console.log('3. Copia y pega el siguiente SQL:\n')
    console.log('─'.repeat(60))
    
    const sql = readFileSync(migrationFile, 'utf-8')
    console.log(sql)
    
    console.log('\n─'.repeat(60))
    console.log('\n✅ Después de ejecutar, verifica con:\n')
    console.log('SELECT COUNT(*) FROM public.workout_sets;')
    console.log('SELECT COUNT(*) FROM public.workouts WHERE status = \'in_progress\';\n')
    
  } catch (error) {
    console.error('❌ Error leyendo archivo de migración:', error.message)
    process.exit(1)
  }
}

showMigration()

