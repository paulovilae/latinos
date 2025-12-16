"use client";

import { ReactNode } from "react";

import { TranslationKey } from "@/lib/i18n";

import { useLocale } from "./LocalizationProvider";

interface LocalizedTextProps {
  id: TranslationKey;
  fallback: string;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
}

export function LocalizedText({ id, fallback, as: Tag = "span", className }: LocalizedTextProps) {
  const { t } = useLocale();
  const content = t(id, fallback);
  return <Tag className={className}>{content}</Tag>;
}

export function useTranslation() {
  const { t } = useLocale();
  return t;
}
