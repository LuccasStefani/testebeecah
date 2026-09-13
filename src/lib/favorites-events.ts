export const FAVORITES_UPDATED_EVENT =
  "beecah:favorites-updated";

type FavoriteUpdatedDetail = {
  productId: string;
  isFavorite: boolean;
};

export function dispatchFavoriteUpdated(
  detail: FavoriteUpdatedDetail
) {
  window.dispatchEvent(
    new CustomEvent<FavoriteUpdatedDetail>(
      FAVORITES_UPDATED_EVENT,
      {
        detail,
      }
    )
  );
}