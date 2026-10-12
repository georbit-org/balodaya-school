import type { Metadata } from 'next';
import { Newsreader, Hanken_Grotesk, Noto_Serif_Devanagari } from 'next/font/google';
import './globals.css';
import { SCHOOL_INFO } from '@/content/school';
import { ToastProvider } from '@/components/ui/Toast';
import { getThemeConfig, generateThemeCss } from '@/server/theme';

const newsreader = Newsreader({
  subsets: ['latin'],
  weight: ['500', '600'],
  variable: '--font-newsreader',
  display: 'swap',
  style: ['normal'],
});

const hankenGrotesk = Hanken_Grotesk({
  subsets: ['latin'],
  variable: '--font-hanken',
  display: 'swap',
});

const notoSerifDevanagari = Noto_Serif_Devanagari({
  subsets: ['devanagari'],
  weight: ['400', '600'],
  variable: '--font-noto-serif-deva',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    template: `%s | ${SCHOOL_INFO.name}`,
    default: `${SCHOOL_INFO.name} | Sundar Bazar, Bheerkot-06, Syangja, Nepal`,
  },
  description: `${SCHOOL_INFO.name} (Estd. ${SCHOOL_INFO.establishedBS}) in ${SCHOOL_INFO.location.address}, ${SCHOOL_INFO.location.district}. ${SCHOOL_INFO.motto}.`,
  metadataBase: new URL('https://balodaya.edu.np'),
  icons: {
    icon: SCHOOL_INFO.logo,
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const theme = await getThemeConfig();
  const themeCss = generateThemeCss(theme);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: SCHOOL_INFO.name,
    alternateName: SCHOOL_INFO.shortName,
    url: 'https://balodaya.edu.np',
    logo: `https://balodaya.edu.np${SCHOOL_INFO.logo}`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: SCHOOL_INFO.location.address,
      addressLocality: SCHOOL_INFO.location.municipality,
      addressRegion: SCHOOL_INFO.location.district,
      addressCountry: 'NP',
    },
    telephone: SCHOOL_INFO.contact.phone,
    email: SCHOOL_INFO.contact.email,
  };

  return (
    <html
      lang="en"
      className={`${newsreader.variable} ${hankenGrotesk.variable} ${notoSerifDevanagari.variable}`}
    >
      <head>
        <style id="theme-vars" dangerouslySetInnerHTML={{ __html: themeCss }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
