import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BackLink({ href }: { href: string }) {
  return (
    <Button variant="ghost" size="sm" className="-ml-2" asChild>
      <Link href={href}>
        <ArrowLeft data-icon="inline-start" />
        Back
      </Link>
    </Button>
  );
}
