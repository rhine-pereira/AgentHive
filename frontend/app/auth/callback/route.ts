import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const paramRole = searchParams.get("role")
  let next = searchParams.get("next") ?? "/dashboard"

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options),
              )
            } catch {
              // ignore — called from Server Component
            }
          },
        },
      },
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Upsert user profile in public.users after successful OAuth
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          let meta = user.user_metadata || {}
          let finalRole = meta.role || paramRole

          // If a new role was passed during Google signup that differs, update metadata
          if (paramRole && meta.role !== paramRole) {
            await supabase.auth.updateUser({ data: { role: paramRole } })
            finalRole = paramRole
          }

          // If STILL no role, this is a first-time Google login from the Login page!
          if (!finalRole) {
            return NextResponse.redirect(`${origin}/onboarding`)
          }

          // Dynamic redirect based on role if next is default
          if (next === "/dashboard" && finalRole === "freelancer") {
            next = "/freelancer"
          }

          await supabase.from("users").upsert(
            {
              id: user.id,
              email: user.email ?? "",
              full_name: meta.full_name || meta.name || "",
              avatar_url: meta.avatar_url || meta.picture || "",
              role: finalRole,
            },
            { onConflict: "id" },
          )
        }
      } catch {
        // Non-blocking — profile will be created by auth provider fallback
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
