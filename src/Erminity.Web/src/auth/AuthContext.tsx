import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

export type AuthUser = {
  id: string
  email: string
  displayName?: string
  roles: string[]
  emailConfirmed: boolean
}

type AuthContextValue = {
  user: AuthUser | null
  loading: boolean
  refresh: () => Promise<void>
  login: (email: string, password: string) => Promise<{ ok: true } | { ok: false; error: string }>
  register: (
    email: string,
    password: string,
    displayName?: string,
  ) => Promise<{ ok: true } | { ok: false; error: string }>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

async function readError(res: Response) {
  try {
    const data = (await res.json()) as { error?: string }
    return data.error ?? `http_${res.status}`
  } catch {
    return `http_${res.status}`
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' })
      if (!res.ok) {
        setUser(null)
        return
      }
      setUser((await res.json()) as AuthUser)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    if (!res.ok) return { ok: false as const, error: await readError(res) }
    setUser((await res.json()) as AuthUser)
    return { ok: true as const }
  }, [])

  const register = useCallback(async (email: string, password: string, displayName?: string) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, displayName }),
    })
    if (!res.ok) return { ok: false as const, error: await readError(res) }
    setUser((await res.json()) as AuthUser)
    return { ok: true as const }
  }, [])

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, loading, refresh, login, register, logout }),
    [user, loading, refresh, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
