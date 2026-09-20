import { useEffect, useState } from 'react'

// Valor que só acompanha o original depois de `delayMs` sem mudar (ex.: campo de busca que consulta o servidor).
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])

  return debounced
}
