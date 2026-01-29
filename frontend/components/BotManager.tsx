"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { clientApiFetch } from "@/lib/clientApi";
import { useLocale } from "@/components/LocalizationProvider";
import type { Bot } from "@/lib/types";

import { TagPill } from "./TagPill";

interface BotManagerProps {
  initialBots: Bot[];
  userPlan?: string;
  isPro?: boolean;
}

const statusTone: Record<string, "neutral" | "success" | "warning"> = {
  draft: "neutral",
  running: "success",
  paused: "warning",
};

export function BotManager({ initialBots, userPlan, isPro }: { initialBots: Bot[], userPlan?: string, isPro?: boolean }) {
  const [bots, setBots] = useState<Bot[]>(initialBots);
  const [form, setForm] = useState({ name: "", description: "", tags: "" });
  const [submitting, setSubmitting] = useState(false);
  const [busyBotId, setBusyBotId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { t } = useLocale();

  useEffect(() => {
    setBots(initialBots);
  }, [initialBots]);

  const ownerCounts = useMemo(() => {
    return bots.reduce<Record<number, number>>((acc, bot) => {
      acc[bot.owner_id] = (acc[bot.owner_id] || 0) + 1;
      return acc;
    }, {});
  }, [bots]);

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        name: form.name,
        description: form.description,
        tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
      };
      await clientApiFetch<Bot>("/bots", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setForm({ name: "", description: "", tags: "" });
      await refreshBots();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create bot");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAction = async (bot: Bot, action: "deploy" | "pause" | "delete") => {
    setBusyBotId(bot.id);
    setError(null);
    try {
      if (action === "delete") {
        await clientApiFetch(`/bots/${bot.id}`, { method: "DELETE" });
      } else {
        await clientApiFetch<Bot>(`/bots/${bot.id}/${action}`, { method: "POST" });
      }
      await refreshBots();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bot action failed");
    } finally {
      setBusyBotId(null);
    }
  };

  const refreshBots = async () => {
    const latest = await clientApiFetch<Bot[]>("/bots");
    setBots(latest);
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-muted">
            <tr className="text-left">
              <th className="py-2">{t("tableName", "Name")}</th>
              <th>{t("tableStatus", "Status")}</th>
              <th>{t("tableTags", "Tags")}</th>
              <th>{t("tableOwner", "Owner")}</th>
              <th className="text-right">{t("tableActions", "Actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {bots.map((bot) => (
              <tr key={bot.id} className="hover:bg-slate-900/40">
                <td className="py-3 font-semibold">{bot.name}</td>
                <td>
                  <TagPill label={bot.status} tone={statusTone[bot.status] || "neutral"} />
                </td>
                <td className="space-x-2">
                  {bot.tags.map((tag) => (
                    <TagPill key={tag} label={tag} />
                  ))}
                </td>
                <td className="text-xs text-muted">
                  {t("tableOwner", "Owner")} #{bot.owner_id} ({ownerCounts[bot.owner_id] ?? 1} bots)
                </td>
                <td className="text-right space-x-2">
                  <button
                    type="button"
                    className="text-xs px-3 py-1 rounded-full border border-emerald-500 text-emerald-200"
                    onClick={() => handleAction(bot, "deploy")}
                    disabled={busyBotId === bot.id}
                  >
                    {t("deployBtn", "Deploy")}
                  </button>
                  <button
                    type="button"
                    className="text-xs px-3 py-1 rounded-full border border-amber-500 text-amber-200"
                    onClick={() => handleAction(bot, "pause")}
                    disabled={busyBotId === bot.id}
                  >
                    {t("pauseBtn", "Pause")}
                  </button>
                  <button
                    type="button"
                    className="text-xs px-3 py-1 rounded-full border border-rose-500 text-rose-200"
                    onClick={() => handleAction(bot, "delete")}
                    disabled={busyBotId === bot.id}
                  >
                    {t("deleteBtn", "Delete")}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <input
          className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm md:col-span-1"
          placeholder={t("namePlaceholder", "Name")}
          value={form.name}
          onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
          required
        />
        <input
          className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm md:col-span-2"
          placeholder={t("descriptionPlaceholder", "Description")}
          value={form.description}
          onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
          required
        />
        <input
          className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm"
          placeholder={t("tagsPlaceholder", "Tags (comma separated)")}
          value={form.tags}
          onChange={(event) => setForm((prev) => ({ ...prev, tags: event.target.value }))}
        />
        <div className="md:col-span-4 flex items-center gap-3">
            {(isPro || bots.length < 1) ? (
              <button
                type="submit"
                disabled={submitting}
                className="bg-emerald-600 text-white text-sm font-semibold px-4 py-2 rounded-xl disabled:opacity-50"
              >
                {submitting ? "..." : t("createBot", "Create bot")}
              </button>
            ) : (
                <a
                  href="/dashboard?upgrade=required"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-4 py-2 rounded-xl inline-block text-center"
                >
                  Upgrade to Create More
                </a>
            )}
          <button
            type="button"
            onClick={refreshBots}
            className="text-sm text-muted underline decoration-dotted"
          >
            {t("refreshList", "Refresh list")}
          </button>
          {error ? <span className="text-xs text-rose-400">{error}</span> : null}
        </div>
      </form>
    </div>
  );
}
