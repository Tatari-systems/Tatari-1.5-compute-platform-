"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { SignOutButton } from "@/components/auth-buttons";
import { TatariLogo } from "@/components/tatari-logo";

export function ConsoleChrome({
  email,
  children,
}: {
  email: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-bg/80 backdrop-blur-[20px]">
        <div className="flex h-16 items-center px-4 sm:px-6 lg:px-8">
          <Link href="/quotes" className="flex items-center gap-3">
            <TatariLogo size={32} priority />
            <span className="font-brand text-lg font-bold tracking-tight text-text">
              Tatari
            </span>
          </Link>
          <div className="ml-auto flex items-center gap-4">
            <span className="hidden max-w-[14rem] truncate text-[13px] font-light text-white/50 sm:block">
              {email}
            </span>
            <SignOutButton />
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
