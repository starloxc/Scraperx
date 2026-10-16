import { useEffect, useState } from 'react'

interface ScraperEndpoint {
  name: string
  path: string
  method: string
  description: string
  parameters: Array<{
    name: string
    type: string
    required: boolean
    description: string
    default?: string
  }>
}

interface ScraperProviderInfo {
  id: string
  name: string
  category: 'donghua' | 'anime' | 'movies'
  version: string
  website: string
  description: string
  creditCost: number
  endpoints: ScraperEndpoint[]
}

interface ApiKeyItem {
  id: string
  keyPrefix: string
  label: string
  scopedProvider: string
  requestsCount: number
  status: 'active' | 'revoked'
}

export const PlaygroundIsland = () => {
  const [providers, setProviders] = useState<ScraperProviderInfo[]>([])
  const [keys, setKeys] = useState<ApiKeyItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState<
    'donghua' | 'anime' | 'movies'
  >('donghua')
  const [selectedProviderId, setSelectedProviderId] = useState<string>('bilibili')
  const [selectedAction, setSelectedAction] = useState<string>('search')
  const [queryInput, setQueryInput] = useState<string>('Soul Land')
  const [selectedKeyToken, setSelectedKeyToken] = useState<string>(
    'sec_live_demo_starter_key_8849',
  )
  const [customKeyInput, setCustomKeyInput] = useState<string>('')
  const [useCustomKey, setUseCustomKey] = useState<boolean>(false)

  // Execution state
  const [isRunning, setIsRunning] = useState(false)
  const [status, setStatus] = useState<number | null>(null)
  const [responseHeaders, setResponseHeaders] = useState<Record<string, string>>({})
  const [responsePayload, setResponsePayload] = useState<unknown>(null)
  const [latencyMs, setLatencyMs] = useState<number | null>(null)
  const [copiedCurl, setCopiedCurl] = useState(false)
  const [copiedJson, setCopiedJson] = useState(false)

  const loadData = async () => {
    try {
      const [provRes, keysRes] = await Promise.all([
        fetch('/api/v1/providers'),
        fetch('/api/v1/keys', { headers: { 'x-user-id': 'dev_default_user' } }),
      ])
      if (provRes.ok) {
        const provData = await provRes.json()
        setProviders(provData.providers || [])
      }
      if (keysRes.ok) {
        const keysData = await keysRes.json()
        setKeys(keysData.keys || [])
      }
    } catch (err) {
      console.error('Failed to load playground dependencies', err)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Auto-switch provider when category changes
  useEffect(() => {
    const categoryProviders = providers.filter(p => p.category === selectedCategory)
    if (categoryProviders.length > 0) {
      const first = categoryProviders[0]
      setSelectedProviderId(first.id)
      setSelectedAction('search')
      if (selectedCategory === 'donghua') setQueryInput('Soul Land')
      else if (selectedCategory === 'anime') setQueryInput('Frieren')
      else if (selectedCategory === 'movies') setQueryInput('Dune')
    }
  }, [selectedCategory, providers])

  const activeProvider =
    providers.find(p => p.id === selectedProviderId) || providers[0]

  // Matching key for current provider
  const matchingKey = keys.find(k => k.scopedProvider === selectedProviderId)

  const handleExecute = async () => {
    setIsRunning(true)
    setStatus(null)
    setResponsePayload(null)

    const token = useCustomKey ? customKeyInput.trim() : selectedKeyToken

    let endpointUrl = `/api/v1/${selectedCategory}/${selectedProviderId}/${selectedAction}`
    if (selectedAction === 'search') {
      endpointUrl += `?q=${encodeURIComponent(queryInput || 'Soul Land')}`
    } else if (selectedAction === 'episodes') {
      endpointUrl += `?id=${encodeURIComponent(queryInput || 'bili-1001')}`
    } else if (selectedAction === 'stream') {
      endpointUrl += `?episodeId=${encodeURIComponent(queryInput || 'ep-1')}`
    } else if (selectedAction === 'details') {
      endpointUrl += `?id=${encodeURIComponent(queryInput || 'mv-dune-2')}`
    }

    const start = performance.now()
    try {
      const res = await fetch(endpointUrl, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      })
      const elapsed = Math.round(performance.now() - start)
      setLatencyMs(elapsed)
      setStatus(res.status)

      const headersMap: Record<string, string> = {}
      res.headers.forEach((val, k) => {
        if (k.startsWith('x-') || k === 'content-type') headersMap[k] = val
      })
      setResponseHeaders(headersMap)

      const json = await res
        .json()
        .catch(() => ({ error: 'Non-JSON response received' }))
      setResponsePayload(json)
    } catch (err: unknown) {
      setLatencyMs(Math.round(performance.now() - start))
      setStatus(500)
      setResponsePayload({
        error: err instanceof Error ? err.message : 'Network failure',
      })
    } finally {
      setIsRunning(false)
    }
  }

  const getCurlSnippet = () => {
    const token = useCustomKey ? customKeyInput || 'sec_live_...' : selectedKeyToken
    let endpoint = `/api/v1/${selectedCategory}/${selectedProviderId}/${selectedAction}`
    if (selectedAction === 'search')
      endpoint += `?q=${encodeURIComponent(queryInput || 'keyword')}`
    else if (selectedAction === 'episodes')
      endpoint += `?id=${encodeURIComponent(queryInput || 'id')}`
    else if (selectedAction === 'stream')
      endpoint += `?episodeId=${encodeURIComponent(queryInput || 'ep-1')}`
    else if (selectedAction === 'details')
      endpoint += `?id=${encodeURIComponent(queryInput || 'id')}`

    const host =
      typeof window !== 'undefined'
        ? window.location.origin
        : 'https://api.secret.sh'
    return `curl -X GET "${host}${endpoint}" \\\n  -H "Authorization: Bearer ${token}" \\\n  -H "Accept: application/json"`
  }

  const copySnippet = (text: string, type: 'curl' | 'json') => {
    navigator.clipboard.writeText(text)
    if (type === 'curl') {
      setCopiedCurl(true)
      setTimeout(() => setCopiedCurl(false), 2000)
    } else {
      setCopiedJson(true)
      setTimeout(() => setCopiedJson(false), 2000)
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      {/* Category Tabs */}
      <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
        <span className="text-xs font-semibold tracking-wider text-zinc-600 uppercase">
          Category
        </span>

        <div className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-100 p-1">
          {[
            { id: 'donghua', label: 'Donghua' },
            { id: 'anime', label: 'Anime' },
            { id: 'movies', label: 'Movies' },
          ].map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id as typeof selectedCategory)}
              className={`cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                selectedCategory === c.id
                  ? 'bg-white text-zinc-950 shadow-2xs'
                  : 'text-zinc-600 hover:text-zinc-950'
              }`}>
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Provider Selector Grid */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-zinc-700">
          Choose Provider Engine
        </label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {providers
            .filter(p => p.category === selectedCategory)
            .map(p => {
              const isSelected = selectedProviderId === p.id
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelectedProviderId(p.id)
                    setSelectedAction('search')
                  }}
                  className={`cursor-pointer rounded-xl border border-dashed p-4 text-left transition-all ${
                    isSelected
                      ? 'border-zinc-900 bg-zinc-50/80 shadow-2xs'
                      : 'border-zinc-300 bg-white hover:border-zinc-400'
                  }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-900">
                      {p.name}
                    </span>
                    <span className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[10px] text-zinc-500">
                      v{p.version}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-zinc-500">
                    {p.description}
                  </p>
                  <div className="mt-3 flex items-center justify-between font-mono text-[11px] text-zinc-400">
                    <span>{p.endpoints.length} routes</span>
                    <span>{p.creditCost} credit / call</span>
                  </div>
                </button>
              )
            })}
        </div>
      </div>

      {/* Request Form Container */}
      <div className="space-y-5 rounded-2xl border border-dashed border-zinc-300 bg-white p-6 shadow-2xs">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="text-xs font-medium text-zinc-700">
              Endpoint Action
            </label>
            <select
              value={selectedAction}
              onChange={e => setSelectedAction(e.target.value)}
              className="mt-1.5 h-10 w-full rounded-lg border border-dashed border-zinc-300 bg-white px-3 text-xs text-zinc-900 focus:border-zinc-800 focus:outline-none">
              <option value="search">Search Catalog (GET /search)</option>
              {activeProvider?.endpoints.some(e => e.path.endsWith('/episodes')) && (
                <option value="episodes">Episode Listing (GET /episodes)</option>
              )}
              {activeProvider?.endpoints.some(e => e.path.endsWith('/stream')) && (
                <option value="stream">Stream Manifest (GET /stream)</option>
              )}
              {activeProvider?.endpoints.some(e => e.path.endsWith('/recent')) && (
                <option value="recent">Recent Releases (GET /recent)</option>
              )}
              {activeProvider?.endpoints.some(e => e.path.endsWith('/details')) && (
                <option value="details">Details & Cast (GET /details)</option>
              )}
            </select>
          </div>

          <div className="sm:col-span-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-zinc-700">
                {selectedAction === 'search'
                  ? 'Search Query'
                  : selectedAction === 'episodes'
                    ? 'Content ID'
                    : 'Episode / Item ID'}
              </label>
              <span className="text-[11px] text-zinc-400">
                Parameter: ?q= or ?id=
              </span>
            </div>
            <input
              type="text"
              value={queryInput}
              onChange={e => setQueryInput(e.target.value)}
              placeholder="e.g. Soul Land, Frieren, Dune"
              className="mt-1.5 h-10 w-full rounded-lg border border-dashed border-zinc-300 bg-white px-3.5 font-mono text-xs text-zinc-900 focus:border-zinc-800 focus:outline-none"
            />
          </div>
        </div>

        {/* API Key Scoping Selector */}
        <div className="border-t border-zinc-200/80 pt-4">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <label className="text-xs font-medium text-zinc-800">API Key</label>

            <div className="flex items-center gap-2">
              <select
                value={useCustomKey ? 'custom' : selectedKeyToken}
                onChange={e => {
                  if (e.target.value === 'custom') {
                    setUseCustomKey(true)
                  } else {
                    setUseCustomKey(false)
                    setSelectedKeyToken(e.target.value)
                  }
                }}
                className="h-9 rounded-lg border border-dashed border-zinc-300 bg-white px-3 font-mono text-xs text-zinc-800 focus:border-zinc-800 focus:outline-none">
                <option value="sec_live_demo_starter_key_8849">
                  Bilibili Starter Key (sec_live_demo...) [bilibili]
                </option>
                <option value="sec_live_gogoanime_demo_key">
                  GogoAnime Starter Key [gogoanime]
                </option>
                <option value="sec_live_vidsrc_demo_key">
                  VidSrc Movie Stream Key [vidsrc]
                </option>
                {keys.map(k => (
                  <option key={k.id} value={k.keyPrefix}>
                    {k.label} [{k.scopedProvider}]
                  </option>
                ))}
                <option value="custom">+ Input Custom Secret Key</option>
              </select>
            </div>
          </div>

          {useCustomKey && (
            <div className="mt-3">
              <input
                type="text"
                placeholder="sec_live_..."
                value={customKeyInput}
                onChange={e => setCustomKeyInput(e.target.value)}
                className="h-9 w-full rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-3 font-mono text-xs text-zinc-900"
              />
            </div>
          )}

          {matchingKey && (
            <div className="mt-2 text-[11px] text-zinc-500">
              Provider matched:{' '}
              <span className="font-mono font-semibold text-zinc-800">
                {matchingKey.label}
              </span>{' '}
              is active for {selectedProviderId}.
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => copySnippet(getCurlSnippet(), 'curl')}
            className="cursor-pointer text-xs text-zinc-500 transition-colors hover:text-zinc-900">
            {copiedCurl ? '✓ cURL Copied' : 'Copy cURL Command'}
          </button>

          <button
            onClick={handleExecute}
            disabled={isRunning}
            className="flex h-10 cursor-pointer items-center gap-2 rounded-lg bg-zinc-900 px-6 text-xs font-medium text-white shadow-2xs transition-colors hover:bg-zinc-800 disabled:opacity-50">
            {isRunning ? (
              <>
                <span className="size-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                <span>Extracting...</span>
              </>
            ) : (
              <>
                <span>Execute Request</span>
                <svg
                  className="size-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Response Panel */}
      {status !== null && (
        <div className="space-y-4 rounded-2xl border border-dashed border-zinc-300 bg-white p-6 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 pb-3">
            <div className="flex items-center gap-3">
              <span
                className={`rounded px-2 py-0.5 font-mono text-xs font-semibold ${
                  status >= 200 && status < 300
                    ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                    : status === 403
                      ? 'border border-amber-200 bg-amber-50 text-amber-700'
                      : 'border border-rose-200 bg-rose-50 text-rose-700'
                }`}>
                HTTP {status}
              </span>
              <span className="font-mono text-xs text-zinc-500 tabular-nums">
                {latencyMs}ms latency
              </span>
            </div>

            <div className="flex items-center gap-3 font-mono text-xs text-zinc-500">
              {responseHeaders['x-ratelimit-remaining'] && (
                <span>
                  Quota: {responseHeaders['x-ratelimit-remaining']} req left
                </span>
              )}
              {responseHeaders['x-credits-remaining'] && (
                <span>Balance: {responseHeaders['x-credits-remaining']} cr</span>
              )}
              <button
                onClick={() =>
                  copySnippet(JSON.stringify(responsePayload, null, 2), 'json')
                }
                className="cursor-pointer font-sans text-zinc-700 underline underline-offset-2 hover:text-zinc-950">
                {copiedJson ? '✓ Copied' : 'Copy JSON'}
              </button>
            </div>
          </div>

          <pre className="max-h-[380px] overflow-auto rounded-xl bg-zinc-950 p-4 font-mono text-xs leading-relaxed text-zinc-100">
            {JSON.stringify(responsePayload, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
