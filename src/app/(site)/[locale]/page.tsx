import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

import { isAppLocale } from '@/i18n/routing';
import { getSiteContent } from '@/lib/content';
import { t as pick, type Locale, type SiteContent } from '@/lib/types';

import Header from '@/components/Header';
import Hero from '@/components/Hero';
import About from '@/components/About';
import Services from '@/components/Services';
import Reservations from '@/components/Reservations';
import LocationSection from '@/components/LocationSection';
import Gallery from '@/components/Gallery';
import Testimonials from '@/components/Testimonials';
import Contact from '@/components/Contact';
import Footer from '@/components/Footer';
import FloatingCTA from '@/components/FloatingCTA';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

// Content lives in Supabase and is edited via /admin, render on every
// request so changes appear immediately.
export const dynamic = 'force-dynamic';

const SCHEMA_DAYS: Record<string, string> = {
  sunday: 'Sunday',
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday'
};

/** LocalBusiness structured data for local SEO. */
function buildJsonLd(content: SiteContent, locale: Locale) {
  const { site, location, reservation } = content;
  return {
    '@context': 'https://schema.org',
    '@type': 'HairSalon',
    name: 'MJ Barbershop',
    description: pick(site.heroSubtitle, locale),
    url: `${SITE_URL}/${locale}`,
    telephone: site.phone,
    email: site.email,
    priceRange: 'AED 40 - AED 180',
    address: {
      '@type': 'PostalAddress',
      streetAddress: pick(location.address, locale),
      addressLocality: 'Al Shamkha',
      addressRegion: 'Abu Dhabi',
      addressCountry: 'AE'
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: location.lat,
      longitude: location.lng
    },
    areaServed: { '@type': 'City', name: 'Abu Dhabi' },
    availableService: { '@type': 'Service', serviceType: 'Mobile barber, home visits' },
    openingHoursSpecification: reservation.workingHours
      .filter((h) => !h.closed && h.open && h.close)
      .map((h) => ({
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: SCHEMA_DAYS[h.day],
        opens: h.open,
        closes: h.close
      })),
    sameAs: [site.instagram, site.tiktok].filter(Boolean)
  };
}

export default async function HomePage({
  params: { locale }
}: {
  params: { locale: string };
}) {
  if (!isAppLocale(locale)) notFound();
  setRequestLocale(locale);

  const content = await getSiteContent();
  const loc = locale as Locale;

  return (
    <>
      <Header />
      <main>
        <Hero site={content.site} locale={loc} />
        <About site={content.site} locale={loc} />
        <Services packages={content.packages} locale={loc} studioOpen={content.reservation.studioOpen} />
        <Reservations content={content} locale={loc} />
        <LocationSection location={content.location} site={content.site} locale={loc} />
        <Gallery items={content.gallery} locale={loc} />
        <Testimonials items={content.testimonials} locale={loc} />
        <Contact site={content.site} locale={loc} />
      </main>
      <Footer content={content} locale={loc} />
      <FloatingCTA whatsapp={content.site.whatsapp} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildJsonLd(content, loc)) }}
      />
    </>
  );
}
