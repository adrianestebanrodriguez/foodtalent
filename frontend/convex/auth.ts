import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import Resend from "@auth/core/providers/resend";

// AUTH_RESEND_KEY must be set in the Convex dashboard for password-reset emails.
export const { auth, signIn, signOut, store } = convexAuth({
  providers: [Password({ reset: Resend }), Resend],
});
