"use client";

import { FormEvent, useEffect, useState } from "react";

import { clientApiFetch } from "@/lib/clientApi";
import { useLocale } from "@/components/LocalizationProvider";
import type { User } from "@/lib/types";

interface UserManagerProps {
  initialUsers: User[];
}

export function UserManager({ initialUsers }: UserManagerProps) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [form, setForm] = useState({ email: "", name: "", password: "", role: "user" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useLocale();

  useEffect(() => {
    setUsers(initialUsers);
  }, [initialUsers]);

  const refresh = async () => {
    const latest = await clientApiFetch<User[]>("/users");
    setUsers(latest);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await clientApiFetch<User>("/users", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setForm({ email: "", name: "", password: "", role: "user" });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create user");
    } finally {
      setLoading(false);
    }
  };

  const toggleMfa = async (user: User) => {
    setError(null);
    await clientApiFetch<User>(`/users/${user.id}`, {
      method: "PUT",
      body: JSON.stringify({ mfa_enabled: !user.mfa_enabled }),
    });
    await refresh();
  };

  const deleteUser = async (user: User) => {
    if (!confirm(`Delete ${user.email}?`)) {
      return;
    }
    setError(null);
    await clientApiFetch(`/users/${user.id}`, { method: "DELETE" });
    await refresh();
  };

  return (
    <div className="space-y-5">
      <div className="overflow-x-auto rounded-2xl border border-slate-800">
        <table className="w-full text-sm">
          <thead className="bg-slate-900/60 text-muted">
            <tr className="text-left">
              <th className="py-3 px-4">{t("tableEmail", "Email")}</th>
              <th className="px-4">{t("tableName", "Name")}</th>
              <th className="px-4">{t("tableRole", "Role")}</th>
              <th className="px-4">{t("tableMfa", "MFA")}</th>
              <th className="px-4 text-right">{t("tableActions", "Actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-slate-900/40">
                <td className="py-3 px-4 font-medium">{user.email}</td>
                <td className="px-4">{user.name}</td>
                <td className="px-4 capitalize">{user.role}</td>
                <td className="px-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${user.mfa_enabled ? "bg-emerald-900 text-emerald-200" : "bg-slate-800"}`}>
                    {user.mfa_enabled ? "Enabled" : "Disabled"}
                  </span>
                </td>
                <td className="px-4 text-right space-x-2">
                  <button
                    type="button"
                    className="text-xs px-3 py-1 rounded-full border border-cyan-500 text-cyan-200"
                    onClick={() => toggleMfa(user)}
                  >
                    {t("toggleMfa", "Toggle MFA")}
                  </button>
                  <button
                    type="button"
                    className="text-xs px-3 py-1 rounded-full border border-rose-500 text-rose-200"
                    onClick={() => deleteUser(user)}
                  >
                    {t("deleteUserAction", "Delete")}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <input
          className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm md:col-span-2"
          placeholder={t("tableEmail", "Email")}
          type="email"
          value={form.email}
          onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
          required
        />
        <input
          className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm"
          placeholder={t("tableName", "Name")}
          value={form.name}
          onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
          required
        />
        <input
          className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm"
          placeholder={t("passwordPlaceholder", "Password")}
          type="password"
          value={form.password}
          onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
          required
        />
        <select
          className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm"
          value={form.role}
          onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value }))}
        >
          <option value="user">{t("roleUser", "User")}</option>
          <option value="admin">{t("roleAdmin", "Admin")}</option>
        </select>
        <div className="md:col-span-5 flex items-center gap-3">
          <button
            type="submit"
            className="bg-cyan-600 text-white text-sm font-semibold px-4 py-2 rounded-xl disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "..." : t("inviteUser", "Invite user")}
          </button>
          <button type="button" className="text-sm text-muted underline decoration-dotted" onClick={refresh}>
            {t("refresh", "Refresh")}
          </button>
          {error ? <span className="text-xs text-rose-400">{error}</span> : null}
        </div>
      </form>
    </div>
  );
}
