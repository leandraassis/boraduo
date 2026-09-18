import { useState } from 'react'

interface AvatarProps {
  url: string | null
  name: string
  className?: string
}

// Decorativo: o nome sempre aparece em texto ao lado.
export function Avatar({ url, name, className = 'h-12 w-12' }: AvatarProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  const showImage = url !== null && url !== failedUrl
  const initial = Array.from(name.trim())[0]?.toUpperCase() ?? '?'

  return (
    <span
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line-strong bg-field ${className}`}
    >
      {showImage ? (
        <img
          src={url}
          alt=""
          draggable={false}
          className="h-full w-full object-cover"
          onError={() => setFailedUrl(url)}
        />
      ) : (
        <span className="bg-linear-to-br from-brand/50 to-surface flex h-full w-full items-center justify-center text-base font-bold text-ink/80">
          {initial}
        </span>
      )}
    </span>
  )
}
