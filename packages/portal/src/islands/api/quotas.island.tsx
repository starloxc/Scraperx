import { useEffect, useState } from 'react'

interface DeveloperAccount {
  id: string
  email: string
  name: string
  tier: 'free' | 'pro' | 'enterprise'
  credits: number
}

interface UsageLog {
  id: string
  category: string
  provider: string
  endpoint: string
  statusCode: number
  creditsCharged: number
  durationMs: number
  timestamp: number
}

export const QuotasIsland = () => {
  const [account, setAccount] = useState<DeveloperAccount | null>(null)
  const [usedToday, setUsedToday] = useState(0)
  const [remainingToday, setRemainingToday] = useState(100)
  const [usageLogs, setUsageLogs] = useState<UsageLog[]>([])
  const [notification, setNotification] = useState<string | null>(null)

  const loadData = async () => {
    try {
      const res = await fetch('/api/v1/usage', {
        headers: { 'x-user-id': 'dev_default_user' },
      })
      if (res.ok) {
        const data = await res.json()
        setAccount(data.account)
        setUsedToday(data.usedToday || 0)
        setRemainingToday(data.remainingToday || 100)
        setUsageLogs(data.recentLogs || [])
      }
    } catch (err) {
      console.error('Failed to load usage data', err)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSwitchTier = async (tier: 'free' | 'pro' | 'enterprise') => {
    try {
      const res = await fetch('/api/v1/tier', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'dev_default_user',
        },
        body: JSON.stringify({ tier }),
      })
      if (res.ok) {
        setNotification(`Switched to ${tier.toUpperCase()} tier!`)
        setTimeout(() => setNotification(null), 3000)
        loadData()
      }
    } catch {
      alert('Failed to switch tier')
    }
  }

  const handleTopup = async (amount: number) => {
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
        setNotification(`Added +${amount} credits to your metered balance!`)
        setTimeout(() => setNotification(null), 3000)
        loadData()
      }
    } catch {
      alert('Top-up failed')
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8">
      {/* Title */}
      <div className="flex flex-col justify-between gap-3 border-b border-zinc-200 pb-3 sm:flex-row sm:items-center">
        <span className="text-xs font-semibold tracking-wider text-zinc-600 uppercase">
          Tiers & Quotas
        </span>

        {/* Current Active Plan Badge */}
        <div className="flex items-center gap-2">
          <div className="rounded-lg border border-dashed border-zinc-300 bg-white px-3 py-1 font-mono text-xs">
            <span className="text-zinc-500">Plan: </span>
            <span className="font-semibold text-zinc-950 uppercase">
              {account?.tier || 'Pro'}
            </span>
          </div>
          <div className="rounded-lg border border-dashed border-zinc-300 bg-white px-3 py-1 font-mono text-xs tabular-nums">
            <span className="text-zinc-500">Credits: </span>
            <span className="font-semibold text-emerald-700">
              {account?.credits ?? 250}
            </span>
          </div>
        </div>
      </div>

      {notification && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
          {notification}
        </div>
      )}

      {/* Quota Progress Banner */}
      <div className="space-y-3 rounded-2xl border border-dashed border-zinc-300 bg-white p-6 shadow-2xs">
        <div className="flex items-center justify-between text-xs font-medium">
          <span className="text-zinc-700">Today's Request Consumption</span>
          <span className="font-mono text-zinc-900 tabular-nums">
            {usedToday} / {usedToday + remainingToday} calls used
          </span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-100">
          <div
            className="h-full rounded-full bg-zinc-900 transition-all duration-300"
            style={{
              width: `${Math.min(100, (usedToday / Math.max(1, usedToday + remainingToday)) * 100)}%`,
            }}
          />
        </div>
        <div className="flex items-center justify-between font-mono text-[11px] text-zinc-500">
          <span>Resets every 24 hours at 00:00 UTC</span>
          <span>{remainingToday} requests remaining today</span>
        </div>
      </div>

      {/* Tiers Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            id: 'free',
            name: 'Free Developer',
            price: '$0',
            daily: '100 req / day',
            rate: '5 req / min',
            bonus: '50 credits',
            desc: 'For local testing and individual scraper prototyping.',
          },
          {
            id: 'pro',
            name: 'Pro Aggregator',
            price: '$29',
            daily: '5,000 req / day',
            rate: '30 req / min',
            bonus: '500 credits',
            desc: 'For media bots, community mirrors, and high-frequency crawlers.',
            recommended: true,
          },
          {
            id: 'enterprise',
            name: 'Enterprise Scale',
            price: '$199',
            daily: '50,000 req / day',
            rate: '120 req / min',
            bonus: '5,000 credits',
            desc: 'For production streaming portals and high-scale indexing.',
          },
        ].map(t => {
          const isCurrent = account?.tier === t.id
          return (
            <div
              key={t.id}
              className={`flex flex-col justify-between rounded-2xl border border-dashed p-6 transition-all ${
                isCurrent
                  ? 'border-zinc-900 bg-zinc-50/80 shadow-2xs'
                  : 'border-zinc-300 bg-white hover:border-zinc-400'
              }`}>
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold tracking-wider text-zinc-900 uppercase">
                    {t.name}
                  </span>
                  {isCurrent && (
                    <span className="rounded bg-zinc-900 px-2 py-0.5 font-mono text-[10px] text-white">
                      ACTIVE
                    </span>
                  )}
                </div>
                <div className="mt-3 font-mono text-2xl font-bold text-zinc-950">
                  {t.price}{' '}
                  <span className="text-xs font-normal text-zinc-500">/ mo</span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-zinc-500">
                  {t.desc}
                </p>

                <div className="mt-5 space-y-2 border-t border-zinc-200 pt-3 font-mono text-xs text-zinc-600">
                  <div className="flex justify-between">
                    <span>Daily Limit:</span>
                    <span className="font-semibold text-zinc-900">{t.daily}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Speed Cap:</span>
                    <span>{t.rate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Credit Pool:</span>
                    <span className="text-emerald-700">{t.bonus}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() =>
                  handleSwitchTier(t.id as 'free' | 'pro' | 'enterprise')
                }
                disabled={isCurrent}
                className={`mt-6 w-full cursor-pointer rounded-lg py-2 text-xs font-medium transition-colors ${
                  isCurrent
                    ? 'cursor-not-allowed bg-zinc-200 text-zinc-500'
                    : 'bg-zinc-900 text-white shadow-2xs hover:bg-zinc-800'
                }`}>
                {isCurrent ? 'Current Plan' : `Activate ${t.name}`}
              </button>
            </div>
          )
        })}
      </div>

      {/* Pay-Per-Request Metered Buffer */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-dashed border-zinc-300 bg-white p-5 shadow-2xs sm:flex-row sm:items-center">
        <div>
          <h3 className="text-xs font-semibold tracking-wider text-zinc-900 uppercase">
            Credit Wallet
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleTopup(50)}
            className="cursor-pointer rounded-lg border border-dashed border-zinc-300 bg-white px-3.5 py-2 text-xs font-medium text-zinc-900 transition-colors hover:border-zinc-500">
            +50 Credits
          </button>
          <button
            onClick={() => handleTopup(200)}
            className="cursor-pointer rounded-lg bg-zinc-900 px-3.5 py-2 text-xs font-medium text-white shadow-2xs transition-colors hover:bg-zinc-800">
            +200 Credits
          </button>
        </div>
      </div>

      {/* Recent Telemetry Logs */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-zinc-900">
          Recent Request Telemetry
        </h3>
        <div className="overflow-hidden rounded-2xl border border-dashed border-zinc-300 bg-white shadow-2xs">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50/80 font-medium text-zinc-500">
                <th className="px-4 py-3">TIME</th>
                <th className="px-4 py-3">ENDPOINT</th>
                <th className="px-4 py-3">PROVIDER</th>
                <th className="px-4 py-3">STATUS</th>
                <th className="px-4 py-3">LATENCY</th>
                <th className="px-4 py-3 text-right">COST</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-zinc-800">
              {usageLogs.map(log => (
                <tr key={log.id} className="hover:bg-zinc-50/50">
                  <td className="px-4 py-3 text-zinc-500 tabular-nums">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="px-4 py-3 font-sans font-medium text-zinc-900">
                    {log.endpoint}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">{log.provider}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                        log.statusCode === 200
                          ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'border border-amber-200 bg-amber-50 text-amber-700'
                      }`}>
                      {log.statusCode}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-500 tabular-nums">
                    {log.durationMs}ms
                  </td>
                  <td className="px-4 py-3 text-right text-emerald-700 tabular-nums">
                    {log.creditsCharged} cr
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
