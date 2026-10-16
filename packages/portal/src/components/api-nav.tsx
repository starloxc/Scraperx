interface ApiNavProps {
  currentPath: string
}

export const ApiNav = ({ currentPath }: ApiNavProps) => {
  const tabs = [
    { label: 'Playground', href: '/api/playground' },
    { label: 'Keys', href: '/api/keys' },
    { label: 'Quotas', href: '/api/quotas' },
    { label: 'Docs', href: '/api/docs' },
  ]

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pt-2 pb-6">
      <div className="flex items-center justify-center border-b border-dashed border-zinc-300 pb-px">
        <nav className="flex space-x-6 sm:space-x-8" aria-label="API Subnavigation">
          {tabs.map(tab => {
            const isActive =
              currentPath === tab.href || currentPath.startsWith(`${tab.href}/`)
            return (
              <a
                key={tab.href}
                href={tab.href}
                className={`border-b-2 px-1 py-3.5 text-xs font-medium whitespace-nowrap transition-colors sm:text-sm ${
                  isActive
                    ? 'border-zinc-950 font-semibold text-zinc-950'
                    : 'border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-800'
                }`}
                aria-current={isActive ? 'page' : undefined}>
                {tab.label}
              </a>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
