
import {NextResponse} from 'next/server';
import type {NextRequest} from 'next/server';

const PUBLIC_PATHS = ['/login', '/signup'];

function getRoleFromToken(token: string | undefined): string | null {
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    // Base64URL decode compatible with Edge runtime (no Node Buffer)
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const jsonString = atob(padded);
    const json = JSON.parse(jsonString);
    return (json?.role as string) || null;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const {pathname} = request.nextUrl;
  const authToken = request.cookies.get('AuthToken')?.value;
  const role = getRoleFromToken(authToken);
  // Align server middleware behavior with client default: if a token exists but
  // has no explicit role claim yet, treat the user as 'student'. This avoids
  // redirect loops for newly created users before claims propagate.
  const effectiveRole = authToken ? (role || 'student') : null;

  // Handle the homepage explicitly to avoid client/server redirect loops
  if (pathname === '/') {
    if (authToken) {
      const dest = effectiveRole === 'admin' ? '/admin' : effectiveRole === 'formateur' ? '/formateur' : '/student/dashboard';
      return NextResponse.redirect(new URL(dest, request.url));
    }
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const isPublicPath = PUBLIC_PATHS.includes(pathname);

  if (isPublicPath) {
    // If user is logged in and tries to access a public path, redirect to home.
    if (authToken) {
      const dest = effectiveRole === 'admin' ? '/admin' : effectiveRole === 'formateur' ? '/formateur' : '/student/dashboard';
      return NextResponse.redirect(new URL(dest, request.url));
    }
    // Otherwise, allow access to public path.
    return NextResponse.next();
  }

  // If path is not public and there's no token, redirect to login.
  if (!authToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname); // Optionally redirect back after login
    return NextResponse.redirect(loginUrl);
  }

  // Role-based gates
  if (pathname.startsWith('/admin') && effectiveRole !== 'admin') {
    const dest = effectiveRole === 'formateur' ? '/formateur' : '/student/dashboard';
    return NextResponse.redirect(new URL(dest, request.url));
  }
  if (pathname.startsWith('/formateur') && effectiveRole !== 'formateur') {
    const dest = effectiveRole === 'admin' ? '/admin' : '/student/dashboard';
    return NextResponse.redirect(new URL(dest, request.url));
  }
  if (pathname.startsWith('/student') && effectiveRole !== 'student') {
    const dest = effectiveRole === 'admin' ? '/admin' : (effectiveRole === 'formateur' ? '/formateur' : '/login');
    return NextResponse.redirect(new URL(dest, request.url));
  }

  // If all checks pass, allow the request to proceed.
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Exclude Next internals and static locales to avoid blocking assets & i18n
    '/((?!api|_next|locales|favicon.ico).*)',
  ],
};
