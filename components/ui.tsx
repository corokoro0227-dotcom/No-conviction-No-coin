import type { ButtonHTMLAttributes, ReactNode } from "react";

export function Screen({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-5 pb-10 pt-6 sm:max-w-xl sm:px-8 sm:pt-10">
      {children}
    </div>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-mist">
      {children}
    </p>
  );
}

export function Title({ children }: { children: ReactNode }) {
  return (
    <h1 className="mt-3 text-[1.75rem] font-semibold leading-[1.15] tracking-[-0.03em] text-paper sm:text-[2.15rem]">
      {children}
    </h1>
  );
}

export function Body({ children }: { children: ReactNode }) {
  return <p className="mt-4 max-w-prose text-[15px] leading-relaxed text-mist">{children}</p>;
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  href?: never;
};

export function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}: ButtonProps) {
  const styles = {
    primary:
      "bg-signal text-void hover:bg-signal-hot disabled:bg-line disabled:text-mist",
    secondary:
      "border border-line bg-ink text-paper hover:border-paper/20 hover:bg-ink-2 disabled:text-mist",
    ghost: "text-mist hover:text-paper disabled:text-line",
  }[variant];

  return (
    <button
      type="button"
      className={`inline-flex h-12 w-full items-center justify-center gap-2 rounded-md px-4 text-[13px] font-medium tracking-[-0.01em] transition-colors disabled:cursor-not-allowed ${styles} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function CheckboxRow({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  children: ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-md border border-line bg-ink px-3.5 py-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 accent-signal"
      />
      <span className="text-[13px] leading-relaxed text-paper/90">{children}</span>
    </label>
  );
}
