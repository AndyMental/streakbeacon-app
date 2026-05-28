import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5 py-10 text-foreground">
      <Card className="w-full max-w-md">
        <CardHeader className="gap-3 border-b">
          <div className="h-4 w-28 animate-pulse rounded bg-muted" />
          <div className="h-8 w-3/4 animate-pulse rounded bg-muted" />
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="h-4 w-full animate-pulse rounded bg-muted" />
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }).map((_, index) => (
              <div
                key={index}
                className="aspect-square animate-pulse rounded bg-muted"
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
