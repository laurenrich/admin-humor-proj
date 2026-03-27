"use client";

import { useState, useTransition } from "react";
import { deleteImage, updateImage } from "./actions";

function formatUtc(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toISOString().replace("T", " ").replace(/\.\d{3}Z$/, " UTC");
}

export default function ImageEditor({
  id,
  createdAt,
  initialUrl,
  initialIsPublic,
  initialIsCommonUse,
  initialAdditionalContext,
  initialImageDescription,
  initialCelebrityRecognition,
  onDeleted,
}: {
  id: string;
  createdAt: string;
  initialUrl: string | null;
  initialIsPublic: boolean | null;
  initialIsCommonUse: boolean | null;
  initialAdditionalContext: string | null;
  initialImageDescription: string | null;
  initialCelebrityRecognition: string | null;
  onDeleted?: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [url, setUrl] = useState(initialUrl ?? "");
  const [isPublic, setIsPublic] = useState(Boolean(initialIsPublic));
  const [isCommonUse, setIsCommonUse] = useState(Boolean(initialIsCommonUse));
  const [additionalContext, setAdditionalContext] = useState(
    initialAdditionalContext ?? ""
  );
  const [imageDescription, setImageDescription] = useState(
    initialImageDescription ?? ""
  );
  const [celebrityRecognition, setCelebrityRecognition] = useState(
    initialCelebrityRecognition ?? ""
  );

  const href = url.trim();
  const hasPreview = href.startsWith("http://") || href.startsWith("https://");

  const field =
    "rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50";

  function onDeleteClick() {
    if (isPending) return;
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", id);
      const res = await deleteImage(fd);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      onDeleted?.();
    });
  }

  function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (isPending) return;
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", id);
      fd.set("url", url);
      fd.set("additional_context", additionalContext);
      fd.set("image_description", imageDescription);
      fd.set("celebrity_recognition", celebrityRecognition);
      fd.set("is_public", isPublic ? "true" : "false");
      fd.set("is_common_use", isCommonUse ? "true" : "false");
      const res = await updateImage(fd);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setEditing(false);
    });
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-900 dark:bg-zinc-950">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div className="h-28 w-28 shrink-0 overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 dark:border-zinc-900 dark:bg-zinc-900/30 sm:h-32 sm:w-32">
            {hasPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={href}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            ) : null}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {hasPreview ? (
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="truncate text-sm font-semibold text-zinc-900 underline decoration-zinc-300 underline-offset-4 hover:decoration-zinc-500 dark:text-zinc-50 dark:decoration-zinc-700 dark:hover:decoration-zinc-400"
                >
                  {href}
                </a>
              ) : (
                <div className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  {initialUrl || "(no url)"}
                </div>
              )}

              {isPublic ? (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-200">
                  public
                </span>
              ) : (
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                  private
                </span>
              )}
              {isCommonUse ? (
                <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-medium text-indigo-900 dark:bg-indigo-900/30 dark:text-indigo-200">
                  common use
                </span>
              ) : null}
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
              <div>
                created:{" "}
                <span className="text-zinc-700 dark:text-zinc-300">
                  {formatUtc(createdAt)}
                </span>
              </div>
              <div className="font-mono">
                id: <span className="text-zinc-700 dark:text-zinc-300">{id}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className="h-9 rounded-xl border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900"
          >
            {editing ? "Close" : "Edit"}
          </button>
          <button
            type="button"
            onClick={onDeleteClick}
            disabled={isPending}
            className="h-9 rounded-xl bg-red-600 px-3 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-60"
          >
            {isPending ? "Working…" : "Delete"}
          </button>
        </div>
      </div>

      {editing ? (
        <form className="mt-4 grid grid-cols-1 gap-3" onSubmit={onSave}>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              URL
            </span>
            <input
              name="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className={`h-10 ${field}`}
            />
          </label>

          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
              <input
                type="checkbox"
                name="is_public"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
              />
              Public
            </label>
            <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
              <input
                type="checkbox"
                name="is_common_use"
                checked={isCommonUse}
                onChange={(e) => setIsCommonUse(e.target.checked)}
              />
              Common use
            </label>
          </div>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Image description
            </span>
            <textarea
              name="image_description"
              value={imageDescription}
              onChange={(e) => setImageDescription(e.target.value)}
              rows={3}
              className={field}
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Additional context
            </span>
            <textarea
              name="additional_context"
              value={additionalContext}
              onChange={(e) => setAdditionalContext(e.target.value)}
              rows={3}
              className={field}
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Celebrity recognition
            </span>
            <textarea
              name="celebrity_recognition"
              value={celebrityRecognition}
              onChange={(e) => setCelebrityRecognition(e.target.value)}
              rows={3}
              className={field}
            />
          </label>

          <div className="flex items-center justify-end gap-2">
            <button
              disabled={isPending}
              className="h-10 rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-zinc-100"
            >
              {isPending ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-zinc-700 dark:text-zinc-300">
          <div className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-900">
            <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Image description
            </div>
            <div className="mt-2 whitespace-pre-wrap">
              {imageDescription.trim() || "—"}
            </div>
          </div>
          <div className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-900">
            <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Additional context
            </div>
            <div className="mt-2 whitespace-pre-wrap">
              {additionalContext.trim() || "—"}
            </div>
          </div>
          <div className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-900">
            <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Celebrity recognition
            </div>
            <div className="mt-2 whitespace-pre-wrap">
              {celebrityRecognition.trim() || "—"}
            </div>
          </div>
        </div>
      )}

      {error ? (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
          {error}
        </div>
      ) : null}
    </div>
  );
}
