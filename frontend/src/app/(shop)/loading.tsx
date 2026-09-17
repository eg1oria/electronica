import { Container } from "@/components/ui";

export default function Loading() {
  return (
    <Container className="pt-8" aria-busy="true">
      <div className="h-9 w-56 animate-pulse rounded-btn bg-surface" />
      <div className="mt-8 grid grid-cols-1 gap-6 min-[480px]:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i}>
            <div className="aspect-square animate-pulse rounded-card bg-surface" />
            <div className="mt-4 h-4 w-3/4 animate-pulse rounded bg-surface" />
            <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-surface" />
          </div>
        ))}
      </div>
    </Container>
  );
}
