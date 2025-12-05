/**
 * Marketing Layout
 * Layout for public-facing marketing pages (landing, about, etc.)
 */

import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  );
}
