import crypto from 'node:crypto'

export type PlanTier = 'free' | 'pro' | 'enterprise'

export interface DeveloperAccount {
  id: string
  email: string
  name: string
  tier: PlanTier
  credits: number
  createdAt: number
}

export interface AdminPolicy {
  freeRequests: number
  freeDays: number
  creditsPer100ExtraReq: number
  creditsPer30ExtraDays: number
}

export const DEFAULT_ADMIN_POLICY: AdminPolicy = {
  freeRequests: 100,
  freeDays: 7,
  creditsPer100ExtraReq: 5,
  creditsPer30ExtraDays: 10,
}

export const calculateKeyCost = (
  requests: number,
  days: number,
  policy: AdminPolicy = DEFAULT_ADMIN_POLICY,
): {
  totalCredits: number
  extraRequests: number
  extraDays: number
  reqCreditCost: number
  dayCreditCost: number
} => {
  const extraRequests = Math.max(0, requests - policy.freeRequests)
  const extraDays = Math.max(0, days - policy.freeDays)

  const reqCreditCost = Math.ceil(
    (extraRequests / 100) * policy.creditsPer100ExtraReq,
  )
  const dayCreditCost = Math.ceil((extraDays / 30) * policy.creditsPer30ExtraDays)

  return {
    totalCredits: reqCreditCost + dayCreditCost,
    extraRequests,
    extraDays,
    reqCreditCost,
    dayCreditCost,
  }
}

export interface ApiKeyRecord {
  id: string
  userId: string
  keyPrefix: string
  keyHash: string
  label: string
  scopedProvider: string // Strict single-provider binding
  createdAt: number
  lastUsedAt: number | null
  requestsCount: number
  maxRequests: number
  expiresAt: number
  daysDuration: number
  creditsCharged: number
  status: 'active' | 'revoked' | 'expired'
}

export interface UsageLog {
  id: string
  keyId: string
  userId: string
  category: string
  provider: string
  endpoint: string
  statusCode: number
  creditsCharged: number
  durationMs: number
  timestamp: number
}

export interface TierConfig {
  name: string
  dailyLimit: number
  minuteLimit: number
  priceMonthly: string
  features: string[]
}

export const TIER_CONFIGS: Record<PlanTier, TierConfig> = {
  free: {
    name: 'Free Developer',
    dailyLimit: 100,
    minuteLimit: 5,
    priceMonthly: '$0 / mo',
    features: [
      '100 requests/day',
      '5 req/min rate limit',
      'Scoped Provider Access',
      'Standard latency',
    ],
  },
  pro: {
    name: 'Pro Aggregator',
    dailyLimit: 5000,
    minuteLimit: 30,
    priceMonthly: '$29 / mo',
    features: [
      '5,000 requests/day',
      '30 req/min rate limit',
      'Multi-Key Provisioning',
      'Priority CDN proxy',
      '500 bonus credits',
    ],
  },
  enterprise: {
    name: 'Enterprise Scale',
    dailyLimit: 50000,
    minuteLimit: 120,
    priceMonthly: '$199 / mo',
    features: [
      '50,000 requests/day',
      '120 req/min limit',
      'Dedicated worker pools',
      'Direct stream resolvers',
      'Pay-per-request buffer',
    ],
  },
}

// In-memory persistent gateway store
class ApiGatewayStore {
  private accounts = new Map<string, DeveloperAccount>()
  private apiKeys = new Map<string, ApiKeyRecord>()
  private keyHashToId = new Map<string, string>()
  private usageLogs: UsageLog[] = []
  private dailyCounts = new Map<string, number>()
  private adminPolicy: AdminPolicy = { ...DEFAULT_ADMIN_POLICY }

  constructor() {
    this.seedDefaultDeveloper()
  }

  private seedDefaultDeveloper() {
    const defaultUser: DeveloperAccount = {
      id: 'dev_default_user',
      email: 'developer@secret.local',
      name: 'Default Workspace',
      tier: 'pro',
      credits: 350,
      createdAt: Date.now() - 86400000 * 7,
    }
    this.accounts.set(defaultUser.id, defaultUser)

    // Starter Keys scoped strictly to individual providers
    const starterKeys = [
      {
        token: 'sec_live_demo_starter_key_8849',
        provider: 'bilibili',
        label: 'Bilibili Donghua Key',
        maxRequests: 1000,
        days: 30,
      },
      {
        token: 'sec_live_gogoanime_demo_key',
        provider: 'gogoanime',
        label: 'GogoAnime Scraper Key',
        maxRequests: 500,
        days: 14,
      },
      {
        token: 'sec_live_vidsrc_demo_key',
        provider: 'vidsrc',
        label: 'VidSrc Movie Stream Key',
        maxRequests: 200,
        days: 7,
      },
    ]

    starterKeys.forEach((s, idx) => {
      const hash = this.hashKey(s.token)
      const keyId = `key_demo_${idx + 1}`
      const record: ApiKeyRecord = {
        id: keyId,
        userId: defaultUser.id,
        keyPrefix: `${s.token.slice(0, 12)}...`,
        keyHash: hash,
        label: s.label,
        scopedProvider: s.provider,
        createdAt: Date.now() - 86400000 * (3 - idx),
        lastUsedAt: Date.now() - 3600000 * (idx + 1),
        requestsCount: 20 * (idx + 1),
        maxRequests: s.maxRequests,
        expiresAt: Date.now() + 86400000 * s.days,
        daysDuration: s.days,
        creditsCharged: 0,
        status: 'active',
      }
      this.apiKeys.set(keyId, record)
      this.keyHashToId.set(hash, keyId)
    })

    const now = Date.now()
    this.usageLogs.push(
      {
        id: 'log-1',
        keyId: 'key_demo_1',
        userId: defaultUser.id,
        category: 'donghua',
        provider: 'bilibili',
        endpoint: '/api/v1/donghua/bilibili/search',
        statusCode: 200,
        creditsCharged: 1,
        durationMs: 78,
        timestamp: now - 3600000 * 4,
      },
      {
        id: 'log-2',
        keyId: 'key_demo_2',
        userId: defaultUser.id,
        category: 'anime',
        provider: 'gogoanime',
        endpoint: '/api/v1/anime/gogoanime/search',
        statusCode: 200,
        creditsCharged: 1,
        durationMs: 112,
        timestamp: now - 3600000 * 2,
      },
      {
        id: 'log-3',
        keyId: 'key_demo_3',
        userId: defaultUser.id,
        category: 'movies',
        provider: 'vidsrc',
        endpoint: '/api/v1/movies/vidsrc/stream',
        statusCode: 200,
        creditsCharged: 2,
        durationMs: 145,
        timestamp: now - 1800000,
      },
    )
  }

  public getAdminPolicy(): AdminPolicy {
    return { ...this.adminPolicy }
  }

  public updateAdminPolicy(policy: Partial<AdminPolicy>): AdminPolicy {
    this.adminPolicy = {
      ...this.adminPolicy,
      ...policy,
    }
    return { ...this.adminPolicy }
  }

  public hashKey(token: string): string {
    return crypto.createHash('sha256').update(token.trim()).digest('hex')
  }

  public getOrCreateDeveloper(email?: string): DeveloperAccount {
    const targetEmail = (email || 'developer@secret.local').toLowerCase().trim()
    for (const acc of this.accounts.values()) {
      if (acc.email === targetEmail) return acc
    }
    const id = `dev_${crypto.randomBytes(6).toString('hex')}`
    const account: DeveloperAccount = {
      id,
      email: targetEmail,
      name: targetEmail.split('@')[0],
      tier: 'free',
      credits: 50,
      createdAt: Date.now(),
    }
    this.accounts.set(id, account)
    return account
  }

  public getAccount(id: string): DeveloperAccount | undefined {
    return this.accounts.get(id)
  }

  public updateTier(userId: string, tier: PlanTier): DeveloperAccount | null {
    const acc = this.accounts.get(userId)
    if (!acc) return null
    acc.tier = tier
    if (tier === 'pro') acc.credits += 200
    if (tier === 'enterprise') acc.credits += 1000
    return acc
  }

  public addCredits(userId: string, amount: number): DeveloperAccount | null {
    const acc = this.accounts.get(userId)
    if (!acc) return null
    acc.credits = Math.max(0, acc.credits + amount)
    return acc
  }

  public createApiKey(
    userId: string,
    label: string,
    scopedProvider = 'bilibili',
    requestedRequests = 100,
    requestedDays = 7,
  ): { key: ApiKeyRecord; secret: string; creditsDeducted: number } {
    const acc = this.accounts.get(userId)
    if (!acc) throw new Error('Developer account not found')

    const cleanRequests = Math.max(10, Math.min(100000, requestedRequests))
    const cleanDays = Math.max(1, Math.min(365, requestedDays))

    const costBreakdown = calculateKeyCost(
      cleanRequests,
      cleanDays,
      this.adminPolicy,
    )
    if (acc.credits < costBreakdown.totalCredits) {
      throw new Error(
        `Insufficient credits. Required: ${costBreakdown.totalCredits} credits for ${cleanRequests} requests / ${cleanDays} days, but you only have ${acc.credits} credits. Top up or reduce quota.`,
      )
    }

    acc.credits -= costBreakdown.totalCredits

    const rawSecret = `sec_live_${crypto.randomBytes(18).toString('hex')}`
    const keyHash = this.hashKey(rawSecret)
    const keyId = `key_${crypto.randomBytes(8).toString('hex')}`
    const keyPrefix = `${rawSecret.slice(0, 12)}...`
    const now = Date.now()

    const record: ApiKeyRecord = {
      id: keyId,
      userId,
      keyPrefix,
      keyHash,
      label: label.trim() || `${scopedProvider.toUpperCase()} Key`,
      scopedProvider: scopedProvider.toLowerCase().trim(),
      createdAt: now,
      lastUsedAt: null,
      requestsCount: 0,
      maxRequests: cleanRequests,
      expiresAt: now + cleanDays * 86400000,
      daysDuration: cleanDays,
      creditsCharged: costBreakdown.totalCredits,
      status: 'active',
    }

    this.apiKeys.set(keyId, record)
    this.keyHashToId.set(keyHash, keyId)

    return {
      key: record,
      secret: rawSecret,
      creditsDeducted: costBreakdown.totalCredits,
    }
  }

  public listApiKeys(userId: string): ApiKeyRecord[] {
    return Array.from(this.apiKeys.values())
      .filter(k => k.userId === userId && k.status !== 'revoked')
      .map(k => {
        if (k.status === 'active' && Date.now() > k.expiresAt) {
          k.status = 'expired'
        }
        return k
      })
      .sort((a, b) => b.createdAt - a.createdAt)
  }

  public revokeApiKey(userId: string, keyId: string): boolean {
    const key = this.apiKeys.get(keyId)
    if (!key || key.userId !== userId) return false
    key.status = 'revoked'
    this.keyHashToId.delete(key.keyHash)
    return true
  }

  public validateToken(
    rawToken: string,
    targetProvider?: string,
  ): {
    valid: boolean
    key?: ApiKeyRecord
    account?: DeveloperAccount
    error?: string
  } {
    if (!rawToken) {
      return {
        valid: false,
        error: 'Missing API key. Provide Bearer sec_live_... or x-api-key header.',
      }
    }
    const cleanToken = rawToken.replace(/^Bearer\s+/i, '').trim()
    const hash = this.hashKey(cleanToken)
    const keyId = this.keyHashToId.get(hash)
    if (!keyId) {
      return { valid: false, error: 'Invalid or revoked API key.' }
    }
    const key = this.apiKeys.get(keyId)
    if (!key || key.status === 'revoked') {
      return { valid: false, error: 'API key has been revoked.' }
    }
    if (Date.now() > key.expiresAt || key.status === 'expired') {
      key.status = 'expired'
      return {
        valid: false,
        error: `API key has expired. Validity duration was ${key.daysDuration} days.`,
      }
    }
    if (key.requestsCount >= key.maxRequests) {
      return {
        valid: false,
        error: `API key request limit reached (${key.requestsCount}/${key.maxRequests} requests). Issue a new key with more requests.`,
      }
    }
    const account = this.accounts.get(key.userId)
    if (!account) {
      return { valid: false, error: 'Associated developer account not found.' }
    }

    // Strict provider scoping enforcement
    if (
      targetProvider &&
      key.scopedProvider &&
      key.scopedProvider !== targetProvider.toLowerCase().trim()
    ) {
      return {
        valid: false,
        error: `Access Denied: This API key is strictly scoped to provider '${key.scopedProvider}'. It cannot be used to query provider '${targetProvider}'. Please use an API key issued for '${targetProvider}'.`,
      }
    }

    return { valid: true, key, account }
  }

  public checkAndDeductQuota(
    key: ApiKeyRecord,
    account: DeveloperAccount,
    creditCost = 1,
  ): {
    allowed: boolean
    remainingToday: number
    creditsRemaining: number
    dailyLimit: number
    error?: string
  } {
    // 1. Expiration check
    if (Date.now() > key.expiresAt) {
      key.status = 'expired'
      return {
        allowed: false,
        remainingToday: 0,
        creditsRemaining: account.credits,
        dailyLimit: 0,
        error: `API Key expired on ${new Date(key.expiresAt).toLocaleDateString()}.`,
      }
    }

    // 2. Request limit check
    if (key.requestsCount >= key.maxRequests) {
      return {
        allowed: false,
        remainingToday: 0,
        creditsRemaining: account.credits,
        dailyLimit: 0,
        error: `Key request quota of ${key.maxRequests} has been exhausted (${key.requestsCount}/${key.maxRequests}).`,
      }
    }

    const today = new Date().toISOString().slice(0, 10)
    const quotaKey = `${account.id}:${today}`
    const currentUsedToday = this.dailyCounts.get(quotaKey) || 0
    const config = TIER_CONFIGS[account.tier]
    const remainingToday = Math.max(0, config.dailyLimit - currentUsedToday)

    // Primary Tier Quota Check
    if (remainingToday > 0) {
      this.dailyCounts.set(quotaKey, currentUsedToday + 1)
      key.requestsCount += 1
      key.lastUsedAt = Date.now()
      return {
        allowed: true,
        remainingToday: remainingToday - 1,
        creditsRemaining: account.credits,
        dailyLimit: config.dailyLimit,
      }
    }

    // Pay-per-request overflow from Credits
    if (account.credits >= creditCost) {
      account.credits -= creditCost
      this.dailyCounts.set(quotaKey, currentUsedToday + 1)
      key.requestsCount += 1
      key.lastUsedAt = Date.now()
      return {
        allowed: true,
        remainingToday: 0,
        creditsRemaining: account.credits,
        dailyLimit: config.dailyLimit,
      }
    }

    return {
      allowed: false,
      remainingToday: 0,
      creditsRemaining: account.credits,
      dailyLimit: config.dailyLimit,
      error: `Daily limit of ${config.dailyLimit} requests reached for ${config.name}. Top up credits for pay-per-request overflow or upgrade your tier.`,
    }
  }

  public recordUsage(
    key: ApiKeyRecord,
    account: DeveloperAccount,
    category: string,
    provider: string,
    endpoint: string,
    statusCode: number,
    creditsCharged: number,
    durationMs: number,
  ) {
    const log: UsageLog = {
      id: `log_${crypto.randomBytes(6).toString('hex')}`,
      keyId: key.id,
      userId: account.id,
      category,
      provider,
      endpoint,
      statusCode,
      creditsCharged,
      durationMs,
      timestamp: Date.now(),
    }
    this.usageLogs.unshift(log)
    if (this.usageLogs.length > 200) this.usageLogs.pop()
  }

  public getUsageOverview(userId: string) {
    const account = this.accounts.get(userId)
    const today = new Date().toISOString().slice(0, 10)
    const usedToday = this.dailyCounts.get(`${userId}:${today}`) || 0
    const userLogs = this.usageLogs.filter(l => l.userId === userId)
    const tierConfig = account ? TIER_CONFIGS[account.tier] : TIER_CONFIGS.free

    return {
      account,
      tierConfig,
      adminPolicy: this.getAdminPolicy(),
      usedToday,
      remainingToday: Math.max(0, (tierConfig?.dailyLimit || 100) - usedToday),
      credits: account?.credits || 0,
      recentLogs: userLogs.slice(0, 20),
      totalRequests: userLogs.length,
    }
  }
}

// Global Singleton in runtime
export const apiGateway = new ApiGatewayStore()
