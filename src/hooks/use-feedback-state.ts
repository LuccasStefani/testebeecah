"use client";

import { useCallback, useState } from "react";
import { notify, type NotificationKind } from "@/src/lib/notifications";

/** Keeps form feedback visible while announcing the result of each action. */
export function useFeedbackState(kind: NotificationKind) {
  const [message, setMessage] = useState("");
  const updateMessage = useCallback(
    (value: string) => {
      setMessage(value);
      if (value.trim()) notify[kind](value);
    },
    [kind],
  );

  return [message, updateMessage] as const;
}
