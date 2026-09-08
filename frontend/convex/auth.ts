import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import Brevo from "./brevo";

// Password reset emails are sent via Brevo (AUTH_BREVO_API_KEY + AUTH_BREVO_FROM).
export const { auth, signIn, signOut, store } = convexAuth({
  providers: [Password({ reset: Brevo })],
});