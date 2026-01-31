"use client";

import React, { useEffect, useState } from 'react';
export const ServerStatus = () => {

    const [status, setStatus] = useState<'ok' | 'degraded' | 'error' | 'checking'>('checking');
    const [latency, setLatency] = useState<number | null>(null);
    const [details, setDetails] = useState<string>('');

    useEffect(() => {
        const checkHealth = async () => {
            const start = performance.now();
            try {
                // Determine API URL based on environment or window location if relative
                // Since this component is reused, we usually proxy via Next.js or hit backend directly
                // Assuming Next.js proxy /api -> Backend
                const res = await fetch('/api/health', { signal: AbortSignal.timeout(3000) });
                const end = performance.now();
                setLatency(Math.round(end - start));

                if (res.ok) {
                    const data = await res.json();
                    if (data.status === 'ok') {
                        setStatus('ok');
                        setDetails("Systems Operational");
                    } else {
                        setStatus('degraded'); // 200 OK but application level issue
                        setDetails(data.error || "Service/DB Issue");
                    }
                } else {
                    setStatus('error');
                    setDetails(`${res.status} ${res.statusText}`);
                }
            } catch (error) {
                setStatus('error');
                setDetails(String(error));
            }
        };

        // Initial check
        checkHealth();

        // Poll every 10 seconds
        const interval = setInterval(checkHealth, 10000);
        return () => clearInterval(interval);
    }, []);

    const getColor = () => {
        switch (status) {
            case 'ok': return 'bg-emerald-500';
            case 'degraded': return 'bg-amber-500';
            case 'error': return 'bg-rose-500';
            case 'checking': return 'bg-slate-500 animate-pulse';
            default: return 'bg-slate-500';
        }
    };

    return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-full shadow-sm group cursor-help relative hover:border-slate-700 transition-colors">
            <div className={`w-2 h-2 rounded-full ${getColor()} shadow-[0_0_8px_rgba(0,0,0,0.3)]`}></div>
            
            {status !== 'checking' && latency !== null && (
                <span className="text-[10px] font-mono text-slate-500 group-hover:text-slate-300 transition-colors">
                    {latency}ms
                </span>
            )}

            {/* Tooltip */}
            <div className="absolute top-full right-0 mt-2 w-48 p-2 bg-slate-950 border border-slate-800 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 text-xs">
                <div className="font-bold text-slate-300 mb-1">Backend Status</div>
                <div className="flex items-center justify-between text-slate-400">
                    <span>API:</span>
                    <span className={status === 'ok' ? "text-emerald-400" : "text-rose-400"}>
                        {status.toUpperCase()}
                    </span>
                </div>
                {details && <div className="mt-1 pt-1 border-t border-slate-800 text-[10px] text-slate-500 break-words">{details}</div>}
            </div>
        </div>
    );
};
