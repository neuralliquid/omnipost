/**
 * Global Loading Component for App Router
 * Displayed automatically during route transitions
 */

export default function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <output className="flex flex-col items-center gap-4" aria-label="Loading" aria-live="polite">
        {/* Spinner */}
        <div className="relative">
          <div className="h-12 w-12 rounded-full border-4 border-muted" />
          <div className="absolute top-0 left-0 h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        </div>

        {/* Loading text */}
        <p className="text-sm text-muted-foreground">Loading...</p>
      </output>
    </main>
  );
}
