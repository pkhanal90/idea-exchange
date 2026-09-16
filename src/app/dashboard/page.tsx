import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function DashboardIndexPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin?callbackUrl=/dashboard");

  if (session.user.role === "ADMIN") redirect("/admin");
  if (session.user.role === "INVESTOR") redirect("/dashboard/investor");
  if (session.user.role === "BUYER") redirect("/dashboard/buyer");
  redirect("/dashboard/seller");
}
