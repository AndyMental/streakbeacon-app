import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      role="status"
      aria-busy="true"
      aria-live="polite"
      data-testid="dashboard-loading"
      className="min-h-screen bg-background px-5 py-10 text-foreground"
    >
      <span className="sr-only">Loading StreakBeacon</span>
      <div
        aria-hidden="true"
        className="mx-auto flex w-full max-w-3xl flex-col gap-6"
      >
        <Card>
          <CardHeader className="gap-3 border-b">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-8 w-3/4" />
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <Skeleton className="h-4 w-full" />
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 35 }).map((_, index) => (
                <Skeleton key={index} className="aspect-square w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="gap-3 border-b">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-6 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-2/3" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="gap-3 border-b">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-6 w-2/5" />
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 7 }).map((_, index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
