"use server";

import { signIn, signOut } from "@/auth";
import { safeCallbackUrl } from "@/lib/auth/callback-url";

export async function signInWithGoogle(formData: FormData) {
  const callbackUrl = safeCallbackUrl(
    String(formData.get("callbackUrl") ?? ""),
  );

  await signIn("google", { redirectTo: callbackUrl });
}

export async function signOutToHome() {
  await signOut({ redirectTo: "/" });
}
