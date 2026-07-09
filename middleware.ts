import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Statik dosyalar, API ve Next içi yollar hariç her şey
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
