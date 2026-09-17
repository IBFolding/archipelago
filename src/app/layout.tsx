import type { Metadata, Viewport } from 'next';
import './globals.css';
import { asset } from '@/lib/paths';

export const metadata: Metadata = {
  title: 'ARCHipelago — $ISLAND',
  description:
    'Buy your own island. Land on it with nothing, build it out, and try not to get eaten. $ISLAND on ARC.',
  openGraph: {
    title: 'ARCHipelago — $ISLAND',
    description: 'Kick back. Relax. Let the degens cook.',
    images: [asset('/assets/hero-reference.png')],
  },
  icons: { icon: asset('/assets/archipelago-logo.png') },
};

export const viewport: Viewport = {
  themeColor: '#022f4f',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
