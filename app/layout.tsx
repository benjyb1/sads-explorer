import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SADs Explorer — Suffering-Adjusted Days in Farmed Animals',
  description:
    'An interactive data visualisation tool for exploring Suffering-Adjusted Days (SADs) across farmed animal species globally. Built for animal welfare researchers, policy makers and NGOs.',
  openGraph: {
    title: 'SADs Explorer',
    description: 'Interactive dashboard for exploring animal suffering data',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-[#0d1117] text-[#e6edf3]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
