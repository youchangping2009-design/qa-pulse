import type { ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const NAV = [
  { href: "/trends/weekly", label: "本周" },
  { href: "/trends/monthly", label: "本月" },
  { href: "/projects", label: "全部" },
  { href: "/marks", label: "我的标记" },
  { href: "/settings", label: "设置" },
];

export function SiteHeader() {
  return (
    <header className="border-b bg-card/80">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link
          href="/trends/weekly"
          className="font-heading text-lg font-semibold"
        >
          QA Pulse
        </Link>
        <nav className="flex flex-wrap items-center gap-1">
          {NAV.map((item) => (
            <Button
              key={item.href}
              variant="ghost"
              size="sm"
              nativeButton={false}
              render={<Link href={item.href} />}
            >
              {item.label}
            </Button>
          ))}
        </nav>
      </div>
    </header>
  );
}

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-full">
      <SiteHeader />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </div>
    </div>
  );
}
