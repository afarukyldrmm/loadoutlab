import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'LoadoutLab — CS2 Skin Önerileri',
  description:
    'Bütçene ve tarzına göre CS2 loadout önerileri. Tüm marketlerden en uygun fiyatlarla.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
