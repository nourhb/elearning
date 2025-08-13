
import {NextResponse} from 'next/server';
import type {NextRequest} from 'next/server';

const PUBLIC_PATHS = ['/login', '/signup'];

export async function middleware(request: NextRequest) {
  const {pathname} = request.nextUrl;
  const authToken = request.cookies.get('AuthToken')?.value;

  const isPublicPath = PUBLIC_PATHS.includes(pathname);

  if (isPublicPath) {
    // If user is logged in and tries to access a public path, redirect to home.
    if (authToken) {
      return NextResponse.redirect(new URL('/', request.url));
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

  // If all checks pass, allow the request to proceed.
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Exclude Next internals and static locales to avoid blocking assets & i18n
    '/((?!api|_next|locales|favicon.ico).*)',
  ],
};
