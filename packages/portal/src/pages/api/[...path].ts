import type { APIRoute } from 'astro'
import { bytesToBase64Url } from 'secret-cipher'
import { handleV1Route } from './v1-handler'

export const prerender = false

type SecretRecord = {
  id: string
  kind: 'text' | 'file'
  status: 'pending' | 'ready' | 'destroyed'
  textCipher: string | null
  uploadToken: string | null
  fileBytes: Uint8Array | null
  salt: string | null
  manifestIv: string | null
  encryptedManifest: string | null
  plainSize: number
  encryptedSize: number
  chunkSize: number | null
  chunkCount: number | null
  readLimit: number
  trackId: string
  expiresAt: number
  createdAt: number
  completedAt: number | null
  destroyedAt: number | null
  access?: unknown
}

type ReadRecord = {
  readId: string
  secretId: string
  expiresAt: number
  consumedAt: number | null
}

type EvmReadRecord = {
  evmId: string
  readId: string
  secretId: string
  address?: string
}

type EvmChallenge = {
  id: string
  evmId: string
  nonce: string
  domain: string
  uri: string
  issuedAt: string
  expiresAt: string
}

const secrets = new Map<string, SecretRecord>()
const reads = new Map<string, ReadRecord>()
const readsBySecret = new Map<string, string[]>()
const secretsByTrack = new Map<string, string>()
const evmReads = new Map<string, EvmReadRecord>()
const evmChallenges = new Map<string, EvmChallenge>()

const randomId = (byteLength: number): string => {
  const bytes = new Uint8Array(byteLength)
  crypto.getRandomValues(bytes)
  return bytesToBase64Url(bytes)
}

const createReadIds = (count: number): string[] => {
  return Array.from({ length: count }, () => randomId(16))
}

const json = (data: unknown, status = 200) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

const textError = (message: string, status = 400) => {
  return json({ error: message }, status)
}

export const ALL: APIRoute = async ({ request, params }) => {
  const url = new URL(request.url)
  const pathname = url.pathname.replace(/^\/api\/?/, '')
  const method = request.method.toUpperCase()

  if (method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers':
          'Content-Type, Authorization, x-api-key, x-user-id',
      },
    })
  }

  // Handle v1 API System routes (Scrapers, API Keys, Quotas, Usage)
  const v1Response = await handleV1Route({ request, url, pathname, method })
  if (v1Response) return v1Response

  // GET /api/status
  if (pathname === 'status' && method === 'GET') {
    return json({ status: 'ok', timestamp: Date.now() })
  }

  // POST /api/secrets/text
  if (pathname === 'secrets/text' && method === 'POST') {
    const body = (await request.json()) as {
      access?: unknown
      cipher: string
      plainSize: number
      expiresInSeconds: number
      reads: number
    }
    const timestamp = Date.now()
    const expiresInSeconds = body.expiresInSeconds || 3600
    const readCount = body.reads || 1
    const expiresAt = timestamp + expiresInSeconds * 1000
    const secretId = randomId(16)
    const trackId = randomId(24)
    const readIdList = createReadIds(readCount)

    const secret: SecretRecord = {
      id: secretId,
      kind: 'text',
      status: 'ready',
      textCipher: body.cipher,
      uploadToken: null,
      fileBytes: null,
      salt: null,
      manifestIv: null,
      encryptedManifest: null,
      plainSize: body.plainSize || 0,
      encryptedSize: body.cipher ? new TextEncoder().encode(body.cipher).length : 0,
      chunkSize: null,
      chunkCount: null,
      readLimit: readCount,
      trackId,
      expiresAt,
      createdAt: timestamp,
      completedAt: timestamp,
      destroyedAt: null,
      access: body.access,
    }

    secrets.set(secretId, secret)
    secretsByTrack.set(trackId, secretId)
    readsBySecret.set(secretId, readIdList)
    for (const rid of readIdList) {
      reads.set(rid, {
        readId: rid,
        secretId,
        expiresAt,
        consumedAt: null,
      })
    }

    if (body.access) {
      const evmIdList = createReadIds(readCount)
      for (let i = 0; i < readCount; i++) {
        const eid = evmIdList[i]
        const rid = readIdList[i]
        evmReads.set(eid, {
          evmId: eid,
          readId: rid,
          secretId,
        })
      }
      return json({
        kind: 'text',
        evmIds: evmIdList,
        trackId,
        expiresAt,
      })
    }

    return json({
      kind: 'text',
      readIds: readIdList,
      trackId,
      expiresAt,
    })
  }

  // POST /api/secrets/files/init
  if (pathname === 'secrets/files/init' && method === 'POST') {
    const body = (await request.json()) as {
      access?: unknown
      salt: string
      manifestIv: string
      encryptedManifest: string
      plainSize: number
      encryptedSize: number
      chunkSize: number
      chunkCount: number
      expiresInSeconds: number
      reads: number
    }
    const timestamp = Date.now()
    const expiresInSeconds = body.expiresInSeconds || 3600
    const readCount = body.reads || 1
    const expiresAt = timestamp + expiresInSeconds * 1000
    const secretId = randomId(16)
    const uploadToken = randomId(24)
    const uploadUrl = `/api/secrets/files/upload/${secretId}`

    const secret: SecretRecord = {
      id: secretId,
      kind: 'file',
      status: 'pending',
      textCipher: null,
      uploadToken,
      fileBytes: null,
      salt: body.salt,
      manifestIv: body.manifestIv,
      encryptedManifest: body.encryptedManifest,
      plainSize: body.plainSize,
      encryptedSize: body.encryptedSize,
      chunkSize: body.chunkSize,
      chunkCount: body.chunkCount,
      readLimit: readCount,
      trackId: '',
      expiresAt,
      createdAt: timestamp,
      completedAt: null,
      destroyedAt: null,
      access: body.access,
    }

    secrets.set(secretId, secret)

    return json({
      kind: 'file',
      secretId,
      uploadToken,
      uploadUrl,
      expiresAt,
    })
  }

  // PUT /api/secrets/files/upload/:secretId
  if (pathname.startsWith('secrets/files/upload/') && method === 'PUT') {
    const secretId = pathname.slice('secrets/files/upload/'.length)
    const secret = secrets.get(secretId)
    if (!secret) return textError('Upload session not found.', 404)
    const arrayBuffer = await request.arrayBuffer()
    secret.fileBytes = new Uint8Array(arrayBuffer)
    return new Response(null, { status: 200 })
  }

  // POST /api/secrets/files/:secretId/complete
  const completeMatch = pathname.match(/^secrets\/files\/([^/]+)\/complete$/)
  if (completeMatch && method === 'POST') {
    const secretId = decodeURIComponent(completeMatch[1])
    const secret = secrets.get(secretId)
    if (!secret) return textError('Upload session not found.', 404)
    const body = (await request.json()) as { uploadToken: string }
    if (body.uploadToken !== secret.uploadToken) {
      return textError('Invalid upload token.', 403)
    }

    const timestamp = Date.now()
    const trackId = randomId(24)
    const readIdList = createReadIds(secret.readLimit)

    secret.status = 'ready'
    secret.uploadToken = null
    secret.trackId = trackId
    secret.completedAt = timestamp

    secretsByTrack.set(trackId, secretId)
    readsBySecret.set(secretId, readIdList)
    for (const rid of readIdList) {
      reads.set(rid, {
        readId: rid,
        secretId,
        expiresAt: secret.expiresAt,
        consumedAt: null,
      })
    }

    if (secret.access) {
      const evmIdList = createReadIds(secret.readLimit)
      for (let i = 0; i < secret.readLimit; i++) {
        const eid = evmIdList[i]
        const rid = readIdList[i]
        evmReads.set(eid, {
          evmId: eid,
          readId: rid,
          secretId,
        })
      }
      return json({
        kind: 'file',
        evmIds: evmIdList,
        trackId,
        expiresAt: secret.expiresAt,
      })
    }

    return json({
      kind: 'file',
      readIds: readIdList,
      trackId,
      expiresAt: secret.expiresAt,
    })
  }

  // GET /api/secrets/track/:trackId
  const trackMatch = pathname.match(/^secrets\/track\/([^/]+)$/)
  if (trackMatch && method === 'GET') {
    const trackId = decodeURIComponent(trackMatch[1])
    const secretId = secretsByTrack.get(trackId)
    if (!secretId) return textError('Secret not found.', 404)
    const secret = secrets.get(secretId)
    if (!secret) return textError('Secret not found.', 404)

    const readIdList = readsBySecret.get(secretId) || []
    const readRows = readIdList.map(rid => {
      const r = reads.get(rid)
      return {
        readId: rid,
        consumedAt: r ? r.consumedAt : null,
      }
    })
    const remainingReads = readRows.filter(r => r.consumedAt === null).length
    const now = Date.now()

    let status: 'pending' | 'ready' | 'destroyed' | 'expired' = secret.status
    if (secret.expiresAt <= now && remainingReads > 0) {
      status = 'expired'
    }

    return json({
      kind: secret.kind,
      status,
      createdAt: secret.createdAt,
      completedAt: secret.completedAt,
      expiresAt: secret.expiresAt,
      destroyedAt: secret.destroyedAt,
      readLimit: secret.readLimit,
      remainingReads,
      reads: readRows,
    })
  }

  // GET /api/secrets/:readId/file
  const fileDownloadMatch = pathname.match(/^secrets\/([^/]+)\/file$/)
  if (fileDownloadMatch && method === 'GET') {
    const readId = decodeURIComponent(fileDownloadMatch[1])
    const readRec = reads.get(readId)
    if (!readRec) return textError('Secret not found.', 404)
    const secret = secrets.get(readRec.secretId)
    if (!secret || secret.kind !== 'file' || !secret.fileBytes) {
      return textError('File secret is incomplete or not found.', 404)
    }
    const now = Date.now()
    if (secret.expiresAt <= now) {
      return textError('Secret has expired.', 410)
    }

    return new Response(secret.fileBytes, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Length': String(secret.fileBytes.byteLength),
      },
    })
  }

  // GET /api/secrets/:readId
  const readMatch = pathname.match(/^secrets\/([^/]+)$/)
  if (readMatch && method === 'GET') {
    const readId = decodeURIComponent(readMatch[1])
    const readRec = reads.get(readId)
    if (!readRec) return textError('Secret not found.', 404)
    if (readRec.consumedAt)
      return textError('Secret link has already been used.', 410)
    const secret = secrets.get(readRec.secretId)
    if (!secret) return textError('Secret not found.', 404)
    const now = Date.now()
    if (secret.expiresAt <= now) {
      secret.status = 'destroyed'
      secret.destroyedAt = now
      return textError('Secret has expired.', 410)
    }
    if (secret.status !== 'ready') return textError('Secret not found.', 404)

    // Consume read link
    readRec.consumedAt = now

    // Check remaining reads
    const allReads = readsBySecret.get(secret.id) || []
    const remaining = allReads.filter(rid => !reads.get(rid)?.consumedAt).length
    if (remaining === 0) {
      secret.status = 'destroyed'
      secret.destroyedAt = now
    }

    if (secret.kind === 'text') {
      return json({
        kind: 'text',
        cipher: secret.textCipher,
        expiresAt: secret.expiresAt,
      })
    }

    return json({
      kind: 'file',
      manifest: {
        salt: secret.salt,
        iv: secret.manifestIv,
        cipher: secret.encryptedManifest,
        chunkSize: secret.chunkSize,
        chunkCount: secret.chunkCount,
        encryptedSize: secret.encryptedSize,
      },
      expiresAt: secret.expiresAt,
    })
  }

  // EVM routes
  if (pathname.startsWith('chains/evm/addresses/') && pathname.endsWith('/status')) {
    return json({ supported: true })
  }

  if (pathname === 'chains/evm/resolve-ens' && method === 'POST') {
    const body = (await request.json()) as { name: string }
    return json({
      name: body.name,
      address: null,
      status: 'unresolved',
      error: null,
      cacheHit: false,
      resolvedAt: Date.now(),
    })
  }

  const evmChallengeMatch = pathname.match(/^chains\/evm\/([^/]+)\/challenge$/)
  if (evmChallengeMatch && method === 'POST') {
    const evmId = decodeURIComponent(evmChallengeMatch[1])
    const evmRec = evmReads.get(evmId)
    if (!evmRec) return textError('EVM access not found.', 404)
    const body = (await request.json().catch(() => ({}))) as { origin?: string }
    const challengeId = randomId(16)
    const nonce = randomId(12)
    const issuedAt = new Date().toISOString()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString()
    const origin = body.origin || 'http://localhost:3000'
    let domain = 'localhost'
    try {
      domain = new URL(origin).host
    } catch {
      // fallback
    }
    evmChallenges.set(challengeId, {
      id: challengeId,
      evmId,
      nonce,
      domain,
      uri: origin,
      issuedAt,
      expiresAt,
    })
    return json({
      challengeId,
      chainId: 1,
      domain,
      expiresAt,
      issuedAt,
      nonce,
      statement: 'Sign in to access encrypted secret.',
      uri: origin,
      version: '1',
    })
  }

  const evmVerifyMatch = pathname.match(/^chains\/evm\/([^/]+)\/verify$/)
  if (evmVerifyMatch && method === 'POST') {
    const evmId = decodeURIComponent(evmVerifyMatch[1])
    const evmRec = evmReads.get(evmId)
    if (!evmRec) return textError('EVM access not found.', 404)
    return json({ readId: evmRec.readId })
  }

  return textError('Not found', 404)
}

export const GET: APIRoute = ALL
export const POST: APIRoute = ALL
export const PUT: APIRoute = ALL
export const DELETE: APIRoute = ALL
