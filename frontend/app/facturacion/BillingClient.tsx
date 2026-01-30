"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { actionCreatePortalSession } from "@/lib/actions";

interface Invoice {
  id: string;
  date: string;
  amount: string;
  status: "paid" | "pending" | "failed";
  description: string;
}

// Mock invoice data - in production, fetch from Stripe API
const MOCK_INVOICES: Invoice[] = [
  { id: "INV-001", date: "2026-01-15", amount: "$20.00", status: "paid", description: "Pro Plan - Monthly" },
  { id: "INV-002", date: "2025-12-15", amount: "$20.00", status: "paid", description: "Pro Plan - Monthly" },
  { id: "INV-003", date: "2025-11-15", amount: "$20.00", status: "paid", description: "Pro Plan - Monthly" },
];

interface BillingClientProps {
  currentTier: string;
  userEmail: string;
}

export function BillingClient({ currentTier, userEmail }: BillingClientProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handlePortal = () => {
    startTransition(async () => {
      try {
        const { portal_url } = await actionCreatePortalSession();
        if (portal_url) window.location.href = portal_url;
      } catch (err) {
        console.error("Portal failed", err);
        alert("Portal session failed. Please try again.");
      }
    });
  };

  const isPro = currentTier?.toLowerCase() === "pro";

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Facturación</h1>
        <p className="text-muted">Gestiona tu suscripción, historial de pagos y soporte de facturación</p>
      </div>

      {/* Current Subscription Card */}
      <section className="border border-slate-800 rounded-xl p-6 bg-slate-900/30">
        <h2 className="text-lg font-semibold mb-4">Tu Suscripción Actual</h2>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-lg ${isPro ? "bg-emerald-500/20" : "bg-slate-800"}`}>
              <span className={`text-2xl ${isPro ? "text-emerald-400" : "text-slate-400"}`}>
                {isPro ? "⭐" : "🆓"}
              </span>
            </div>
            <div>
              <p className="font-semibold text-lg">{isPro ? "Plan Pro" : "Plan Starter (Gratis)"}</p>
              <p className="text-sm text-muted">
                {isPro 
                  ? "10 bots • 5 worker slots • 1M signal events/mo" 
                  : "1 live bot • 1 worker slot • 10k signal events/mo"
                }
              </p>
              <p className="text-xs text-slate-500 mt-1">Cuenta: {userEmail}</p>
            </div>
          </div>
          <div className="flex gap-3">
            {isPro ? (
              <button
                onClick={handlePortal}
                disabled={isPending}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {isPending ? "Cargando..." : "Gestionar Suscripción"}
              </button>
            ) : (
              <button
                onClick={() => router.push("/dashboard#billing")}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Actualizar a Pro
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Payment History */}
      <section className="border border-slate-800 rounded-xl p-6 bg-slate-900/30">
        <h2 className="text-lg font-semibold mb-4">Historial de Pagos</h2>
        {isPro ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-2 text-muted font-medium">Factura</th>
                  <th className="text-left py-3 px-2 text-muted font-medium">Fecha</th>
                  <th className="text-left py-3 px-2 text-muted font-medium">Descripción</th>
                  <th className="text-left py-3 px-2 text-muted font-medium">Monto</th>
                  <th className="text-left py-3 px-2 text-muted font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_INVOICES.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                    <td className="py-3 px-2 font-mono text-xs">{invoice.id}</td>
                    <td className="py-3 px-2">{invoice.date}</td>
                    <td className="py-3 px-2 text-muted">{invoice.description}</td>
                    <td className="py-3 px-2 font-semibold">{invoice.amount}</td>
                    <td className="py-3 px-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        invoice.status === "paid" 
                          ? "bg-emerald-500/20 text-emerald-400" 
                          : invoice.status === "pending"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-red-500/20 text-red-400"
                      }`}>
                        {invoice.status === "paid" ? "Pagado" : invoice.status === "pending" ? "Pendiente" : "Fallido"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 text-center">
              <button
                onClick={handlePortal}
                disabled={isPending}
                className="text-sm text-blue-400 hover:underline"
              >
                Ver todas las facturas en Stripe →
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted">
            <p className="mb-2">No hay historial de pagos disponible.</p>
            <p className="text-sm">Los pagos aparecerán aquí cuando actualices a Pro.</p>
          </div>
        )}
      </section>

      {/* Help & Support Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* General Help */}
        <section className="border border-slate-800 rounded-xl p-6 bg-slate-900/30">
          <h2 className="text-lg font-semibold mb-4">Ayuda General</h2>
          <ul className="space-y-3">
            <li>
              <a href="#" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800/50 transition-colors">
                <span className="text-xl">📚</span>
                <div>
                  <p className="font-medium">Centro de Ayuda</p>
                  <p className="text-xs text-muted">Guías y tutoriales para usar la plataforma</p>
                </div>
              </a>
            </li>
            <li>
              <a href="#" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800/50 transition-colors">
                <span className="text-xl">💬</span>
                <div>
                  <p className="font-medium">FAQ</p>
                  <p className="text-xs text-muted">Preguntas frecuentes sobre trading y bots</p>
                </div>
              </a>
            </li>
            <li>
              <a href="#" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800/50 transition-colors">
                <span className="text-xl">🎥</span>
                <div>
                  <p className="font-medium">Video Tutoriales</p>
                  <p className="text-xs text-muted">Aprende a configurar tus estrategias</p>
                </div>
              </a>
            </li>
          </ul>
        </section>

        {/* Billing Support */}
        <section className="border border-slate-800 rounded-xl p-6 bg-slate-900/30">
          <h2 className="text-lg font-semibold mb-4">Soporte de Facturación</h2>
          <ul className="space-y-3">
            <li>
              <a href="mailto:billing@latinos.dev" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800/50 transition-colors">
                <span className="text-xl">✉️</span>
                <div>
                  <p className="font-medium">Email de Facturación</p>
                  <p className="text-xs text-muted">billing@latinos.dev</p>
                </div>
              </a>
            </li>
            <li>
              <a href="#" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800/50 transition-colors">
                <span className="text-xl">🔄</span>
                <div>
                  <p className="font-medium">Solicitar Reembolso</p>
                  <p className="text-xs text-muted">Política de reembolso de 30 días</p>
                </div>
              </a>
            </li>
            <li>
              <a href="#" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800/50 transition-colors">
                <span className="text-xl">🧾</span>
                <div>
                  <p className="font-medium">Información Fiscal</p>
                  <p className="text-xs text-muted">Actualizar datos de facturación</p>
                </div>
              </a>
            </li>
            <li>
              <button
                onClick={handlePortal}
                disabled={isPending}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800/50 transition-colors text-left"
              >
                <span className="text-xl">💳</span>
                <div>
                  <p className="font-medium">Actualizar Método de Pago</p>
                  <p className="text-xs text-muted">Cambiar tarjeta o método de pago</p>
                </div>
              </button>
            </li>
          </ul>
        </section>
      </div>

      {/* Contact Banner */}
      <section className="border border-blue-500/30 rounded-xl p-6 bg-blue-950/20">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-blue-400">¿Necesitas ayuda personalizada?</h3>
            <p className="text-sm text-muted mt-1">
              Nuestro equipo de soporte está disponible de Lunes a Viernes, 9:00 - 18:00 (COT)
            </p>
          </div>
          <a 
            href="mailto:support@latinos.dev" 
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Contactar Soporte
          </a>
        </div>
      </section>
    </div>
  );
}
