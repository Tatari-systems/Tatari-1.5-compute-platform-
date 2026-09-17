import type { HTMLAttributes } from "react";

import { cx } from "@/lib/ui/cx";

export function Kicker({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cx(
        "font-brand text-xs font-semibold uppercase tracking-[0.28em] text-text-faint",
        className,
      )}
      {...props}
    />
  );
}
