<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'

type StatusDocument = {
  last_status_update: string
  error: string | null
  server_name: string
  server_type: string
  platform: string
  player_count: number
  password_protected: boolean
  vac_enabled: boolean
  port: number
  steam_id: string | number
  keywords: string
  game_id: number
}

const snapshot = ref<StatusDocument | null>(null)
const state = ref<'loading' | 'online' | 'offline'>('loading')
const errorMessage = ref('')
let refreshTimer: ReturnType<typeof setInterval> | undefined

const payload = computed(() => snapshot.value && Object.fromEntries(
  Object.entries(snapshot.value).filter(([key]) => key !== 'players'),
))

const checkedTime = computed(() => {
  if (!snapshot.value) return 'WAITING FOR FIRST PING'
  const date = new Date(snapshot.value.last_status_update)
  if (Number.isNaN(date.getTime())) return snapshot.value.last_status_update
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date)
})

function serverTypeLabel(type: string) {
  return type === 'd' ? 'DEDICATED' : type.toUpperCase()
}

function platformLabel(platform: string) {
  return platform === 'l' ? 'LINUX' : platform.toUpperCase()
}

async function refresh() {
  if (state.value === 'loading') return
  state.value = 'loading'
  errorMessage.value = ''

  try {
    const response = await fetch('/api/status')
    const result = await response.json()
    if (!response.ok) throw new Error(result.error || 'The status source did not return a response.')
    snapshot.value = result as StatusDocument
    errorMessage.value = result.error || ''
    state.value = result.error ? 'offline' : 'online'
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Could not reach the status service.'
    state.value = 'offline'
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
      <section class="hero-panel mb-3 grid gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div class="relative z-10 min-w-0">
          <div class="mb-3 flex flex-wrap items-center gap-2">
            <span class="eyebrow">REALM / {{ snapshot?.game_id || '01' }}</span>
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
          <h1 class="font-display max-w-3xl truncate text-3xl leading-tight text-stone-100 sm:text-4xl lg:text-[2.8rem]">
            {{ snapshot?.server_name || (state === 'offline' ? 'The realm is quiet' : 'Listening for the realm') }}
          </h1>
          <p class="mono mt-2 truncate text-xs text-stone-400">
            <span>{{ snapshot ? serverTypeLabel(snapshot.server_type) : 'WORLD UNKNOWN' }}</span>
            <span class="mx-2 text-stone-600">/</span>
            <span>{{ snapshot ? platformLabel(snapshot.platform) : 'PLATFORM UNKNOWN' }}</span>
          </p>
          <p v-if="state === 'offline'" class="mt-3 max-w-xl text-xs leading-relaxed text-orange-200/80">
            {{ errorMessage }}<span v-if="!snapshot"> Check <code>STATUS_BASE_URL</code> in <code>.env</code>.</span>
          </p>
        </div>

        <div class="relative z-10 border-t border-white/10 pt-3 lg:border-l lg:border-t-0 lg:px-5 lg:pb-1 lg:pt-0">
          <p class="eyebrow mb-1.5">ACTIVE PLAYERS</p>
          <p class="font-display text-4xl leading-none text-stone-100 sm:text-5xl lg:text-[2.8rem]">{{ snapshot?.player_count ?? '—' }}</p>
          <p class="mono mt-2 text-[10px] text-stone-500">LAST UPDATE · {{ checkedTime }}</p>
        </div>
      </section>

      <section class="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-3" aria-label="Server summary">
        <article class="metric-card">
          <p class="eyebrow">WORLD ID</p>
          <p class="metric-value text-base sm:text-lg">{{ snapshot?.game_id || '—' }}</p>
        </article>
        <article class="metric-card">
          <p class="eyebrow">PORT</p>
          <p class="metric-value">{{ snapshot?.port || '—' }}</p>
        </article>
        <article class="metric-card">
          <p class="eyebrow">ACCESS</p>
          <p class="metric-value text-base sm:text-lg">{{ snapshot ? (snapshot.password_protected ? 'SEALED' : 'OPEN') : '—' }}</p>
        </article>
      </section>

      <div class="grid gap-3">
        <section class="data-panel">
          <div class="panel-heading">
            <div>
              <p class="eyebrow">WORLD PARAMETERS</p>
              <h2 class="mt-1 font-display text-xl text-stone-100">Field notes</h2>
            </div>
          </div>
          <dl class="details-grid">
            <div class="detail-row"><dt>Server class</dt><dd>{{ snapshot ? serverTypeLabel(snapshot.server_type) : '—' }}</dd></div>
            <div class="detail-row"><dt>Platform</dt><dd>{{ snapshot ? platformLabel(snapshot.platform) : '—' }}</dd></div>
            <div class="detail-row"><dt>Steam ID</dt><dd>{{ snapshot?.steam_id ?? '—' }}</dd></div>
            <div class="detail-row"><dt>Game ID</dt><dd>{{ snapshot?.game_id ?? '—' }}</dd></div>
            <div class="detail-row"><dt>VAC</dt><dd>{{ snapshot ? (snapshot.vac_enabled ? 'ENABLED' : 'DISABLED') : '—' }}</dd></div>
            <div class="detail-row"><dt>Keywords</dt><dd class="truncate">{{ snapshot?.keywords || '—' }}</dd></div>
            <div class="detail-row"><dt>Last update</dt><dd>{{ checkedTime }}</dd></div>
          </dl>
        </section>
      </div>

      <details v-if="snapshot" class="payload-panel mt-3">
        <summary>
          <span>API PAYLOAD</span>
          <span class="mono text-[9px] tracking-[0.16em] text-stone-500">{{ Object.keys(payload || {}).length }} FIELDS</span>
        </summary>
        <pre>{{ JSON.stringify(payload, null, 2) }}</pre>
      </details>

      <footer class="mono mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-2 text-[9px] tracking-[0.12em] text-stone-600">
        <span>HTTP STATUS FEED</span>
      </footer>
    </div>
  </main>
</template>
