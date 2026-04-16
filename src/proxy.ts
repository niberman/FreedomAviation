import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname, hostname } = request.nextUrl;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  if (process.env.NODE_ENV === 'production') {
    const CANONICAL = 'www.freedomaviationco.com';

    if (
      hostname !== CANONICAL &&
      hostname !== 'localhost' &&
      !hostname.includes('vercel.app')
    ) {
      const url = request.nextUrl.clone();
      url.hostname = CANONICAL;
      return NextResponse.redirect(url, 301);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
