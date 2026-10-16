import { useEffect, useState } from 'react'

interface ApiKeyItem {
  id: string
  keyPrefix: string
  label: string
  scopedProvider: string
  createdAt: number
  lastUsedAt: number | null
  requestsCount: number
  maxRequests: number
  expiresAt: number
  daysDuration: number
  creditsCharged: number
  status: 'active' | 'revoked' | 'expired'
}

interface ScraperProviderInfo {
  id: string
  name: string
  category: string
}

interface AdminPolicy {
  freeRequests: number
  freeDays: number
  creditsPer100ExtraReq: number
  creditsPer30ExtraDays: number
}

const DEFAULT_POLICY: AdminPolicy = {
  freeRequests: 100,
  freeDays: 7,
  creditsPer100ExtraReq: 5,
  creditsPer30ExtraDays: 10,
}

export const KeysIsland = () => {
  const [keys, setKeys] = useState<ApiKeyItem[]>([])
  const [providers, setProviders] = useState<ScraperProviderInfo[]>([])
  const [credits, setCredits] = useState<number>(350)
  const [policy, setPolicy] = useState<AdminPolicy>(DEFAULT_POLICY)

  // Modals
  const [showModal, setShowModal] = useState(false)
  const [showAdminModal, setShowAdminModal] = useState(false)

  // Key creation state
  const [newLabel, setNewLabel] = useState('')
  const [selectedProvider, setSelectedProvider] = useState('bilibili')
  const [requestedRequests, setRequestedRequests] = useState<number>(100)
  const [requestedDays, setRequestedDays] = useState<number>(7)

  // Admin policy editor state
  const [adminFreeRequests, setAdminFreeRequests] = useState<number>(100)
  const [adminFreeDays, setAdminFreeDays] = useState<number>(7)
  const [adminReqRate, setAdminReqRate] = useState<number>(5)
  const [adminDaysRate, setAdminDaysRate] = useState<number>(10)

  // Reveal secret & feedback
  const [revealedSecret, setRevealedSecret] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState(false)
  const [notification, setNotification] = useState<string | null>(null)

  const loadData = async () => {
    try {
      const [keysRes, provRes, accRes, policyRes] = await Promise.all([
        fetch('/api/v1/keys', { headers: { 'x-user-id': 'dev_default_user' } }),
        fetch('/api/v1/providers'),
        fetch('/api/v1/account', {
          headers: { 'x-user-id': 'dev_default_user' },
        }),
        fetch('/api/v1/admin/policy'),
      ])

      if (keysRes.ok) {
        const data = await keysRes.json()
        setKeys(data.keys || [])
      }
      if (provRes.ok) {
        const data = await provRes.json()
        setProviders(data.providers || [])
      }
      if (accRes.ok) {
        const accData = await accRes.json()
        if (accData.account) setCredits(accData.account.credits ?? 0)
      }
      if (policyRes.ok) {
        const polData = await policyRes.json()
        if (polData.policy) {
          setPolicy(polData.policy)
          setAdminFreeRequests(polData.policy.freeRequests)
          setAdminFreeDays(polData.policy.freeDays)
          setAdminReqRate(polData.policy.creditsPer100ExtraReq)
          setAdminDaysRate(polData.policy.creditsPer30ExtraDays)
        }
      }
    } catch (err) {
      console.error('Failed to load keys', err)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Dynamic credit calculation
  const extraRequests = Math.max(0, requestedRequests - policy.freeRequests)
  const extraDays = Math.max(0, requestedDays - policy.freeDays)
  const reqCreditCost = Math.ceil(
    (extraRequests / 100) * policy.creditsPer100ExtraReq,
  )
  const dayCreditCost = Math.ceil((extraDays / 30) * policy.creditsPer30ExtraDays)
  const totalKeyCreditCost = reqCreditCost + dayCreditCost
  const hasSufficientCredits = credits >= totalKeyCreditCost

  const handleCreate = async () => {
    try {
      const res = await fetch('/api/v1/keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'dev_default_user',
        },
        body: JSON.stringify({
          label: newLabel || `${selectedProvider.toUpperCase()} Key`,
          scopedProvider: selectedProvider,
          requestedRequests,
          requestedDays,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setRevealedSecret(data.apiKey)
        setNewLabel('')
        setShowModal(false)
        setNotification(
          `Key created! ${data.creditsDeducted > 0 ? `${data.creditsDeducted} credits deducted.` : 'Free tier key issued.'}`,
        )
        setTimeout(() => setNotification(null), 3500)
        loadData()
      } else {
        alert(data.error || 'Failed to create key')
      }
    } catch {
      alert('Network error')
    }
  }

  const handleRevoke = async (keyId: string) => {
    if (!confirm('Revoke this API key?')) return
    try {
      const res = await fetch(`/api/v1/keys/${keyId}`, {
        method: 'DELETE',
        headers: { 'x-user-id': 'dev_default_user' },
      })
      if (res.ok) {
        setNotification('API key revoked')
        setTimeout(() => setNotification(null), 3000)
        loadData()
      }
    } catch {
      alert('Revoke failed')
    }
  }

  const handleSavePolicy = async () => {
    try {
      const res = await fetch('/api/v1/admin/policy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          freeRequests: Number(adminFreeRequests),
          freeDays: Number(adminFreeDays),
          creditsPer100ExtraReq: Number(adminReqRate),
          creditsPer30ExtraDays: Number(adminDaysRate),
        }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.policy) setPolicy(data.policy)
        setShowAdminModal(false)
        setNotification('Admin rates updated successfully')
        setTimeout(() => setNotification(null), 3000)
      }
    } catch {
      alert('Failed to update admin policy')
    }
  }

  const handleAddCredits = async (amount: number) => {
    try {
      const res = await fetch('/api/v1/credits/topup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'dev_default_user',
        },
        body: JSON.stringify({ amount }),
      })
      if (res.ok) {
        setNotification(`Added +${amount} credits to balance`)
        setTimeout(() => setNotification(null), 3000)
        loadData()
      }
    } catch {
      alert('Top-up failed')
    }
  }

  const copyKey = (token: string) => {
    navigator.clipboard.writeText(token)
    setCopiedKey(true)
    setTimeout(() => setCopiedKey(false), 2000)
  }

  const formatDaysLeft = (expiresAt: number) => {
    const diffMs = expiresAt - Date.now()
    if (diffMs <= 0) return 'Expired'
    const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
    return `${days}d left`
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      {/* Action Bar */}
      <div className="flex flex-col justify-between gap-3 border-b border-zinc-200 pb-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold tracking-wider text-zinc-600 uppercase">
            API Keys
          </span>
          <span className="rounded-full border border-dashed border-zinc-300 bg-zinc-50 px-2.5 py-0.5 font-mono text-xs text-zinc-700">
            {credits} credits available
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAdminModal(true)}
            className="h-8 cursor-pointer rounded-lg border border-dashed border-zinc-300 bg-white px-3 text-xs font-medium text-zinc-700 shadow-2xs transition-colors hover:border-zinc-400 hover:text-zinc-950">
            Admin Rates
          </button>
          <button
            onClick={() => {
              setRequestedRequests(policy.freeRequests)
              setRequestedDays(policy.freeDays)
              setShowModal(true)
            }}
            className="h-8 cursor-pointer rounded-lg bg-zinc-900 px-3.5 text-xs font-medium whitespace-nowrap text-white shadow-2xs transition-colors hover:bg-zinc-800">
            + Issue Key
          </button>
        </div>
      </div>

      {notification && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs text-emerald-800">
          {notification}
        </div>
      )}

      {/* Secret Reveal Banner */}
      {revealedSecret && (
        <div className="space-y-3 rounded-2xl border border-dashed border-emerald-400 bg-emerald-50/50 p-6 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wider text-emerald-900 uppercase">
              New Key Created — Copy Now
            </span>
            <button
              onClick={() => setRevealedSecret(null)}
              className="cursor-pointer text-xs text-emerald-700 hover:text-emerald-950">
              ✕ Dismiss
            </button>
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 overflow-x-auto rounded-lg border border-emerald-300 bg-white p-2.5 font-mono text-xs text-zinc-900 select-all">
              {revealedSecret}
            </code>
            <button
              onClick={() => copyKey(revealedSecret)}
              className="cursor-pointer rounded-lg bg-emerald-700 px-4 py-2 text-xs font-medium whitespace-nowrap text-white transition-colors hover:bg-emerald-600">
              {copiedKey ? '✓ Copied' : 'Copy'}
            </button>
          </div>
        </div>
      )}

      {/* Keys Table Card */}
      <div className="overflow-hidden rounded-2xl border border-dashed border-zinc-300 bg-white shadow-2xs">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50/80 font-medium text-zinc-500">
              <th className="px-4 py-3">LABEL</th>
              <th className="px-4 py-3">PREFIX</th>
              <th className="px-4 py-3">PROVIDER</th>
              <th className="px-4 py-3">REQUESTS</th>
              <th className="px-4 py-3">VALIDITY</th>
              <th className="px-4 py-3">STATUS</th>
              <th className="px-4 py-3 text-right">ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 text-zinc-800">
            {keys.map(k => {
              const isExpired = Date.now() > k.expiresAt
              const isLimitHit = k.requestsCount >= k.maxRequests
              const displayStatus =
                k.status === 'revoked'
                  ? 'REVOKED'
                  : isExpired
                    ? 'EXPIRED'
                    : isLimitHit
                      ? 'EXHAUSTED'
                      : 'ACTIVE'

              return (
                <tr key={k.id} className="hover:bg-zinc-50/50">
                  <td className="px-4 py-3.5 font-medium text-zinc-950">
                    {k.label}
                  </td>
                  <td className="px-4 py-3.5 font-mono text-zinc-500">
                    {k.keyPrefix}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="rounded border border-zinc-200 bg-zinc-100 px-2 py-0.5 font-mono text-xs text-zinc-800">
                      {k.scopedProvider}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-mono tabular-nums">
                    <span className="font-medium text-zinc-900">
                      {k.requestsCount}
                    </span>
                    <span className="text-zinc-400"> / {k.maxRequests}</span>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-zinc-600 tabular-nums">
                    {formatDaysLeft(k.expiresAt)}
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`text-[11px] font-semibold ${
                        displayStatus === 'ACTIVE'
                          ? 'text-emerald-600'
                          : displayStatus === 'REVOKED'
                            ? 'text-rose-500'
                            : 'text-amber-600'
                      }`}>
                      {displayStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    {k.status === 'active' && !isExpired ? (
                      <button
                        onClick={() => handleRevoke(k.id)}
                        className="cursor-pointer text-rose-600 underline underline-offset-2 hover:text-rose-800">
                        Revoke
                      </button>
                    ) : (
                      <span className="text-zinc-400">—</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Creation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg space-y-4 rounded-2xl border border-dashed border-zinc-300 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="text-sm font-semibold text-zinc-950">Issue API Key</h3>
              <button
                onClick={() => setShowModal(false)}
                className="cursor-pointer text-zinc-400 hover:text-zinc-950">
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-zinc-700">
                  Target Provider
                </label>
                <select
                  value={selectedProvider}
                  onChange={e => setSelectedProvider(e.target.value)}
                  className="mt-1 h-9 w-full rounded-lg border border-dashed border-zinc-300 bg-white px-3 text-xs text-zinc-900 focus:border-zinc-800 focus:outline-none">
                  {providers.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-700">
                  Key Label
                </label>
                <input
                  type="text"
                  placeholder="e.g. Scraper Service"
                  value={newLabel}
                  onChange={e => setNewLabel(e.target.value)}
                  className="mt-1 h-9 w-full rounded-lg border border-dashed border-zinc-300 bg-white px-3 text-xs text-zinc-900 focus:border-zinc-800 focus:outline-none"
                />
              </div>

              {/* Request Limit Selector */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-zinc-700">
                    Request Limit
                  </label>
                  <span className="font-mono text-xs text-zinc-500">
                    {policy.freeRequests} free
                  </span>
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {[100, 500, 1000, 5000, 10000].map(cnt => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setRequestedRequests(cnt)}
                      className={`cursor-pointer rounded-md border px-2.5 py-1 font-mono text-xs transition-colors ${
                        requestedRequests === cnt
                          ? 'border-zinc-900 bg-zinc-900 text-white'
                          : 'border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400'
                      }`}>
                      {cnt.toLocaleString()} req
                    </button>
                  ))}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-[11px] text-zinc-500">Custom:</span>
                  <input
                    type="number"
                    min={10}
                    max={100000}
                    value={requestedRequests}
                    onChange={e =>
                      setRequestedRequests(Math.max(10, Number(e.target.value)))
                    }
                    className="h-8 w-28 rounded-md border border-dashed border-zinc-300 px-2 font-mono text-xs text-zinc-900 focus:border-zinc-800 focus:outline-none"
                  />
                  <span className="text-[11px] text-zinc-400">requests</span>
                </div>
              </div>

              {/* Validity Days Selector */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-zinc-700">
                    Validity Duration
                  </label>
                  <span className="font-mono text-xs text-zinc-500">
                    {policy.freeDays} days free
                  </span>
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {[7, 14, 30, 90, 365].map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setRequestedDays(d)}
                      className={`cursor-pointer rounded-md border px-2.5 py-1 font-mono text-xs transition-colors ${
                        requestedDays === d
                          ? 'border-zinc-900 bg-zinc-900 text-white'
                          : 'border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400'
                      }`}>
                      {d} days
                    </button>
                  ))}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-[11px] text-zinc-500">Custom:</span>
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={requestedDays}
                    onChange={e =>
                      setRequestedDays(Math.max(1, Number(e.target.value)))
                    }
                    className="h-8 w-28 rounded-md border border-dashed border-zinc-300 px-2 font-mono text-xs text-zinc-900 focus:border-zinc-800 focus:outline-none"
                  />
                  <span className="text-[11px] text-zinc-400">days</span>
                </div>
              </div>

              {/* Dynamic Cost Calculator Card */}
              <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50/70 p-3.5 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-600">Calculated Cost:</span>
                  <span
                    className={`font-semibold ${
                      totalKeyCreditCost === 0 ? 'text-emerald-700' : 'text-zinc-900'
                    }`}>
                    {totalKeyCreditCost === 0
                      ? '0 credits (Free Tier)'
                      : `${totalKeyCreditCost} credits`}
                  </span>
                </div>
                {totalKeyCreditCost > 0 && (
                  <div className="mt-2 space-y-1 border-t border-zinc-200/60 pt-2 text-[11px] text-zinc-500">
                    <div className="flex justify-between">
                      <span>Requests over free allowance:</span>
                      <span>
                        +{reqCreditCost} cr ({extraRequests} req)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Days over free duration:</span>
                      <span>
                        +{dayCreditCost} cr ({extraDays} days)
                      </span>
                    </div>
                  </div>
                )}
                <div className="mt-2 flex justify-between border-t border-zinc-200/60 pt-2 text-[11px] text-zinc-600">
                  <span>Balance after issuance:</span>
                  <span
                    className={
                      hasSufficientCredits
                        ? 'text-zinc-900'
                        : 'font-semibold text-rose-600'
                    }>
                    {credits - totalKeyCreditCost} credits
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-zinc-100 pt-3">
              <button
                onClick={() => setShowModal(false)}
                className="cursor-pointer px-3.5 py-1.5 text-xs text-zinc-500 hover:text-zinc-900">
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!hasSufficientCredits}
                className={`cursor-pointer rounded-lg px-4 py-2 text-xs font-medium transition-colors ${
                  hasSufficientCredits
                    ? 'bg-zinc-900 text-white shadow-2xs hover:bg-zinc-800'
                    : 'cursor-not-allowed bg-zinc-200 text-zinc-400'
                }`}>
                {hasSufficientCredits
                  ? totalKeyCreditCost === 0
                    ? 'Create Free Key'
                    : `Create Key (${totalKeyCreditCost} credits)`
                  : 'Insufficient Credits'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Policy Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md space-y-4 rounded-2xl border border-dashed border-zinc-300 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="text-sm font-semibold text-zinc-950">
                Admin Policy & Free Allowances
              </h3>
              <button
                onClick={() => setShowAdminModal(false)}
                className="cursor-pointer text-zinc-400 hover:text-zinc-950">
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-zinc-700">
                  Free Request Limit per Key
                </label>
                <input
                  type="number"
                  min={1}
                  value={adminFreeRequests}
                  onChange={e => setAdminFreeRequests(Number(e.target.value))}
                  className="mt-1 h-9 w-full rounded-lg border border-dashed border-zinc-300 px-3 font-mono text-xs text-zinc-900 focus:border-zinc-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-700">
                  Free Duration (Days) per Key
                </label>
                <input
                  type="number"
                  min={1}
                  value={adminFreeDays}
                  onChange={e => setAdminFreeDays(Number(e.target.value))}
                  className="mt-1 h-9 w-full rounded-lg border border-dashed border-zinc-300 px-3 font-mono text-xs text-zinc-900 focus:border-zinc-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-700">
                  Credit Cost per 100 Extra Requests
                </label>
                <input
                  type="number"
                  min={1}
                  value={adminReqRate}
                  onChange={e => setAdminReqRate(Number(e.target.value))}
                  className="mt-1 h-9 w-full rounded-lg border border-dashed border-zinc-300 px-3 font-mono text-xs text-zinc-900 focus:border-zinc-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-700">
                  Credit Cost per 30 Extra Days
                </label>
                <input
                  type="number"
                  min={1}
                  value={adminDaysRate}
                  onChange={e => setAdminDaysRate(Number(e.target.value))}
                  className="mt-1 h-9 w-full rounded-lg border border-dashed border-zinc-300 px-3 font-mono text-xs text-zinc-900 focus:border-zinc-800 focus:outline-none"
                />
              </div>

              {/* Developer Test Tools */}
              <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 p-3">
                <span className="text-[11px] font-semibold text-zinc-600">
                  Testing Tool
                </span>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleAddCredits(100)}
                    className="cursor-pointer rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white shadow-2xs hover:bg-zinc-800">
                    +100 Credits to Balance
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddCredits(500)}
                    className="cursor-pointer rounded-md border border-dashed border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:border-zinc-400">
                    +500 Credits
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-zinc-100 pt-3">
              <button
                onClick={() => setShowAdminModal(false)}
                className="cursor-pointer px-3.5 py-1.5 text-xs text-zinc-500 hover:text-zinc-900">
                Close
              </button>
              <button
                onClick={handleSavePolicy}
                className="cursor-pointer rounded-lg bg-zinc-900 px-4 py-2 text-xs font-medium text-white shadow-2xs transition-colors hover:bg-zinc-800">
                Save Rates
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
