import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

type Props = {
    title: string;
    href: string;
    children: React.ReactNode;
    className?: string;
};

export function WidgetCard({ title, href, children, className = "" }: Props) {
    return (
        <section className={`rounded-xl border bg-white p-5 shadow-sm ${className}`}>
            <header className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-medium text-neutral-500">{title}</h2>
                <Link href={href} className="text-neutral-400 hover:text-neutral-900">
                    <ArrowUpRight size={16} />
                </Link>
            </header>
            {children}
        </section>
    );
}