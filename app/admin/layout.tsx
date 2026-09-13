import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'NAMORA Operations Admin Portal',
  description: 'Internal operations, fulfillment, catalog, and order management portal.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
