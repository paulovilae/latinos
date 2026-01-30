"use client";

import React from "react";
import Editor from "react-simple-code-editor";
// @ts-ignore
import { highlight, languages } from "prismjs";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-python";
import "prismjs/themes/prism-tomorrow.css"; // Dark theme

interface CodeEditorProps {
  value: string;
  onChange: (code: string) => void;
  language?: "python" | "javascript" | "formula";
  placeholder?: string;
}

export function CodeEditor({ value, onChange, language = "python", placeholder }: CodeEditorProps) {
  const highlightCode = (code: string) => {
    if (language === "python") {
      // @ts-ignore
      return highlight(code, languages.python || languages.js); // Fallback to JS if python not loaded
    }
    // @ts-ignore
    return highlight(code, languages.js);
  };

  return (
    <div className="relative font-mono text-sm leading-relaxed bg-slate-950 rounded-lg border border-slate-700 focus-within:border-indigo-500 transition-colors h-full overflow-hidden">
        <div className="absolute inset-0 overflow-auto custom-scrollbar">
            <Editor
                value={value}
                onValueChange={onChange}
                highlight={highlightCode}
                padding={16}
                textareaClassName="focus:outline-none"
                style={{
                    fontFamily: '"Fira Code", "Fira Mono", monospace',
                    fontSize: 14,
                    minHeight: "100%",
                }}
                placeholder={placeholder}
            />
        </div>
        {/* Line Numbers (Simulated via CSS/Background if needed, but Editor doesn't support natively easily without plugins. Keeping simple for now) */}
    </div>
  );
}
