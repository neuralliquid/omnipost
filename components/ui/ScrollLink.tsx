'use client';

/**
 * ScrollLink — client component for smooth-scroll anchor navigation.
 */
interface ScrollLinkProps {
  readonly targetId: string;
  readonly className?: string;
  readonly children: React.ReactNode;
}

export function ScrollLink({ targetId, className, children }: ScrollLinkProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <a href={`#${targetId}`} className={className} onClick={handleClick}>
      {children}
    </a>
  );
}
