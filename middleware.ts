import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     *   - _next/static (static assets)
     *   - _next/image  (Next.js image optimization)
     *   - favicon.ico, icon files, manifest, service worker
     *   - public images / fonts
     */
    '/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|manifest|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff|woff2)$).*)',
  ],
};
