const LOGIN_ERROR_MESSAGES: Record<string, string> = {
  AccessDenied:
    "This Google account is not approved for Tatari internal access.",
  Configuration: "Sign-in is not configured.",
  OAuthCallback: "Google sign-in could not be completed. Try again.",
  OAuthSignin: "Google sign-in could not be started. Try again.",
  Callback: "Google sign-in could not be completed. Try again.",
};

const DEFAULT_LOGIN_ERROR = "We could not sign you in. Try again.";

export function loginErrorMessage(error: string | null | undefined): string {
  if (!error) {
    return DEFAULT_LOGIN_ERROR;
  }

  return LOGIN_ERROR_MESSAGES[error] ?? DEFAULT_LOGIN_ERROR;
}
