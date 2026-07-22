import { FeedCardSkeleton } from '@/components/ui/skeleton';

export default function FeedLoading() {
  return (
    <div className="min-h-[100dvh] bg-surface-base">
      <div className="h-[57px] border-b border-border bg-surface-base/80" />
      <main className="mx-auto max-w-lg pb-20">
        {Array.from({ length: 6 }).map((_, i) => (
          <FeedCardSkeleton key={i} />
        ))}
      </main>
    </div>
  );
}
