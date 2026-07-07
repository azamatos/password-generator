import { navigate } from "astro:transitions/client";
import { getAllPlatformIds } from "./platforms";

const platformIds = getAllPlatformIds();

/**
 * Extracts the platform prefix from a path, e.g. "/myplatform/vault" → "/myplatform".
 * Returns "" if the path is not under a platform.
 */
export function getPlatformPrefix(path: string): string {
  const segments = path.split("/").filter(Boolean);
  if (segments.length > 0 && platformIds.includes(segments[0])) {
    return `/${segments[0]}`;
  }
  return "";
}

/**
 * Strips the platform prefix from a path, e.g. "/myplatform/vault" → "/vault".
 * Paths that aren't under a platform are returned unchanged.
 */
export function normalizePath(path: string): string {
  const segments = path.split("/").filter(Boolean);
  if (segments.length > 0 && platformIds.includes(segments[0])) {
    const rest = segments.slice(1).join("/");
    return rest ? `/${rest}` : "/";
  }
  return path;
}

/**
 * Returns true when the current path is under a known platform prefix.
 */
export function isOnPlatform(path: string): boolean {
  return getPlatformPrefix(path) !== "";
}

/**
 * Builds an href that is always relative to the current platform context.
 * e.g. platformHref("/vault") on "/myplatform/health" → "/myplatform/vault"
 *      platformHref("/vault") on "/health"            → "/vault"
 */
export function platformHref(to: string, currentPath = window.location.pathname): string {
  return `${getPlatformPrefix(currentPath)}${to}`;
}

/**
 * Returns the root href for the current context:
 * - On a platform page  → the platform root  ("/myplatform")
 * - On the main site    → the site root       ("/")
 */
export function rootHref(currentPath = window.location.pathname): string {
  const prefix = getPlatformPrefix(currentPath);
  return prefix || "/";
}

// --- navigation methods ---

export function navigateTo(to: string): Promise<void> {
  return navigate(platformHref(to));
}

export function navigateToRoot(): Promise<void> {
  return navigate(rootHref());
}

export function navigateBack(): Promise<void> {
  return navigate("/");
}
