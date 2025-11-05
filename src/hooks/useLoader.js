export async function safeQuery(qPromise) {
  try {
    const { data, error } = await qPromise
    if (error) throw error
    return [data, null]
  } catch (e) {
    console.error(e)
    return [[], e]
  }
}

import { useEffect, useState } from 'react'
export function useLoader(loader, deps = []) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const run = async () => {
    setLoading(true); setError(null)
    try {
      const result = await loader()
      setData(result || [])
    } catch (e) {
      console.error(e); setError(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { run() }, deps) // eslint-disable-line
  return { data, loading, error, refetch: run, setData }
}
