import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useRef, useState } from "react";
import {
  Check,
  Copy,
  ImageUp,
  Link2,
  Loader2,
  RefreshCw,
  Trash2,
  Zap,
} from "lucide-react";
import { uploadImage, type ImgbbResult } from "@/lib/upload.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RDX IMAGE TO URL — Free Image Hosting" },
      {
        name: "description",
        content:
          "RDX IMAGE TO URL — upload any image and instantly get a direct shareable URL. Fast, free image hosting with expiring links.",
      },
      { property: "og:title", content: "RDX IMAGE TO URL — Free Image Hosting" },
      {
        property: "og:description",
        content:
          "Upload any image and instantly get a direct shareable URL. Fast, free image hosting.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

const EXPIRATIONS = [
  { label: "Never expire", value: 0 },
  { label: "10 minutes", value: 600 },
  { label: "1 hour", value: 3600 },
  { label: "1 day", value: 86400 },
  { label: "7 days", value: 604800 },
  { label: "30 days", value: 2592000 },
];

const MAX_SIZE = 32 * 1024 * 1024; // 32 MB (imgbb limit)

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="shrink-0 rounded-md border border-border bg-secondary px-2.5 py-1.5 text-xs font-medium text-secondary-foreground transition-colors hover:bg-accent"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

function LinkRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
      <span className="w-24 shrink-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <a
        href={value}
        target="_blank"
        rel="noreferrer"
        className="min-w-0 flex-1 truncate font-mono text-xs text-primary hover:underline"
      >
        {value}
      </a>
      <CopyButton text={value} />
    </div>
  );
}

function Index() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [expiration, setExpiration] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImgbbResult | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const pickFile = useCallback((f: File | null) => {
    setError(null);
    setResult(null);
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setError("Sirf image files allowed hain (PNG, JPG, GIF, WebP...).");
      return;
    }
    if (f.size > MAX_SIZE) {
      setError("Image 32 MB se choti honi chahiye.");
      return;
    }
    setFile(f);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(f);
  }, []);

  const reset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const doUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const dataUrl = preview!;
      const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
      const res = await uploadImage({
        data: { base64, name: file.name, expiration },
      });
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed. Dobara try karein.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Zap className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold tracking-tight">
              RDX <span className="text-primary">IMAGE TO URL</span>
            </span>
          </div>
          <span className="rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
            Free Image Hosting
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Image upload karein, <span className="text-primary">URL payein</span>
          </h1>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            Koi bhi image drop karein aur turant direct link, viewer link aur embed codes hasil karein.
          </p>
        </div>

        {/* Dropzone */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            pickFile(e.dataTransfer.files?.[0] ?? null);
          }}
          className={`mt-8 cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
            dragging
              ? "border-primary bg-accent"
              : "border-border bg-card hover:border-primary/50"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
          />
          {preview ? (
            <img
              src={preview}
              alt="Preview"
              className="mx-auto max-h-64 rounded-lg border border-border object-contain"
            />
          ) : (
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
                <ImageUp className="h-6 w-6 text-primary" />
              </div>
              <p className="font-medium">Image yahan drop karein ya click karein</p>
              <p className="text-xs text-muted-foreground">PNG, JPG, GIF, WebP — max 32 MB</p>
            </div>
          )}
          {file && (
            <p className="mt-4 text-xs text-muted-foreground">
              {file.name} · {formatBytes(file.size)}
            </p>
          )}
        </div>

        {/* Controls */}
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <select
            value={expiration}
            onChange={(e) => setExpiration(Number(e.target.value))}
            className="h-11 flex-1 rounded-lg border border-input bg-card px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
          >
            {EXPIRATIONS.map((o) => (
              <option key={o.value} value={o.value}>
                Expiry: {o.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={doUpload}
            disabled={!file || loading}
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Uploading...
              </>
            ) : (
              <>
                <Link2 className="h-4 w-4" /> Get URL
              </>
            )}
          </button>
          {file && (
            <button
              type="button"
              onClick={reset}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-border bg-secondary px-4 text-sm font-medium text-secondary-foreground hover:bg-accent"
            >
              <RefreshCw className="h-4 w-4" /> Reset
            </button>
          )}
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="mt-8 rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-semibold">
                <Check className="h-5 w-5 text-primary" /> Upload complete!
              </h2>
              <span className="text-xs text-muted-foreground">
                {result.width}×{result.height} · {formatBytes(result.size)} · {result.mime}
              </span>
            </div>
            <div className="mt-4 space-y-2">
              <LinkRow label="Direct" value={result.url} />
              <LinkRow label="Viewer" value={result.viewerUrl} />
              {result.thumbUrl && <LinkRow label="Thumbnail" value={result.thumbUrl} />}
              <LinkRow label="HTML" value={`<img src="${result.url}" alt="${result.name}">`} />
              <LinkRow label="Markdown" value={`![${result.name}](${result.url})`} />
            </div>
            <a
              href={result.deleteUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-3 w-3" /> Delete this image
            </a>
          </div>
        )}
      </main>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        RDX IMAGE TO URL — fast & free image hosting
      </footer>
    </div>
  );
}
