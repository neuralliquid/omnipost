import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Log In',
  description: 'Log in to your OmniPost account to manage and publish content across all your platforms.',
};

export default function LoginLayout({ children }: { readonly children: React.ReactNode }) {
  return children;
}
