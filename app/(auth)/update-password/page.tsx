import { redirect } from "next/navigation";

import { PASSWORD_RESET_PATH } from "@/lib/auth/callback-destination";

/** Legacy route — password reset lives at /auth/reset-password. */
export default function UpdatePasswordRedirectPage() {
  redirect(PASSWORD_RESET_PATH);
}
