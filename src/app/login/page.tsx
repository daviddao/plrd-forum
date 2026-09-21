export const metadata = { title: "Log In" };

const errorMessages: Record<string, string> = {
  email: "Please enter a valid email address.",
  unavailable: "Email sign-in is unavailable right now. Try again or use your ATProto handle below.",
  resolve: "Couldn't resolve that handle. Check the spelling and try again.",
  missing: "Please enter your ATProto handle.",
  callback: "Authorization failed. Please try again.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; method?: string }>;
}) {
  const { error, method } = await searchParams;
  const handleSelected = method === "handle" || error === "resolve" || error === "missing";
  const errorMessage = error && Object.hasOwn(errorMessages, error) ? errorMessages[error] : undefined;

  return (
    <div className="mx-auto mt-12 max-w-[400px]">
      <div className="lw-card px-8 py-10">
        <h1 className="serif-title pb-1 text-[26px]">Log In</h1>
        <p className="pb-6 text-[14px] text-text-dim3">
          Join the conversation. Your account and posts stay yours on ATProto.
        </p>
        {errorMessage && (
          <p id="login-error" role="alert" className="pb-4 text-[13.5px] text-error">
            {errorMessage}
          </p>
        )}
        <form action="/oauth/login" method="post" className="flex flex-col gap-3">
          <input type="hidden" name="method" value="email" />
          <label htmlFor="email" className="text-[14px] text-text-dim2">Email address</label>
          <input
            id="email"
            type="email"
            name="email"
            placeholder="you@example.com"
            autoComplete="email"
            autoCapitalize="none"
            autoCorrect="off"
            required
            aria-invalid={error === "email" || undefined}
            aria-describedby={error === "email" ? "login-error email-help" : "email-help"}
            className="rounded-sm border border-grey-300 bg-transparent px-3 py-2 text-[15px] outline-none focus:border-primary"
          />
          <button
            type="submit"
            className="cursor-pointer rounded-sm bg-primary px-4 py-2 text-[13.5px] font-semibold uppercase tracking-wide text-white hover:opacity-90"
          >
            Continue with email
          </button>
          <p id="email-help" className="text-[13.5px] text-text-dim3">
            No password needed. Continue to our ePDS provider to verify your email
            and sign in or create an account.
          </p>
        </form>

        <details className="login-alternative" open={handleSelected}>
          <summary>Use an ATProto handle instead</summary>
          <form action="/oauth/login" method="post" className="flex flex-col gap-3">
            <input type="hidden" name="method" value="handle" />
            <label htmlFor="handle" className="text-[14px] text-text-dim2">ATProto handle</label>
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
              aria-invalid={(error === "resolve" || error === "missing") || undefined}
              aria-describedby={handleSelected && errorMessage ? "login-error handle-help" : "handle-help"}
              className="rounded-sm border border-grey-300 bg-transparent px-3 py-2 text-[15px] outline-none focus:border-primary"
            />
            <button type="submit" className="login-handle-submit">
              Continue with handle
            </button>
            <p id="handle-help" className="text-[13.5px] text-text-dim3">
              Use your existing Bluesky or other ATProto account. Your provider
              handles sign-in.
            </p>
          </form>
        </details>
      </div>
    </div>
  );
}
