import { updateTag } from "next/cache";

export const ANIMES_TAG = "animes";

export function invalidarCacheAnimes() {
  updateTag(ANIMES_TAG);
}