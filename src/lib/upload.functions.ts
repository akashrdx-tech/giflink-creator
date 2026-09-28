import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const uploadSchema = z.object({
  base64: z.string().min(1),
  name: z.string().min(1).max(100),
  expiration: z.number().int().min(0).max(15552000).optional(),
});

export type ImgbbResult = {
  url: string;
  displayUrl: string;
  viewerUrl: string;
  thumbUrl: string | null;
  deleteUrl: string;
  name: string;
  size: number;
  width: string;
  height: string;
  mime: string;
  expiration: string;
};

export type UploadResponse =
  | { ok: true; result: ImgbbResult }
  | { ok: false; error: string };

export const uploadImage = createServerFn({ method: "POST" })
  .inputValidator((data) => uploadSchema.parse(data))
  .handler(async ({ data }): Promise<UploadResponse> => {
    const apiKey =
      process.env["IMGBB_API_KEY"] ?? "840acce87cd1b8c78bb99e986538265b";

    const params = new URLSearchParams({ key: apiKey });
    if (data.expiration && data.expiration > 0) {
      params.set("expiration", String(data.expiration));
    }

    const form = new FormData();
    form.set("image", data.base64);
    form.set("name", data.name.replace(/\.[^.]+$/, ""));

    const res = await fetch(`https://api.imgbb.com/1/upload?${params}`, {
      method: "POST",
      body: form,
    });

    const json = (await res.json()) as {
      success?: boolean;
      status?: number;
      error?: { message?: string };
      data?: {
        url: string;
        display_url: string;
        url_viewer: string;
        delete_url: string;
        width: string;
        height: string;
        size: number;
        expiration: string;
        image?: { filename?: string; mime?: string };
        thumb?: { url?: string };
      };
    };

    if (!res.ok || !json.success || !json.data) {
      return {
        ok: false,
        error:
          json.error?.message ??
          `Upload failed (status ${json.status ?? res.status})`,
      };
    }

    const d = json.data;
    return {
      ok: true,
      result: {
      url: d.url,
      displayUrl: d.display_url,
      viewerUrl: d.url_viewer,
      thumbUrl: d.thumb?.url ?? null,
      deleteUrl: d.delete_url,
      name: d.image?.filename ?? data.name,
      size: d.size,
      width: d.width,
      height: d.height,
        mime: d.image?.mime ?? "image/*",
        expiration: d.expiration,
      },
    };
  });
