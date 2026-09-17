export default function Loading() {
  return (
    <div aria-busy="true">
      <div className="h-9 w-48 animate-pulse rounded-btn bg-surface" />
      <div className="mt-8 h-80 animate-pulse rounded-card bg-surface" />
    </div>
  );
}
