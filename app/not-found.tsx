import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-brand-wash">
      <SiteHeader />
      <div className="mx-auto w-full max-w-lg flex-1 px-4 py-20 text-center sm:px-6">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-slate">404</p>
        <h1 className="mt-2 text-3xl font-extrabold">That trail is not on our map.</h1>
        <p className="mt-3 text-muted-foreground">
          The page you wanted is missing. Head back to the Guardians program or the member portal.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild>
            <Link href="/">Guardians home</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/manage">Member portal</Link>
          </Button>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
