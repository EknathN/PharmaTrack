"use client";

import React from "react";

interface FormattedAiMessageProps {
  content: string;
  themeAccent?: string;
}

// Parses inline bold (**text**), italics (*text*), code (`text`)
function formatInlineText(text: string): React.ReactNode[] {
  // Split on inline patterns: code `...`, bold **...**, italics *...*
  const tokens = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g);

  return tokens.map((token, i) => {
    if (token.startsWith("`") && token.endsWith("`") && token.length >= 2) {
      return (
        <code
          key={i}
          className="bg-slate-100 text-violet-700 px-1.5 py-0.5 rounded text-[11px] font-mono font-semibold border border-slate-200"
        >
          {token.slice(1, -1)}
        </code>
      );
    }
    if (token.startsWith("**") && token.endsWith("**") && token.length >= 4) {
      return (
        <strong key={i} className="font-semibold text-slate-900">
          {token.slice(2, -2)}
        </strong>
      );
    }
    if (token.startsWith("*") && token.endsWith("*") && token.length >= 2) {
      return (
        <em key={i} className="italic text-slate-600">
          {token.slice(1, -1)}
        </em>
      );
    }
    return <span key={i}>{token}</span>;
  });
}

// Check if a line is a markdown table row (e.g. | col | col |)
function isTableRow(line: string): boolean {
  const trimmed = line.trim();
  return trimmed.startsWith("|") && trimmed.endsWith("|");
}

// Check if a line is a markdown table divider (e.g. | --- | :---: |)
function isTableDivider(line: string): boolean {
  const trimmed = line.trim();
  return trimmed.startsWith("|") && trimmed.endsWith("|") && /^\|[\s-:]+(\|[\s-:]+)+\|$/.test(trimmed);
}

// Parse markdown table rows
function renderTable(tableLines: string[], keyIdx: number) {
  if (tableLines.length < 2) return null;

  const headerCells = tableLines[0]
    .split("|")
    .slice(1, -1)
    .map((c) => c.trim());

  const dataRows = tableLines.slice(1).filter((l) => !isTableDivider(l));

  return (
    <div key={keyIdx} className="my-3 overflow-x-auto rounded-xl border border-slate-200 shadow-xs bg-white">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200 text-slate-700">
            {headerCells.map((h, i) => (
              <th key={i} className="px-3 py-2 font-semibold text-[11px] uppercase tracking-wider">
                {formatInlineText(h)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {dataRows.map((row, rIdx) => {
            const cells = row
              .split("|")
              .slice(1, -1)
              .map((c) => c.trim());
            return (
              <tr key={rIdx} className={rIdx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                {cells.map((cell, cIdx) => (
                  <td key={cIdx} className="px-3 py-2 text-slate-700 whitespace-nowrap">
                    {formatInlineText(cell)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function FormattedAiMessage({ content }: FormattedAiMessageProps) {
  if (!content) return null;

  const rawLines = content.split("\n");
  const elements: React.ReactNode[] = [];

  let i = 0;
  while (i < rawLines.length) {
    const line = rawLines[i];
    const trimmed = line.trim();

    // 1. Skip empty lines with small spacer
    if (!trimmed) {
      elements.push(<div key={`spacer-${i}`} className="h-1.5" />);
      i++;
      continue;
    }

    // 2. Markdown Table Detection
    if (isTableRow(trimmed) && i + 1 < rawLines.length && isTableDivider(rawLines[i + 1])) {
      const tableLines: string[] = [];
      while (i < rawLines.length && isTableRow(rawLines[i])) {
        tableLines.push(rawLines[i]);
        i++;
      }
      elements.push(renderTable(tableLines, i));
      continue;
    }

    // 3. Code block detection (```...```)
    if (trimmed.startsWith("```")) {
      const codeLines: string[] = [];
      i++;
      while (i < rawLines.length && !rawLines[i].trim().startsWith("```")) {
        codeLines.push(rawLines[i]);
        i++;
      }
      if (i < rawLines.length) i++; // skip closing ```
      elements.push(
        <div key={`code-${i}`} className="my-2.5 p-3 rounded-xl bg-slate-900 text-slate-100 text-xs font-mono overflow-x-auto shadow-xs">
          <pre>{codeLines.join("\n")}</pre>
        </div>
      );
      continue;
    }

    // 4. Headers: ###, ##, #
    if (trimmed.startsWith("### ")) {
      const title = trimmed.replace(/^###\s+/, "");
      elements.push(
        <div key={`h3-${i}`} className="mt-3.5 mb-1.5 pt-1.5 border-t border-slate-100 first:mt-0 first:pt-0 first:border-0">
          <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
            {formatInlineText(title)}
          </h4>
        </div>
      );
      i++;
      continue;
    }
    if (trimmed.startsWith("## ")) {
      const title = trimmed.replace(/^##\s+/, "");
      elements.push(
        <div key={`h2-${i}`} className="mt-4 mb-2 pt-2 border-t border-slate-200 first:mt-0 first:pt-0 first:border-0">
          <h3 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
            {formatInlineText(title)}
          </h3>
        </div>
      );
      i++;
      continue;
    }

    // 5. Callout / Highlight Cards (Starts with ⚠️, 🚨, 💡, ✅, 🔮, 📊, ℹ️)
    if (/^(⚠️|🚨|💡|✅|🔮|📊|ℹ️)/.test(trimmed)) {
      let cardBg = "bg-slate-50 border-slate-200 text-slate-800";
      if (trimmed.startsWith("⚠️") || trimmed.startsWith("🚨")) {
        cardBg = "bg-amber-50/90 border-amber-200/90 text-amber-950";
      } else if (trimmed.startsWith("✅")) {
        cardBg = "bg-emerald-50/90 border-emerald-200/90 text-emerald-950";
      } else if (trimmed.startsWith("💡")) {
        cardBg = "bg-blue-50/90 border-blue-200/90 text-blue-950";
      } else if (trimmed.startsWith("🔮")) {
        cardBg = "bg-purple-50/90 border-purple-200/90 text-purple-950";
      } else if (trimmed.startsWith("📊")) {
        cardBg = "bg-slate-100/90 border-slate-200 text-slate-900";
      }

      elements.push(
        <div key={`callout-${i}`} className={`my-2 p-2.5 rounded-xl border text-xs sm:text-sm leading-relaxed shadow-2xs ${cardBg}`}>
          {formatInlineText(trimmed)}
        </div>
      );
      i++;
      continue;
    }

    // 6. Action / Recommendation arrow (starts with → or ->)
    if (/^(\s*→|\s*->)/.test(trimmed)) {
      const text = trimmed.replace(/^(\s*→|\s*->)\s*/, "");
      elements.push(
        <div key={`rec-${i}`} className="ml-5 my-1 px-2.5 py-1.5 rounded-lg bg-violet-50 border border-violet-100 text-xs text-violet-900 font-medium flex items-center gap-1.5">
          <span className="text-violet-600 font-bold">↳</span>
          <span>{formatInlineText(text)}</span>
        </div>
      );
      i++;
      continue;
    }

    // 7. Unordered Bullet points: starts with '- ' or '* '
    if (/^\s*[-*]\s+/.test(line)) {
      const indentLevel = line.match(/^\s*/)?.[0].length || 0;
      const bulletText = line.replace(/^\s*[-*]\s+/, "");
      elements.push(
        <div
          key={`bullet-${i}`}
          className={`flex items-start gap-2 my-1 text-xs sm:text-sm ${
            indentLevel > 2 ? "ml-5 text-slate-600" : "ml-1 text-slate-800"
          }`}
        >
          <span className="text-slate-400 mt-1 select-none text-[10px]">●</span>
          <div className="flex-1 leading-relaxed">{formatInlineText(bulletText)}</div>
        </div>
      );
      i++;
      continue;
    }

    // 8. Numbered List items: starts with '1. ', '2. ', etc.
    if (/^\s*\d+\.\s+/.test(line)) {
      const numMatch = line.match(/^\s*(\d+)\.\s+(.*)$/);
      const number = numMatch ? numMatch[1] : "•";
      const itemText = numMatch ? numMatch[2] : trimmed;

      elements.push(
        <div key={`num-${i}`} className="flex items-start gap-2.5 my-1.5 text-xs sm:text-sm text-slate-800">
          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-semibold text-[11px] flex items-center justify-center border border-slate-200 mt-0.5">
            {number}
          </span>
          <div className="flex-1 leading-relaxed">{formatInlineText(itemText)}</div>
        </div>
      );
      i++;
      continue;
    }

    // 9. Standard Paragraph / Text
    elements.push(
      <p key={`p-${i}`} className="my-1 text-xs sm:text-sm text-slate-800 leading-relaxed">
        {formatInlineText(trimmed)}
      </p>
    );
    i++;
  }

  return <div className="space-y-0.5 text-slate-800 font-sans break-words">{elements}</div>;
}
