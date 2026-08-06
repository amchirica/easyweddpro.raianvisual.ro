import {
  SkeletonCardGrid,
  SkeletonPageHeader,
  SkeletonStatGrid,
  SkeletonTable,
} from "@/components/shared/loading-skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      <SkeletonPageHeader />
      <SkeletonStatGrid count={4} />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <SkeletonTable rows={6} />
        </div>
        <div className="space-y-6">
          <SkeletonCardGrid count={2} />
        </div>
      </div>
    </div>
  );
}
