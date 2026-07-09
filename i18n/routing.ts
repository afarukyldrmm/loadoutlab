import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
  locales: ['en', 'ru', 'tr'],
  defaultLocale: 'en',
  // 'as-needed': varsayılan dil (EN) prefix'siz — loadoutlab.com/ = İngilizce,
  // /ru ve /tr ile diğer diller. Mevcut linkler kırılmaz.
  localePrefix: 'as-needed',
});

export type Locale = (typeof routing.locales)[number];

export const { Link, redirect, usePathname, useRouter } =
  createNavigation(routing);
