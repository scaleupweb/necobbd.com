import { redirect } from "next/navigation";

// Email verification isn't part of the sign-up flow; keep old links working.
export default function VerifyEmailPage() {
  redirect("/dashboard");
}
