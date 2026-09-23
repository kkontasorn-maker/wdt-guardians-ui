import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { NotFoundCopy } from "@/components/not-found-copy";
import { LocaleProvider } from "@/lib/localeContext";

export default function NotFound() {
  return (
    <LocaleProvider>
      <div className="flex min-h-screen flex-col bg-brand-wash">
        <SiteHeader />
        <NotFoundCopy />
        <SiteFooter />
      </div>
    </LocaleProvider>
  );
}
