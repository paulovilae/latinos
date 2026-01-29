import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { fetchUsers } from "@/lib/api";
import { UserManager } from "@/components/UserManager";
import { LocalizedText } from "@/components/LocalizedText";
import { SectionCard } from "@/components/SectionCard";

export default async function UsersPage() {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== "admin") {
    redirect("/dashboard");
  }

  const users = await fetchUsers();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-white"><LocalizedText id="usersTitle" fallback="User Management" /></h1>
        <p className="text-slate-400">Administer platform users and permissions.</p>
      </div>

      <SectionCard
        id="users"
        title={<LocalizedText id="usersTitle" fallback="User management" />}
        description={<LocalizedText id="usersDescription" fallback="Invite teammates, toggle MFA, and prune accounts." />}
      >
        <UserManager initialUsers={users} />
      </SectionCard>
    </div>
  );
}
