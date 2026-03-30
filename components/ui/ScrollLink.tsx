'use client';

/**
 * ScrollLink — client component for smooth-scroll anchor navigation.
 * Supports both mouse clicks and keyboard activation (Enter/Space).
 * Falls back to native anchor behavior if JavaScript is unavailable.
 */
interface ScrollLinkProps {
  readonly targetId: string;
  readonly className?: string;
  readonly children: React.ReactNode;
}

export function ScrollLink({ targetId, className, children }: ScrollLinkProps) {
  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement> | React.KeyboardEvent<HTMLAnchorElement>) => {
    // Only handle Enter/Space for keyboard events
    if ('key' in e && e.key !== 'Enter' && e.key !== ' ') {
      return;
    }

    e.preventDefault();
    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Move focus to target for screen reader announcements
      el.setAttribute('tabindex', '-1');
      el.focus({ preventScroll: true });
    }
  };

  return (
    <a
      href={`#${targetId}`}
      className={className}
      onClick={handleScroll}
      onKeyDown={handleScroll}
    >
      {children}
    </a>
  );
}
