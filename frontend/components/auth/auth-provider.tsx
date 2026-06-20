"use client"

import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase"
import type { User, AuthError } from "@supabase/supabase-js"

type AuthContextType = {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null, data?: any }>
  signUp: (email: string, password: string, meta?: { name?: string; role?: string }) => Promise<{ error: AuthError | null, data?: any }>
  signInWithGoogle: () => Promise<{ error: AuthError | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * Upsert user profile in public.users table.
 * Called on every SIGNED_IN event (email signup, email login, Google OAuth).
 * If the user already exists, updates name/avatar. If not, creates the row.
 */
async function upsertUserProfile(supabase: ReturnType<typeof createClient>, user: User) {
  const meta = user.user_metadata || {}
  const profileData = {
    id: user.id,
    email: user.email ?? "",
    full_name: meta.full_name || meta.name || "",
    avatar_url: meta.avatar_url || meta.picture || "",
    role: meta.role || "client",
  }

  await supabase.from("users").upsert(profileData, { onConflict: "id" })
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user) upsertUserProfile(supabase, user)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)
      setLoading(false)

      // Upsert profile on sign in (covers Google OAuth first login + email login)
      if (event === "SIGNED_IN" && currentUser) {
        upsertUserProfile(supabase, currentUser)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    return { error, data }
  }, [])

  const signUp = useCallback(async (email: string, password: string, meta?: { name?: string; role?: string }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: meta?.name ?? "",
          role: meta?.role ?? "client",
        },
      },
    })
    return { error, data }
  }, [])

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    return { error }
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>")
  return ctx
}
