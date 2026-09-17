import Image from "next/image";

import { cx } from "@/lib/ui/cx";

export function TatariLogo({
  size = 32,
  className,
  priority = false,
}: {
  size?: number;
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src="/tatari-logo.jpg"
      alt="Tatari"
      width={size}
      height={size}
      priority={priority}
      className={cx("shrink-0 object-contain", className)}
    />
  );
}
