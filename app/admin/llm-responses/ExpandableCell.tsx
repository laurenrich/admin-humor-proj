"use client";

import { useState } from "react";

export default function ExpandableCell({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > 80;

  if (!isLong) {
    return <span className={className}>{text}</span>;
  }

  return (
    <button
      type="button"
      onClick={() => setExpanded((e) => !e)}
      className={`text-left w-full cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/50 rounded px-1 -mx-1 py-0.5 -my-0.5 transition-colors ${className}`}
    >
      {expanded ? (
        <div className="max-w-[720px] max-h-[400px] overflow-auto whitespace-pre-wrap break-words text-xs">
          {text}
          <span className="block mt-1 text-zinc-400">(click to collapse)</span>
        </div>
      ) : (
        <span className="inline-flex items-center gap-1 max-w-[480px]">
          <span className="truncate min-w-0">{text}</span>
          <span className="flex-shrink-0 text-zinc-400 text-xs">(click)</span>
        </span>
      )}
    </button>
  );
}
