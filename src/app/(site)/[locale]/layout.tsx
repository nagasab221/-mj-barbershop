import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { Inter, Playfair_Display, Tajawal } from 'next/font/google';

import { isAppLocale } from '@/i18n/routing';
import '@/app/globals.css';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap'
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap'
});

const tajawal = Tajawal({
  subsets: ['arabic', 'latin'],
  weight: ['300', '400', '500', '700', '800'],
  variable: '--font-tajawal',
  display: 'swap'
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export async function generateMetadata({
  params: { locale }
}: {
  params: { locale: string };
}): Promise<Metadata> {
  if (!isAppLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: 'meta' });

  return {
    metadataBase: new URL(SITE_URL),
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical: `/${locale}`,
      languages: { en: '/en', ar: '/ar' }
    },
    openGraph: {
      title: t('title'),
      description: t('description'),
      url: `/${locale}`,
      siteName: 'MJ Barbershop',
      locale: locale === 'ar' ? 'ar_AE' : 'en_AE',
      type: 'website'
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description')
    }
  };
}

export default async function LocaleLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!isAppLocale(locale)) notFound();
  setRequestLocale(locale);

  const messages = await getMessages();
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${playfair.variable} ${inter.variable} ${tajawal.variable}`}
    >
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
