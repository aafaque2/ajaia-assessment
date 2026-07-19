import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SignupForm } from "./signup-form";

export default async function SignupPage() {
  const session = await auth();

  if (session) {
    redirect("/documents");
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignupForm />
    </div>
  );
}
