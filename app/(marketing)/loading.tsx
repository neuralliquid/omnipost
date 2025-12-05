/**
 * Marketing Loading State
 * Displayed while marketing routes are loading
 */

export default function MarketingLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="space-y-4 text-center">
        <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}
