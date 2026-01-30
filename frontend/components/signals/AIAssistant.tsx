"use client";

import { useState } from "react";
import { LocalizedText } from "@/components/LocalizedText";
import { useLocale } from "@/components/LocalizationProvider";

interface AIAssistantProps {
  onGenerate: (code: string) => void;
  language: "python" | "formula";
}

export function AIAssistant({ onGenerate, language }: AIAssistantProps) {
  const { t, language: appLocale } = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!prompt) return;
    setLoading(true);
    try {
        const res = await fetch('/api/utils/ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, locale: appLocale })
        });
        
        if (res.ok) {
            const data = await res.json();
            onGenerate(data.code);
            setIsOpen(false);
            setPrompt("");
        } else {
             throw new Error("API Error");
        }
        
    } catch (e) {
        alert(t("aiError", "Error generating code."));
    } finally {
        setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600/10 text-indigo-400 hover:bg-indigo-600 hover:text-white rounded-lg transition-colors text-xs font-semibold border border-indigo-500/20"
      >
        <span>✨</span>
        <LocalizedText id="askAI" fallback="Ask AI" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
                <h3 className="font-bold text-white flex items-center gap-2">
                    <span className="text-indigo-400">✨</span> 
                    <LocalizedText id="aiTitle" fallback="AI Assistant" />
                </h3>
                <button 
                    onClick={() => setIsOpen(false)}
                    className="text-slate-500 hover:text-white"
                >
                    ✕
                </button>
            </div>
            
            <div className="p-4 space-y-4">
                <p className="text-sm text-slate-400">
                    <LocalizedText id="aiDesc" fallback="Describe your signal..." />
                    <span className="block mt-1 text-xs text-slate-500">
                        <LocalizedText id="aiModel" fallback="Model: Llama 3" />
                    </span>
                </p>
                <textarea
                    className="w-full h-32 bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-white focus:border-indigo-500 focus:outline-none resize-none"
                    placeholder={t("aiPlaceholder", "E.g. Buy when...")}
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                    autoFocus
                />
            </div>
            
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end gap-2">
                <button
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
                >
                    <LocalizedText id="cancel" fallback="Cancel" />
                </button>
                <button
                    onClick={handleGenerate}
                    disabled={!prompt || loading}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                    {loading ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            <LocalizedText id="generating" fallback="Generating..." />
                        </>
                    ) : (
                         <LocalizedText id="generateCode" fallback="Generate Code" />
                    )}
                </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
