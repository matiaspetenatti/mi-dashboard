"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { modules } from "@/lib/modules";

export function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="hidden md:flex w-56 shrink-0 flex-col gap-1 border-r p-3">
            <div className="px-3 py-4 text-lg font-semibold">Mi dashboard</div>
            {modules.map(({ slug, label, href, icon: Icon }) => {
                const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
                return (
                    <Link
                        key={slug}
                        href={href}
                        className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${active ? "bg-neutral-900 text-white" : "hover:bg-neutral-100"
                            }`}
                    >
                        <Icon size={18} />
                        {label}
                    </Link>
                );
            })}
        </aside>
    );
}