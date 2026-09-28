<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'

type Player = {
  name?: string
  raw?: Record<string, unknown>
}

type ServerSnapshot = {
  name: string
  map: string
  password: boolean
  numplayers: number
  maxplayers: number
  players: Player[]
  bots: Player[]
  connect: string
  ping: number
  queryPort: number
  version: string
  raw: Record<string, unknown>
  target: string
  checkedAt: string
}

const snapshot = ref<ServerSnapshot | null>(null)
const target = ref('')
const state = ref<'loading' | 'online' | 'offline'>('loading')
const errorMessage = ref('')
const copied = ref(false)
let refreshTimer: ReturnType<typeof setInterval> | undefined

const playerSlots = computed(() => {
  if (!snapshot.value) return '—'
  return `${snapshot.value.numplayers} / ${snapshot.value.maxplayers}`
})

const checkedTime = computed(() => {
  if (!snapshot.value) return 'WAITING FOR FIRST PING'
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(snapshot.value.checkedAt))
})

async function refresh() {
  if (state.value === 'loading') return
  state.value = 'loading'
  errorMessage.value = ''

  try {
    const response = await fetch('/api/status')
    const result = await response.json()
    target.value = result.target || target.value
    if (!response.ok) throw new Error(result.error || 'The query did not return a response.')
    snapshot.value = result as ServerSnapshot
    state.value = 'online'
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Could not reach the status service.'
    state.value = 'offline'
  }
}

async function copyAddress() {
  if (!snapshot.value?.connect) return
  try {
    await navigator.clipboard.writeText(snapshot.value.connect)
    copied.value = true
    window.setTimeout(() => (copied.value = false), 1400)
  } catch {
    copied.value = false
  }
}

onMounted(() => {
  state.value = 'offline'
  void refresh()
  refreshTimer = setInterval(() => void refresh(), 30_000)
})

onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer)
})
</script>

<template>
  <main class="min-h-screen px-3 py-4 text-stone-100 sm:px-5 sm:py-6">
    <div class="mx-auto max-w-6xl">
      <header class="mb-5 flex items-center justify-between border-b border-white/10 pb-3">
        <div class="flex items-center gap-3">
          <div class="brand-mark" aria-hidden="true"><span></span><span></span><span></span></div>
          <div>
            <p class="font-display text-sm font-semibold tracking-[0.2em] text-stone-100">RAVEN / WATCH</p>
            <p class="mono mt-0.5 text-[9px] tracking-[0.2em] text-stone-500">VALHEIM SERVER TELEMETRY</p>
          </div>
        </div>
        <div class="flex items-center gap-3 sm:gap-5">
          <span class="mono hidden text-[10px] tracking-[0.15em] text-stone-500 sm:inline">AUTO PING / 30 SEC</span>
          <button
            class="refresh-button"
            :disabled="state === 'loading'"
            type="button"
            aria-label="Refresh server status"
            @click="refresh"
          >
            <svg :class="{ 'animate-spin': state === 'loading' }" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M16.5 9.2A6.6 6.6 0 1 0 17 12M16.5 4.5v4.8h-4.8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <span class="mono text-[10px] tracking-wider">{{ state === 'loading' ? 'PINGING' : 'REFRESH' }}</span>
          </button>
        </div>
      </header>

      <section class="hero-panel mb-3 grid gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <div class="relative z-10 min-w-0">
          <div class="mb-3 flex flex-wrap items-center gap-2">
            <span class="eyebrow">REALM / 01</span>
            <span
              class="status-pill"
              :class="{
                'status-online': state === 'online',
                'status-offline': state === 'offline',
                'status-loading': state === 'loading',
              }"
            >
              <span class="status-dot"></span>
              {{ state === 'online' ? 'ONLINE' : state === 'loading' ? 'QUERYING' : 'NO SIGNAL' }}
            </span>
          </div>
          <h1 class="font-display max-w-3xl truncate text-3xl leading-tight text-stone-100 sm:text-4xl lg:text-[2.8rem]">
            {{ snapshot?.name || (state === 'offline' ? 'The realm is quiet' : 'Listening for the realm') }}
          </h1>
          <p class="mono mt-2 truncate text-xs text-stone-400">
            <span>{{ snapshot?.map || 'WORLD UNKNOWN' }}</span>
            <span class="mx-2 text-stone-600">/</span>
            <span>{{ snapshot?.version || 'VERSION UNKNOWN' }}</span>
          </p>
          <p v-if="state === 'offline'" class="mt-3 max-w-xl text-xs leading-relaxed text-orange-200/80">
            {{ errorMessage }} Configure <code>VALHEIM_HOST</code> and <code>VALHEIM_PORT</code> in <code>.env</code>.
          </p>
        </div>

        <div class="relative z-10 min-w-0 border-t border-white/10 pt-3 lg:min-w-64 lg:border-l lg:border-t-0 lg:pb-1 lg:pl-5 lg:pt-0">
          <p class="eyebrow mb-1.5">JOIN ADDRESS</p>
          <div class="flex items-center gap-2">
            <code class="mono truncate text-sm text-stone-200">{{ snapshot?.connect || target || '—' }}</code>
            <button v-if="snapshot?.connect" class="copy-button" type="button" @click="copyAddress">
              {{ copied ? 'COPIED' : 'COPY' }}
            </button>
          </div>
          <p class="mono mt-2 text-[10px] text-stone-500">LAST RESPONSE · {{ checkedTime }}</p>
        </div>
      </section>

      <section class="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Server summary">
        <article class="metric-card">
          <p class="eyebrow">IN WORLD</p>
          <p class="metric-value">{{ playerSlots }}<span class="metric-unit">VIKINGS</span></p>
        </article>
        <article class="metric-card">
          <p class="eyebrow">ROUND TRIP</p>
          <p class="metric-value">{{ snapshot ? Math.round(snapshot.ping) : '—' }}<span class="metric-unit">MS</span></p>
        </article>
        <article class="metric-card">
          <p class="eyebrow">GATE</p>
          <p class="metric-value text-base sm:text-lg">{{ snapshot?.queryPort || '—' }}<span class="metric-unit">UDP</span></p>
        </article>
        <article class="metric-card">
          <p class="eyebrow">ACCESS</p>
          <p class="metric-value text-base sm:text-lg">{{ snapshot ? (snapshot.password ? 'SEALED' : 'OPEN') : '—' }}</p>
        </article>
      </section>

      <div class="grid gap-3 lg:grid-cols-[1.15fr_0.85fr]">
        <section class="data-panel min-h-64">
          <div class="panel-heading">
            <div>
              <p class="eyebrow">THE LONGHOUSE</p>
              <h2 class="mt-1 font-display text-xl text-stone-100">Players</h2>
            </div>
            <span class="mono text-[10px] text-stone-500">{{ snapshot?.players?.length || 0 }} IDENTIFIED</span>
          </div>

          <div v-if="snapshot?.players?.length" class="divide-y divide-white/[0.07]">
            <div v-for="(player, index) in snapshot.players" :key="`${player.name}-${index}`" class="player-row">
              <span class="player-index">{{ String(index + 1).padStart(2, '0') }}</span>
              <span class="player-glyph">{{ player.name?.charAt(0)?.toUpperCase() || '?' }}</span>
              <span class="min-w-0 flex-1 truncate text-sm text-stone-200">{{ player.name || 'Unknown traveler' }}</span>
              <span class="mono text-[9px] tracking-wider text-emerald-300/75">PRESENT</span>
            </div>
          </div>
          <div v-else class="empty-roster">
            <span class="empty-rune">ᚠ</span>
            <p>{{ state === 'online' ? 'No travelers at the longhouse.' : 'Names will appear when the signal returns.' }}</p>
          </div>
          <div v-if="snapshot?.bots?.length" class="border-t border-white/[0.07] px-4 py-2">
            <p class="mono text-[10px] text-stone-500">{{ snapshot.bots.length }} BOTS · {{ snapshot.bots.map((bot) => bot.name || 'Unknown').join(', ') }}</p>
          </div>
        </section>

        <section class="data-panel">
          <div class="panel-heading">
            <div>
              <p class="eyebrow">WORLD PARAMETERS</p>
              <h2 class="mt-1 font-display text-xl text-stone-100">Field notes</h2>
            </div>
            <span class="mono text-[10px] text-stone-500">GAMEDIG / VALHEIM</span>
          </div>
          <dl class="divide-y divide-white/[0.07]">
            <div class="detail-row"><dt>World</dt><dd>{{ snapshot?.map || '—' }}</dd></div>
            <div class="detail-row"><dt>Build</dt><dd>{{ snapshot?.version || '—' }}</dd></div>
            <div class="detail-row"><dt>Capacity</dt><dd>{{ snapshot ? `${snapshot.maxplayers} slots` : '—' }}</dd></div>
            <div class="detail-row"><dt>Query port</dt><dd>{{ snapshot?.queryPort || '—' }}</dd></div>
            <div class="detail-row"><dt>Connection</dt><dd class="truncate">{{ snapshot?.connect || '—' }}</dd></div>
            <div class="detail-row"><dt>Checked</dt><dd>{{ checkedTime }}</dd></div>
          </dl>
        </section>
      </div>

      <details v-if="snapshot" class="payload-panel mt-3">
        <summary>
          <span>RAW QUERY</span>
          <span class="mono text-[9px] tracking-[0.16em] text-stone-500">{{ Object.keys(snapshot.raw || {}).length }} METADATA KEYS</span>
        </summary>
        <pre>{{ JSON.stringify(snapshot, null, 2) }}</pre>
      </details>

      <footer class="mono mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-2 text-[9px] tracking-[0.12em] text-stone-600">
        <span>RAVEN / WATCH · GAME SERVER QUERY</span>
        <span>UDP · {{ target || 'HOST UNCONFIGURED' }}</span>
      </footer>
    </div>
  </main>
</template>
