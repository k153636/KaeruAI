"use client";

import { useRouter, usePathname } from "next/navigation";
import { IconSparkle, IconClock, IconUser } from "@/components/icons";

const TABS = [
  { href: "/main",    label: "企画",       Icon: IconSparkle },
  { href: "/history", label: "履歴",       Icon: IconClock   },
  { href: "/profile", label: "プロフィール", Icon: IconUser    },
];

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 sm:hidden z-50 flex items-stretch"
      style={{
        background: "rgba(9,9,11,0.88)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {TABS.map(({ href, label, Icon }) => {
        const active = pathname === href;
        return (
          <button
            key={href}
            onClick={() => router.push(href)}
            className="flex flex-col items-center justify-center gap-1 flex-1 py-2.5 cursor-pointer transition-opacity active:opacity-60"
          >
            <Icon size={22} className={active ? "text-white" : "text-white/30"} />
            <span
              className="font-medium"
              style={{ fontSize: 10, color: active ? "rgba(255,255,255,1)" : "rgba(255,255,255,0.3)" }}
            >
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
