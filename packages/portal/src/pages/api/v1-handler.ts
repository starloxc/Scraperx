import {
  ALL_SCRAPER_PROVIDERS,
  CATEGORY_METADATA,
  getProviderById,
} from '../../scrapers'
import { apiGateway, TIER_CONFIGS, type PlanTier } from '../../services/api-gateway'

interface HandlerContext {
  request: Request
  url: URL
  pathname: string
  method: string
}

const jsonResponse = (
  data: unknown,
  status = 200,
  headers: Record<string, string> = {},
) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers':
        'Content-Type, Authorization, x-api-key, x-user-id',
      ...headers,
    },
  })
}

export async function handleV1Route({
  request,
  url,
  pathname,
  method,
}: HandlerContext): Promise<Response | null> {
  // Only process v1/* routes
  if (!pathname.startsWith('v1/') && pathname !== 'v1') {
    return null
  }

  const subpath = pathname.replace(/^v1\/?/, '')

  // 1. GET /api/v1/providers - Public scraper directory & schemas
  if (subpath === 'providers' && method === 'GET') {
    return jsonResponse({
      success: true,
      count: ALL_SCRAPER_PROVIDERS.length,
      categories: CATEGORY_METADATA,
      providers: ALL_SCRAPER_PROVIDERS.map(p => ({
        id: p.id,
        name: p.name,
        category: p.category,
        version: p.version,
        website: p.website,
        description: p.description,
        creditCost: p.creditCost,
        endpoints: p.endpoints,
      })),
    })
  }

  // 2. Developer Auth / Profile: POST /api/v1/auth/developer
  if (subpath === 'auth/developer' && method === 'POST') {
    try {
      const body = (await request.json().catch(() => ({}))) as { email?: string }
      const account = apiGateway.getOrCreateDeveloper(body.email)
      const keys = apiGateway.listApiKeys(account.id)
      return jsonResponse({
        success: true,
        account,
        tierConfig: TIER_CONFIGS[account.tier],
        activeKeysCount: keys.length,
      })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Auth error'
      return jsonResponse({ error: message }, 500)
    }
  }

  // Helper to extract user ID from header or default
  const getUserId = () => {
    return request.headers.get('x-user-id') || 'dev_default_user'
  }

  // 3. GET /api/v1/account
  if (subpath === 'account' && method === 'GET') {
    const userId = getUserId()
    const account =
      apiGateway.getAccount(userId) || apiGateway.getOrCreateDeveloper()
    return jsonResponse({
      success: true,
      account,
      tierConfig: TIER_CONFIGS[account.tier],
    })
  }

  // 4. API Keys Management: GET /api/v1/keys & POST /api/v1/keys
  if (subpath === 'keys') {
    const userId = getUserId()
    if (method === 'GET') {
      const keys = apiGateway.listApiKeys(userId)
      return jsonResponse({
        success: true,
        keys: keys.map(k => ({
          id: k.id,
          keyPrefix: k.keyPrefix,
          label: k.label,
          scopedProvider: k.scopedProvider,
          createdAt: k.createdAt,
          lastUsedAt: k.lastUsedAt,
          requestsCount: k.requestsCount,
          maxRequests: k.maxRequests,
          expiresAt: k.expiresAt,
          daysDuration: k.daysDuration,
          creditsCharged: k.creditsCharged,
          status: k.status,
        })),
      })
    }

    if (method === 'POST') {
      const body = (await request.json().catch(() => ({}))) as {
        label?: string
        scopedProvider?: string
        requestedRequests?: number
        requestedDays?: number
      }
      try {
        const { key, secret, creditsDeducted } = apiGateway.createApiKey(
          userId,
          body.label || 'API Key',
          body.scopedProvider || 'bilibili',
          body.requestedRequests || 100,
          body.requestedDays || 7,
        )
        return jsonResponse(
          {
            success: true,
            message:
              'API Key created successfully. Store this secret safely; it will not be shown again.',
            apiKey: secret,
            creditsDeducted,
            keyRecord: {
              id: key.id,
              keyPrefix: key.keyPrefix,
              label: key.label,
              scopedProvider: key.scopedProvider,
              createdAt: key.createdAt,
              requestsCount: key.requestsCount,
              maxRequests: key.maxRequests,
              expiresAt: key.expiresAt,
              daysDuration: key.daysDuration,
              creditsCharged: key.creditsCharged,
              status: key.status,
            },
          },
          201,
        )
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to create key'
        return jsonResponse({ error: message }, 400)
      }
    }
  }

  // Admin Policy Management: GET /api/v1/admin/policy & POST /api/v1/admin/policy
  if (subpath === 'admin/policy') {
    if (method === 'GET') {
      return jsonResponse({
        success: true,
        policy: apiGateway.getAdminPolicy(),
      })
    }
    if (method === 'POST') {
      const body = (await request.json().catch(() => ({}))) as {
        freeRequests?: number
        freeDays?: number
        creditsPer100ExtraReq?: number
        creditsPer30ExtraDays?: number
      }
      const updated = apiGateway.updateAdminPolicy(body)
      return jsonResponse({
        success: true,
        policy: updated,
        message: 'Admin policy updated successfully',
      })
    }
  }

  // DELETE /api/v1/keys/:id
  const deleteKeyMatch = subpath.match(/^keys\/([^/]+)$/)
  if (deleteKeyMatch && method === 'DELETE') {
    const userId = getUserId()
    const keyId = deleteKeyMatch[1]
    const revoked = apiGateway.revokeApiKey(userId, keyId)
    if (!revoked)
      return jsonResponse({ error: 'Key not found or unauthorized' }, 404)
    return jsonResponse({ success: true, message: 'Key revoked successfully' })
  }

  // 5. POST /api/v1/tier
  if (subpath === 'tier' && method === 'POST') {
    const userId = getUserId()
    const body = (await request.json().catch(() => ({}))) as { tier: PlanTier }
    if (!['free', 'pro', 'enterprise'].includes(body.tier)) {
      return jsonResponse(
        { error: 'Invalid tier. Choose free, pro, or enterprise.' },
        400,
      )
    }
    const updated = apiGateway.updateTier(userId, body.tier)
    if (!updated) return jsonResponse({ error: 'Account not found' }, 404)
    return jsonResponse({
      success: true,
      account: updated,
      tierConfig: TIER_CONFIGS[updated.tier],
    })
  }

  // 6. POST /api/v1/credits/topup
  if (subpath === 'credits/topup' && method === 'POST') {
    const userId = getUserId()
    const body = (await request.json().catch(() => ({}))) as { amount: number }
    const amount = Number(body.amount) || 100
    const updated = apiGateway.addCredits(userId, amount)
    if (!updated) return jsonResponse({ error: 'Account not found' }, 404)
    return jsonResponse({
      success: true,
      credits: updated.credits,
      message: `Added ${amount} credits to your developer wallet.`,
    })
  }

  // 7. GET /api/v1/usage
  if (subpath === 'usage' && method === 'GET') {
    const userId = getUserId()
    const overview = apiGateway.getUsageOverview(userId)
    return jsonResponse({
      success: true,
      ...overview,
    })
  }

  // 8. Scraper execution routes: :category/:provider/:action
  // Pattern: ^(donghua|anime|movies)/([^/]+)/([^/]+)$
  const scraperMatch = subpath.match(/^(donghua|anime|movies)\/([^/]+)\/([^/]+)$/i)
  if (scraperMatch) {
    const [, category, providerId, action] = scraperMatch
    const provider = getProviderById(category, providerId)
    if (!provider) {
      return jsonResponse(
        {
          error: `Scraper provider '${providerId}' not found under category '${category}'`,
        },
        404,
      )
    }

    // Extract authorization key
    const authHeader = request.headers.get('authorization') || ''
    const customHeader = request.headers.get('x-api-key') || ''
    const queryKey =
      url.searchParams.get('api_key') || url.searchParams.get('key') || ''
    const token = authHeader || customHeader || queryKey

    // Authenticate Key with strict provider scoping
    const authResult = apiGateway.validateToken(token, provider.id)
    if (!authResult.valid || !authResult.key || !authResult.account) {
      const isForbidden = authResult.error?.includes('Access Denied')
      return jsonResponse(
        {
          error: authResult.error || 'Unauthorized',
          hint: isForbidden
            ? `Issue an API key specifically for '${provider.id}' at /api/keys.`
            : 'Authenticate with Bearer sec_live_... header, x-api-key header, or ?api_key= query parameter.',
          authDocumentation: '/api/docs',
        },
        isForbidden ? 403 : 401,
        isForbidden ? {} : { 'WWW-Authenticate': 'Bearer realm="SecretScraperApi"' },
      )
    }

    const { key, account } = authResult

    // Check & deduct quota (hybrid daily limit + pay-per-request credits)
    const quota = apiGateway.checkAndDeductQuota(key, account, provider.creditCost)
    const quotaHeaders = {
      'X-RateLimit-Limit': String(quota.dailyLimit),
      'X-RateLimit-Remaining': String(quota.remainingToday),
      'X-RateLimit-Reset': '86400',
      'X-Credits-Remaining': String(quota.creditsRemaining),
      'X-Tier': account.tier,
      'X-Provider': provider.id,
      'X-Category': provider.category,
    }

    if (!quota.allowed) {
      return jsonResponse(
        {
          error: 'Rate limit or quota exceeded.',
          message: quota.error,
          tier: account.tier,
          creditsRemaining: account.credits,
          upgradeUrl: '/api-hub',
        },
        429,
        quotaHeaders,
      )
    }

    const startTime = Date.now()
    let resultData: unknown = null
    let statusCode = 200

    try {
      if (action === 'search') {
        const query = url.searchParams.get('q') || ''
        const results = await provider.search(query)
        resultData = {
          success: true,
          query,
          count: results.length,
          provider: provider.id,
          category: provider.category,
          results,
        }
      } else if (action === 'episodes') {
        const id = url.searchParams.get('id') || ''
        if (!provider.getEpisodes) {
          return jsonResponse(
            { error: `Provider ${provider.id} does not support episode listing` },
            400,
            quotaHeaders,
          )
        }
        const episodes = await provider.getEpisodes(id)
        resultData = {
          success: true,
          id,
          provider: provider.id,
          total: episodes.length,
          episodes,
        }
      } else if (action === 'stream') {
        const episodeId =
          url.searchParams.get('episodeId') || url.searchParams.get('id') || ''
        if (!provider.getStream) {
          return jsonResponse(
            { error: `Provider ${provider.id} does not support stream resolving` },
            400,
            quotaHeaders,
          )
        }
        const sources = await provider.getStream(episodeId)
        resultData = {
          success: true,
          episodeId,
          provider: provider.id,
          sources,
        }
      } else if (action === 'recent') {
        if (!provider.getRecent) {
          return jsonResponse(
            { error: `Provider ${provider.id} does not support recent listings` },
            400,
            quotaHeaders,
          )
        }
        const recent = await provider.getRecent()
        resultData = {
          success: true,
          provider: provider.id,
          count: recent.length,
          results: recent,
        }
      } else if (action === 'details') {
        const id = url.searchParams.get('id') || ''
        if (!provider.getDetails) {
          return jsonResponse(
            { error: `Provider ${provider.id} does not support details lookup` },
            400,
            quotaHeaders,
          )
        }
        const details = await provider.getDetails(id)
        resultData = {
          success: true,
          id,
          provider: provider.id,
          details,
        }
      } else {
        statusCode = 404
        resultData = {
          error: `Action '${action}' not supported by provider '${provider.id}'`,
        }
      }
    } catch (err: unknown) {
      statusCode = 500
      const message = err instanceof Error ? err.message : 'Scraper execution error'
      resultData = { error: message }
    }

    const durationMs = Date.now() - startTime
    apiGateway.recordUsage(
      key,
      account,
      category,
      provider.id,
      url.pathname,
      statusCode,
      provider.creditCost,
      durationMs,
    )

    return jsonResponse(resultData, statusCode, {
      ...quotaHeaders,
      'X-Response-Time-Ms': String(durationMs),
    })
  }

  return null
}
