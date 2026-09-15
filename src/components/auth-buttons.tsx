import { signInWithGoogle, signOutToHome } from "@/lib/auth/actions";

export function GoogleSignInButton({ callbackUrl }: { callbackUrl: string }) {
  return (
    <form action={signInWithGoogle}>
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <button
        type="submit"
        className="rounded-control bg-accent-strong px-4 py-2.5 text-sm font-medium text-text transition-colors hover:bg-accent"
      >
        Continue with Google
      </button>
    </form>
  );
}

export function SignOutButton({ label = "Sign out" }: { label?: string }) {
  return (
    <form action={signOutToHome}>
      <button
        type="submit"
        className="text-sm text-accent transition-colors hover:text-text"
      >
        {label}
      </button>
    </form>
  );
}
