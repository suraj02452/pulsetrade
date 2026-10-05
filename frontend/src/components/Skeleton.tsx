export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton rounded-lg ${className}`} />;
}

export function SkeletonRow() {
  return (
    <tr className="border-b border-bg-border">
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <Skeleton className="w-8 h-8 rounded-full" />
          <div className="space-y-1">
            <Skeleton className="w-16 h-4" />
            <Skeleton className="w-12 h-3" />
          </div>
        </div>
      </td>
      <td className="py-3 px-4 text-right">
        <Skeleton className="w-20 h-4 ml-auto" />
      </td>
      <td className="py-3 px-4 text-right">
        <Skeleton className="w-14 h-4 ml-auto" />
      </td>
      <td className="py-3 px-4 hidden md:table-cell">
        <Skeleton className="w-16 h-4 ml-auto" />
      </td>
      <td className="py-3 px-4 hidden sm:table-cell">
        <Skeleton className="w-20 h-7 ml-auto" />
      </td>
      <td className="py-3 px-4 text-center">
        <Skeleton className="w-6 h-6 mx-auto" />
      </td>
    </tr>
  );
}
