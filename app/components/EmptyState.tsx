import { Card, CardContent } from "@/components/ui/card";

export default function EmptyState({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Card className="border-dashed shadow-none">
      <CardContent className="py-12 text-center text-muted-foreground">
        {children}
      </CardContent>
    </Card>
  );
}
