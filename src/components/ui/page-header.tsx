import type { ReactNode } from "react";

import { Kicker } from "@/components/ui/kicker";

export function PageHeader({
  kicker,
  title,
  description,
  actions,
}: {
  kicker: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-3">
        <Kicker>{kicker}</Kicker>
        <h1 className="font-display text-4xl leading-tight text-text sm:text-5xl">
          {title}
        </h1>
        {description ? (
          <p className="max-w-2xl text-base leading-7 text-text-muted">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </div>
  );
}
