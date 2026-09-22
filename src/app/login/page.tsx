import Link from "next/link";
import { SITE_NAME, SITE_ORG } from "@/lib/site";

export const metadata = { title: "Sign in" };

const errorMessages: Record<string, string> = {
  email: "Please enter a valid email address.",
  unavailable: "Email sign-in is unavailable right now. Try again or use your ATProto handle below.",
  resolve: "Couldn't resolve that handle. Check the spelling and try again.",
  missing: "Please enter your ATProto handle.",
  callback: "Authorization failed. Please try again.",
};

/**
 * Standalone sign-in screen, ported from the Open Lab login
 * (open-lab-two.vercel.app/lab, `.lab-login` rules in globals.css).
 * Lives outside the `(shell)` route group so there is no header or nav.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; method?: string }>;
}) {
  const { error, method } = await searchParams;
  const handleSelected = method === "handle" || error === "resolve" || error === "missing";
  const errorMessage = error && Object.hasOwn(errorMessages, error) ? errorMessages[error] : undefined;
  const emailInvalid = error === "email" || error === "unavailable";
  const handleInvalid = error === "resolve" || error === "missing";

  return (
    <main className="lab-login" aria-labelledby="lab-login-title">
      <section className="lab-login-card">
        <Link href="/" className="lab-login-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/pl_logo_mark.svg" alt="" />
          <span>
            {SITE_NAME}
            <small>BY {SITE_ORG}</small>
          </span>
        </Link>

        <h1 id="lab-login-title">Sign in to {SITE_NAME}</h1>
        <p>Use your email or ATProto account to join the lab.</p>

        {errorMessage && (
          <p id="login-error" role="alert">
            {errorMessage}
          </p>
        )}

        <form action="/oauth/login" method="post">
          <input type="hidden" name="method" value="email" />
          <label htmlFor="email">
            Your email
            <input
              id="email"
              type="email"
              name="email"
              placeholder="you@example.com"
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
              required
              aria-invalid={emailInvalid || undefined}
              aria-describedby={emailInvalid ? "login-error email-help" : "email-help"}
            />
          </label>
          <button type="submit">Continue with email ↗</button>
          <p id="email-help" className="lab-login-note">
            No password needed. We send a one-time code to verify your email and
            sign you in, or create an account if you do not have one.
          </p>
        </form>

        <details className="lab-login-alt" open={handleSelected}>
          <summary>Use an ATProto handle instead</summary>
          <form action="/oauth/login" method="post">
            <input type="hidden" name="method" value="handle" />
            <label htmlFor="handle">
              Your ATProto handle
              <input
                id="handle"
                type="text"
                name="handle"
                placeholder="you.bsky.social"
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                required
                aria-invalid={handleInvalid || undefined}
                aria-describedby={handleInvalid ? "login-error handle-help" : "handle-help"}
              />
            </label>
            <button type="submit" className="lab-login-secondary">
              Continue with handle ↗
            </button>
            <p id="handle-help" className="lab-login-note">
              Works with Bluesky and any other ATProto provider. You approve the
              sign-in there.
            </p>
          </form>
        </details>

        <p className="lab-login-note">
          We never ask for your password here. Nothing is published automatically.
        </p>
        <p className="lab-login-note">
          No account?{" "}
          <a href="https://bsky.app/" target="_blank" rel="noopener noreferrer">
            Create one on Bluesky ↗
          </a>
        </p>
      </section>
    </main>
  );
}
