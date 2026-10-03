"use client";

import { Toast } from "@base-ui/react/toast";

export type NotificationIcon =
  | "check"
  | "error"
  | "info"
  | "login"
  | "logout"
  | "heart"
  | "bag";
export type NotificationKind = "success" | "error" | "info";

export const toastManager = Toast.createToastManager<{ icon: NotificationIcon }>();

function show(
  kind: NotificationKind,
  title: string,
  description?: string,
  icon?: NotificationIcon,
) {
  if (!title.trim()) return;
  return toastManager.add({
    // Repeating an action refreshes its notice instead of filling the screen.
    id: `${kind}:${title}`,
    title,
    description,
    type: kind,
    timeout: kind === "error" ? 6500 : 4500,
    priority: kind === "error" ? "high" : "low",
    data: { icon: icon ?? (kind === "success" ? "check" : kind) },
  });
}

export const notify = {
  success: (title: string, description?: string, icon?: NotificationIcon) =>
    show("success", title, description, icon),
  error: (title: string, description?: string) => show("error", title, description),
  info: (title: string, description?: string, icon?: NotificationIcon) =>
    show("info", title, description, icon),
};
