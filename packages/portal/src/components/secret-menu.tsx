import { useEffect, useRef, useState } from 'react'

interface SecretMenuProps {
  currentPath?: string
}

const CACHE_CLEAR_DELAY_MS = 2500

export const SecretMenu = ({ currentPath = '/' }: SecretMenuProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'menu' | 'settings'>('menu')
  const [clearedMessage, setClearedMessage] = useState<string | null>(null)
  const sheetRef = useRef<HTMLDivElement>(null)

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  // Prevent background scrolling when open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = originalOverflow
      }
    }
  }, [isOpen])

  const handleClearLocalCache = () => {
    try {
      localStorage.clear()
      setClearedMessage('Local cache cleared successfully')
      setTimeout(() => setClearedMessage(null), CACHE_CLEAR_DELAY_MS)
    } catch {
      setClearedMessage('Failed to clear cache')
    }
  }

  // Determine active item based on current path
  const isActive = (itemPath?: string) => {
    if (!itemPath) return false
    if (itemPath === '/' && (currentPath === '/' || currentPath === '')) return true
    if (itemPath !== '/' && currentPath.startsWith(itemPath)) return true
    return false
  }

  return (
    <>
      {/* 3-line hamburger menu button in top right */}
      <button
        type="button"
        onClick={() => {
          setActiveTab('menu')
          setIsOpen(true)
        }}
        aria-label="Open menu"
        aria-expanded={isOpen}
        className="flex size-9 cursor-pointer items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-white text-zinc-800 shadow-2xs transition-colors hover:border-zinc-400 hover:text-zinc-950 focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:outline-none">
        <svg
          className="size-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round">
          <line x1="4" y1="6" x2="20" y2="6" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="18" x2="20" y2="18" />
        </svg>
      </button>

      {/* Dimmed backdrop overlay */}
      <div
        className={`fixed inset-0 z-50 bg-black/65 backdrop-blur-xs transition-opacity duration-300 ${
          isOpen
            ? 'pointer-events-auto opacity-100'
            : 'pointer-events-none opacity-0'
        }`}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      {/* Bottom sheet drawer sliding up from bottom */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className={`fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-lg rounded-t-3xl border-t border-zinc-800 bg-[#121214] text-zinc-100 shadow-2xl transition-transform duration-300 ease-out ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}>
        {/* Grab handle indicator */}
        <div className="pt-3 pb-1" onClick={() => setIsOpen(false)}>
          <div className="mx-auto h-1.5 w-10 cursor-grab rounded-full bg-zinc-700/80 active:cursor-grabbing" />
        </div>

        {/* Top header inside bottom sheet */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 px-5 py-3">
          <div className="flex items-center gap-2">
            {activeTab === 'settings' && (
              <button
                type="button"
                onClick={() => setActiveTab('menu')}
                className="mr-1 inline-flex size-7 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-white"
                aria-label="Back to menu">
                <svg
                  className="size-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2">
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </button>
            )}
            <h2 className="text-base font-semibold tracking-tight text-white">
              {activeTab === 'menu' ? 'Navigation' : 'Settings & Preferences'}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label="Close menu"
            className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white">
            <svg
              className="size-4.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Sheet Content */}
        <div className="max-h-[75vh] overflow-y-auto px-4 py-3 pb-8">
          {activeTab === 'menu' ? (
            <div className="space-y-1">
              {/* Create Secret */}
              <a
                href="/go"
                onClick={() => setIsOpen(false)}
                className={`group flex min-h-[46px] items-center justify-between rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors ${
                  isActive('/go')
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-300 hover:bg-zinc-800/60 hover:text-white'
                }`}>
                <div className="flex items-center gap-3.5">
                  <svg
                    className={`size-5 shrink-0 ${
                      isActive('/go')
                        ? 'text-white'
                        : 'text-zinc-400 group-hover:text-zinc-200'
                    }`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round">
                    <path d="m21.12 6.4-6.05-3.5a3.97 3.97 0 0 0-3.94 0L5.08 6.4a4 4 0 0 0-2.08 3.5v7.2a4 4 0 0 0 2.08 3.5l6.05 3.5a4 4 0 0 0 3.94 0l6.05-3.5a4 4 0 0 0 2.08-3.5V9.9a4 4 0 0 0-2.08-3.5Z" />
                    <path d="m3.29 7 9.71 5.6 9.71-5.6" />
                    <path d="M12 22.6V12.6" />
                  </svg>
                  <span>Create Secret</span>
                </div>
                <span className="text-xs text-zinc-500 group-hover:text-zinc-400">
                  Encrypt
                </span>
              </a>

              {/* Playground */}
              <a
                href="/api/playground"
                onClick={() => setIsOpen(false)}
                className={`group flex min-h-[46px] items-center justify-between rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors ${
                  isActive('/api/playground')
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-300 hover:bg-zinc-800/60 hover:text-white'
                }`}>
                <div className="flex items-center gap-3.5">
                  <svg
                    className={`size-5 shrink-0 ${
                      isActive('/api/playground')
                        ? 'text-white'
                        : 'text-zinc-400 group-hover:text-zinc-200'
                    }`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round">
                    <rect width="18" height="18" x="3" y="3" rx="2" />
                    <path d="m10 9-3 3 3 3" />
                    <path d="m14 9 3 3-3 3" />
                  </svg>
                  <span>Playground</span>
                </div>
                <span className="text-xs text-zinc-500 group-hover:text-zinc-400">
                  Execute
                </span>
              </a>

              {/* Keys */}
              <a
                href="/api/keys"
                onClick={() => setIsOpen(false)}
                className={`group flex min-h-[46px] items-center justify-between rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors ${
                  isActive('/api/keys')
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-300 hover:bg-zinc-800/60 hover:text-white'
                }`}>
                <div className="flex items-center gap-3.5">
                  <svg
                    className={`size-5 shrink-0 ${
                      isActive('/api/keys')
                        ? 'text-white'
                        : 'text-zinc-400 group-hover:text-zinc-200'
                    }`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round">
                    <circle cx="7.5" cy="15.5" r="5.5" />
                    <path d="m21 2-9.6 9.6" />
                    <path d="m15.5 7.5 3 3L22 7l-3-3" />
                  </svg>
                  <span>Keys</span>
                </div>
                <span className="text-xs text-zinc-500 group-hover:text-zinc-400">
                  Tokens
                </span>
              </a>

              {/* Quotas */}
              <a
                href="/api/quotas"
                onClick={() => setIsOpen(false)}
                className={`group flex min-h-[46px] items-center justify-between rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors ${
                  isActive('/api/quotas')
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-300 hover:bg-zinc-800/60 hover:text-white'
                }`}>
                <div className="flex items-center gap-3.5">
                  <svg
                    className={`size-5 shrink-0 ${
                      isActive('/api/quotas')
                        ? 'text-white'
                        : 'text-zinc-400 group-hover:text-zinc-200'
                    }`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round">
                    <path d="M12 2v20" />
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                  <span>Quotas</span>
                </div>
                <span className="text-xs text-zinc-500 group-hover:text-zinc-400">
                  Credits
                </span>
              </a>

              {/* Docs */}
              <a
                href="/api/docs"
                onClick={() => setIsOpen(false)}
                className={`group flex min-h-[46px] items-center justify-between rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors ${
                  isActive('/api/docs')
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-300 hover:bg-zinc-800/60 hover:text-white'
                }`}>
                <div className="flex items-center gap-3.5">
                  <svg
                    className={`size-5 shrink-0 ${
                      isActive('/api/docs')
                        ? 'text-white'
                        : 'text-zinc-400 group-hover:text-zinc-200'
                    }`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round">
                    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
                    <path d="M6 6h10" />
                    <path d="M6 10h10" />
                  </svg>
                  <span>Docs</span>
                </div>
                <span className="text-xs text-zinc-500 group-hover:text-zinc-400">
                  Guide
                </span>
              </a>

              {/* Keyspaces / Track Secrets */}
              <a
                href="/track"
                onClick={() => setIsOpen(false)}
                className={`group flex min-h-[46px] items-center justify-between rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors ${
                  isActive('/track')
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-300 hover:bg-zinc-800/60 hover:text-white'
                }`}>
                <div className="flex items-center gap-3.5">
                  <svg
                    className={`size-5 shrink-0 ${
                      isActive('/track')
                        ? 'text-white'
                        : 'text-zinc-400 group-hover:text-zinc-200'
                    }`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round">
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                  </svg>
                  <span>Track Secrets</span>
                </div>
                <span className="text-xs text-zinc-500 group-hover:text-zinc-400">
                  Live Status
                </span>
              </a>

              {/* Ratelimit / Security & Architecture */}
              <a
                href="/intro"
                onClick={() => setIsOpen(false)}
                className={`group flex min-h-[46px] items-center justify-between rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors ${
                  isActive('/intro')
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-300 hover:bg-zinc-800/60 hover:text-white'
                }`}>
                <div className="flex items-center gap-3.5">
                  <svg
                    className={`size-5 shrink-0 ${
                      isActive('/intro')
                        ? 'text-white'
                        : 'text-zinc-400 group-hover:text-zinc-200'
                    }`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round">
                    <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Z" />
                    <path d="M12 12 16 8" />
                    <path d="M12 6v2" />
                    <path d="M6 12h2" />
                    <path d="M16 12h2" />
                  </svg>
                  <span>Architecture & Intro</span>
                </div>
                <span className="text-xs text-zinc-500 group-hover:text-zinc-400">
                  Zero-Knowledge
                </span>
              </a>

              {/* Authorization / Security Model */}
              <a
                href="/intro#security"
                onClick={() => setIsOpen(false)}
                className="group flex min-h-[46px] items-center justify-between rounded-lg px-3.5 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800/60 hover:text-white">
                <div className="flex items-center gap-3.5">
                  <svg
                    className="size-5 shrink-0 text-zinc-400 group-hover:text-zinc-200"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round">
                    <rect width="16" height="11" x="4" y="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <span>Authorization & Web3</span>
                </div>
                <span className="text-xs text-zinc-500 group-hover:text-zinc-400">
                  EVM & SIWE
                </span>
              </a>

              {/* Logs / Terminal CLI */}
              <a
                href="/terminal"
                onClick={() => setIsOpen(false)}
                className={`group flex min-h-[46px] items-center justify-between rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors ${
                  isActive('/terminal')
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-300 hover:bg-zinc-800/60 hover:text-white'
                }`}>
                <div className="flex items-center gap-3.5">
                  <svg
                    className={`size-5 shrink-0 ${
                      isActive('/terminal')
                        ? 'text-white'
                        : 'text-zinc-400 group-hover:text-zinc-200'
                    }`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round">
                    <path d="m4 17 6-6-6-6" />
                    <line x1="12" y1="19" x2="20" y2="19" />
                  </svg>
                  <span>Terminal CLI</span>
                </div>
                <span className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-[11px] text-zinc-400">
                  npx secret
                </span>
              </a>

              {/* Home Page */}
              <a
                href="/"
                onClick={() => setIsOpen(false)}
                className={`group flex min-h-[46px] items-center justify-between rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors ${
                  isActive('/')
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-300 hover:bg-zinc-800/60 hover:text-white'
                }`}>
                <div className="flex items-center gap-3.5">
                  <svg
                    className={`size-5 shrink-0 ${
                      isActive('/')
                        ? 'text-white'
                        : 'text-zinc-400 group-hover:text-zinc-200'
                    }`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round">
                    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                  <span>Home</span>
                </div>
              </a>

              {/* Identities / Open Source GitHub */}
              <a
                href="https://github.com/unix/secret"
                target="_blank"
                rel="noreferrer"
                onClick={() => setIsOpen(false)}
                className="group flex min-h-[46px] items-center justify-between rounded-lg px-3.5 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800/60 hover:text-white">
                <div className="flex items-center gap-3.5">
                  <svg
                    className="size-5 shrink-0 text-zinc-400 group-hover:text-zinc-200"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round">
                    <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.52 2.34 1.08 2.91.83.09-.65.35-1.08.63-1.33-2.22-.25-4.56-1.11-4.56-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02a9.58 9.58 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.69-4.57 4.94.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2Z" />
                  </svg>
                  <span>Open Source</span>
                </div>
                <span className="text-xs text-zinc-500 group-hover:text-zinc-400">
                  GitHub ↗
                </span>
              </a>

              {/* Settings / Preferences */}
              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                className="group flex min-h-[46px] w-full cursor-pointer items-center justify-between rounded-lg px-3.5 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800/60 hover:text-white">
                <div className="flex items-center gap-3.5">
                  <svg
                    className="size-5 shrink-0 text-zinc-400 group-hover:text-zinc-200"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round">
                    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  <span>Settings</span>
                </div>
                <svg
                  className="size-4 text-zinc-500 group-hover:text-zinc-300"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
            </div>
          ) : (
            /* Settings Panel */
            <div className="space-y-4 text-left">
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-white">
                      Encryption Standard
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Client-Side Web Crypto API
                    </p>
                  </div>
                  <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400">
                    AES-GCM 256
                  </span>
                </div>
                <div className="mt-3 border-t border-zinc-800/80 pt-3 text-xs text-zinc-400">
                  Decryption keys reside exclusively in the URL hash fragment and are
                  never transmitted across the network.
                </div>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-white">
                      Local Storage Cache
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Cached track links & temporary history
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearLocalCache}
                    className="cursor-pointer rounded-md bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-200 transition-colors hover:bg-zinc-700 hover:text-white">
                    Clear Cache
                  </button>
                </div>
                {clearedMessage && (
                  <p className="mt-2 text-xs font-medium text-emerald-400">
                    {clearedMessage}
                  </p>
                )}
              </div>

              <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-white">API Engine</h3>
                    <p className="text-xs text-zinc-400">Embedded In-Memory Vault</p>
                  </div>
                  <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-300">
                    Active (0ms)
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('menu')}
                className="w-full cursor-pointer rounded-lg bg-zinc-800 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-zinc-700">
                Back to Navigation
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
export default SecretMenu
