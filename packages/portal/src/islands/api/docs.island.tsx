import { useState } from 'react'

export const DocsIsland = () => {
  const [activeSnippet, setActiveSnippet] = useState<'ts' | 'python' | 'curl'>('ts')
  const [copied, setCopied] = useState(false)

  const snippets = {
    ts: `import fetch from 'node-fetch';

// 1. API key must match the target provider!
const API_KEY = process.env.SECRET_API_KEY || 'sec_live_...';

async function queryBilibiliDonghua(title: string) {
  const response = await fetch(\`https://api.secret.sh/api/v1/donghua/bilibili/search?q=\${encodeURIComponent(title)}\`, {
    headers: {
      'Authorization': \`Bearer \${API_KEY}\`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(\`Scraper error [\${response.status}]: \${JSON.stringify(error)}\`);
  }

  const data = await response.json();
  console.log('Results:', data.results);
}

queryBilibiliDonghua('Soul Land');`,

    python: `import requests
import os

API_KEY = os.getenv("SECRET_API_KEY", "sec_live_...")

def search_anime(query: str):
    url = "https://api.secret.sh/api/v1/anime/gogoanime/search"
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Accept": "application/json"
    }
    params = {"q": query}
    
    response = requests.get(url, headers=headers, params=params)
    response.raise_for_status()
    return response.json()

print(search_anime("Frieren"))`,

    curl: `# 1. Search Chinese Animation (Donghua) via Bilibili
curl -X GET "https://api.secret.sh/api/v1/donghua/bilibili/search?q=Soul%20Land" \\
  -H "Authorization: Bearer sec_live_bilibili_demo_key" \\
  -H "Accept: application/json"

# 2. Extract Anime Stream via GogoAnime
curl -X GET "https://api.secret.sh/api/v1/anime/gogoanime/stream?episodeId=gogo-frieren-ep-1" \\
  -H "Authorization: Bearer sec_live_gogoanime_demo_key" \\
  -H "Accept: application/json"`,
  }

  const copyCode = () => {
    navigator.clipboard.writeText(snippets[activeSnippet])
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      {/* Title */}
      <div className="border-b border-zinc-200 pb-3">
        <span className="text-xs font-semibold tracking-wider text-zinc-600 uppercase">
          Docs & SDK
        </span>
      </div>

      {/* Code Snippet Box */}
      <div className="space-y-4 rounded-2xl border border-dashed border-zinc-300 bg-white p-6 shadow-2xs">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <div className="flex items-center gap-2">
            {[
              { id: 'ts', label: 'TypeScript / Fetch' },
              { id: 'python', label: 'Python (requests)' },
              { id: 'curl', label: 'cURL Terminal' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveSnippet(tab.id as typeof activeSnippet)}
                className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeSnippet === tab.id
                    ? 'bg-zinc-900 text-white shadow-2xs'
                    : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950'
                }`}>
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={copyCode}
            className="cursor-pointer text-xs text-zinc-600 underline underline-offset-2 hover:text-zinc-950">
            {copied ? '✓ Copied' : 'Copy Code'}
          </button>
        </div>

        <pre className="overflow-x-auto rounded-xl bg-zinc-950 p-4 font-mono text-xs leading-relaxed text-zinc-100">
          {snippets[activeSnippet]}
        </pre>
      </div>

      {/* Endpoint Reference Table */}
      <div className="space-y-3 rounded-2xl border border-dashed border-zinc-300 bg-white p-6 shadow-2xs">
        <h3 className="text-sm font-semibold text-zinc-950">Endpoint URI Matrix</h3>
        <table className="w-full text-left font-mono text-xs">
          <thead>
            <tr className="border-b border-zinc-200 text-zinc-500">
              <th className="px-3 py-2.5">METHOD</th>
              <th className="px-3 py-2.5">PATH PATTERN</th>
              <th className="px-3 py-2.5">PURPOSE</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 text-zinc-800">
            <tr>
              <td className="px-3 py-2 font-bold text-emerald-700">GET</td>
              <td className="px-3 py-2">/api/v1/:category/:provider/search?q=...</td>
              <td className="px-3 py-2 font-sans text-zinc-600">
                Search catalog by keyword
              </td>
            </tr>
            <tr>
              <td className="px-3 py-2 font-bold text-emerald-700">GET</td>
              <td className="px-3 py-2">
                /api/v1/:category/:provider/episodes?id=...
              </td>
              <td className="px-3 py-2 font-sans text-zinc-600">
                List episodes & air dates
              </td>
            </tr>
            <tr>
              <td className="px-3 py-2 font-bold text-emerald-700">GET</td>
              <td className="px-3 py-2">
                /api/v1/:category/:provider/stream?episodeId=...
              </td>
              <td className="px-3 py-2 font-sans text-zinc-600">
                Extract M3U8 video streams
              </td>
            </tr>
            <tr>
              <td className="px-3 py-2 font-bold text-emerald-700">GET</td>
              <td className="px-3 py-2">/api/v1/:category/:provider/recent</td>
              <td className="px-3 py-2 font-sans text-zinc-600">
                Recently aired releases
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
