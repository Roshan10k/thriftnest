export function SkeletonCard() {
  return (
    <div className="bg-thrift-surface border border-thrift-border rounded-card overflow-hidden">
      <div className="aspect-[4/3] skeleton" />
      <div className="p-4 space-y-3">
        <div className="h-4 w-3/4 skeleton rounded" />
        <div className="h-6 w-1/2 skeleton rounded" />
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full skeleton" />
          <div className="h-3 w-20 skeleton rounded" />
        </div>
        <div className="flex justify-between">
          <div className="h-3 w-16 skeleton rounded" />
          <div className="h-3 w-12 skeleton rounded" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center p-4 border-b border-thrift-border">
      <div className="w-12 h-12 rounded skeleton mr-4" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-1/3 skeleton rounded" />
        <div className="h-3 w-1/4 skeleton rounded" />
      </div>
      <div className="h-8 w-20 skeleton rounded" />
    </div>
  );
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`h-4 skeleton rounded ${i === lines - 1 ? 'w-2/3' : 'w-full'}`}
        />
      ))}
    </div>
  );
}
