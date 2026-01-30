"use client";

import { useState } from "react";
import { signOut, useSession } from "next-auth/react";

export function RoleEditor() {
  const { data: session } = useSession();
  const [role, setRole] = useState((session?.user as any)?.role || "user");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const handleSave = async () => {
    setSaving(true);
    setMessage("");

    try {
      // Call Next.js API route (server-side) instead of backend directly
      const response = await fetch("/api/users/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Update role error:", response.status, errorData);
        throw new Error(errorData.error || `Failed to update role: ${response.status}`);
      }

      setMessage("✅ Role updated! Signing out to refresh session...");
      
      // Sign out and redirect to signin to get new session with updated role
      setTimeout(() => {
        signOut({ callbackUrl: "/auth/signin" });
      }, 1500);
    } catch (error: any) {
      console.error("Role update error:", error);
      setMessage(`❌ Failed to update role: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
      <div className="flex justify-between items-center mb-3">
        <div>
          <p className="text-sm text-slate-500 mb-1">Role</p>
          <p className="font-medium text-emerald-400 capitalize">
            {(session?.user as any)?.role || "user"}
          </p>
        </div>
      </div>
      
      <div className="mt-4 space-y-3">
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
          disabled={saving}
        >
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>

        <button
          onClick={handleSave}
          disabled={saving || role === (session?.user as any)?.role}
          className="w-full px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-medium hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {saving ? "Saving..." : "Update Role"}
        </button>

        {message && (
          <p className="text-sm text-center mt-2">{message}</p>
        )}
      </div>
    </div>
  );
}
