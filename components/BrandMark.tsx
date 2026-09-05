import Link from "next/link";

type BrandMarkProps = {
  href?: string;
  compact?: boolean;
};

export function BrandMark({ href, compact = false }: BrandMarkProps) {
  const inner = (
    <>
      <span
        aria-hidden
        className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border border-signal/70 bg-signal/10"
      >
        <span className="h-1.5 w-1.5 rounded-[1px] bg-signal" />
      </span>
      <span className={compact ? "sr-only sm:not-sr-only" : undefined}>
        <span className="block text-[11px] font-medium uppercase tracking-[0.22em] text-paper">
          No conviction
        </span>
        <span className="block text-[11px] font-medium uppercase tracking-[0.22em] text-mist">
          No coin
        </span>
      </span>
    </>
  );

  const className = "inline-flex items-start gap-2.5";

  if (href) {
    return (
      <Link href={href} className={className}>
        {inner}
      </Link>
    );
  }

  return <div className={className}>{inner}</div>;
}
