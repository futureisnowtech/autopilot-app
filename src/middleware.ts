import { createServerClient, type CookieOptions } from '@supabase/auth-helpers-nextjs'
import { NextResponse, type NextRequest } from 'next/server'
import { getSupabaseConfig } from './lib/supabase-config'

/**
 * Next.js 16 Proxy (replaces Middleware)
 * Handles session validation and cookie synchronization.
 * See: https://nextjs.org/docs/messages/middleware-to-proxy
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const { url, anonKey } = getSupabaseConfig();

  const supabase = createServerClient(
    url,
    anonKey,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // Sync with request to keep client updated during this request
          request.cookies.set({ name, value, ...options })
          // Set on the response to return to browser
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // This will also refresh the session if it's expired
  const { data: { session } } = await supabase.auth.getSession()

  const isAuthPage = request.nextUrl.pathname === '/auth'
  const isDashboardPage = request.nextUrl.pathname.startsWith('/dashboard')

  // Prevent loops: only redirect if necessary
  if (session && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  if (!session && isDashboardPage) {
    return NextResponse.redirect(new URL('/auth', request.url))
  }

  return response
}

// Support both 'middleware.ts' and 'proxy.ts' naming conventions
export const config = {
  matcher: ['/dashboard/:path*', '/auth'],
}
