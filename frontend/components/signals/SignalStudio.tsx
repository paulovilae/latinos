"use client";

import { useState } from "react";
import { SignalEditor } from "./SignalEditor";
import { StackBuilder } from "./StackBuilder";
import { SectionCard } from "@/components/SectionCard";

export function SignalStudio() {
  const [activeTab, setActiveTab] = useStateLike("signals"); // "signals" | "stacks" | "backtest"

  return (
    <div className="flex flex-col gap-6">
      
      {/* 1. Signal Library & Editor */}
      <SectionCard
        id="signal-editor"
        title="Signal Library"
        description="Create reusable trading signals using formulas or python."
      >
        <SignalEditor />
      </SectionCard>

      {/* 2. Stack Builder (Ref: The 'Robot') */}
      <SectionCard
        id="stack-builder"
        title="Signal Stacks (Robots)"
        description="Chain signals together to create a trading strategy."
      >
        <StackBuilder />
      </SectionCard>

    </div>
  );
}

function useStateLike(initial: string) {
    return useState(initial);
}
