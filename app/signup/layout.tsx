import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign Up',
  description:
    'Create your free OmniPost account. Publish to Facebook, Instagram, LinkedIn, and Twitter from one place.',
};

export default function SignupLayout({ children }: { readonly children: React.ReactNode }) {
  return children;
}
