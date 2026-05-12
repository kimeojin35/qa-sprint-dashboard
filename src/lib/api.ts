import type { NotionSyncResponse } from '@/types/notion'

const API_BASE = '/api'

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.message || body.error || `API error: ${res.status}`)
  }
  return res.json()
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message || data.error || `API error: ${res.status}`)
  }
  return res.json()
}

export async function syncNotion(): Promise<NotionSyncResponse> {
  return fetchJson<NotionSyncResponse>('/notion/sync')
}

export async function checkNotionStatus(): Promise<{
  connected: boolean
  currentSprint?: string | null
  error?: string
}> {
  return fetchJson('/notion/status')
}

export async function chatWithAI(message: string, context: string): Promise<{ reply: string }> {
  return postJson('/chat', { message, context })
}

export async function analyzeStory(story: {
  title: string
  summary: string
  featureType: string
  category: string
}): Promise<import('@/types/report').StoryAnalysis> {
  return postJson('/analyze-story', story)
}

// Integration settings
export async function getIntegrations(): Promise<import('@/types/settings').IntegrationSettings> {
  return fetchJson('/settings/integrations')
}

export async function saveIntegrations(
  settings: Partial<import('@/types/settings').IntegrationSettings>,
): Promise<{ ok: boolean }> {
  return postJson('/settings/integrations', settings)
}

export async function testNotionConnection(): Promise<{ connected: boolean; message: string }> {
  return postJson('/settings/test-notion', {})
}

export async function testGithubConnection(): Promise<{ connected: boolean; message: string }> {
  return postJson('/settings/test-github', {})
}
