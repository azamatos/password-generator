import type { APIRoute, GetStaticPaths } from "astro";
import { cards } from "@/og/cards";
import { renderShareImage, type ShareCard } from "@/og/render";

// One 1200×630 share image per page, built from the same data, so they never go stale.
export const getStaticPaths = (() =>
  Object.entries(cards).map(([slug, card]) => ({ params: { slug }, props: { card } }))) satisfies GetStaticPaths;

export const GET: APIRoute<{ card: ShareCard }> = async ({ props }) =>
  new Response(await renderShareImage(props.card), { headers: { "Content-Type": "image/png" } });
