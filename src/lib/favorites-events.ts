"use client";

import { notify } from "@/src/lib/notifications";
import { notificationContent } from "@/src/content/notifications";
export const FAVORITES_UPDATED_EVENT = "beecah:favorites-updated";

type FavoriteUpdatedDetail = {
  productId: string;
  isFavorite: boolean;
};

export function dispatchFavoriteUpdated(detail: FavoriteUpdatedDetail) {
  notify.success(
    detail.isFavorite
      ? notificationContent.favoriteAdded
      : notificationContent.favoriteRemoved,
    undefined,
    "heart",
  );
  window.dispatchEvent(
    new CustomEvent<FavoriteUpdatedDetail>(FAVORITES_UPDATED_EVENT, {
      detail,
    }),
  );
}
