import { redirect } from "next/navigation";
export const dynamic = "force-dynamic";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export default async function StrategiesPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  // Instantly redirect them to the Visual Dify Workspace API Tools
  redirect("https://dify.imaginos.ai/tools?category=api");
}
