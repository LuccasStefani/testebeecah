"use client";

import { Toast } from "@base-ui/react/toast";
import {
  CircleCheck,
  CircleAlert,
  Info,
  LogIn,
  LogOut,
  Heart,
  ShoppingBag,
} from "lucide-react";
import { notificationContent } from "@/src/content/notifications";
import { toastManager, type NotificationIcon } from "@/src/lib/notifications";

import SwipeToast from "./SwipeToast";

const icons = {
  check: CircleCheck,
  error: CircleAlert,
  info: Info,
  login: LogIn,
  logout: LogOut,
  heart: Heart,
  bag: ShoppingBag,
} satisfies Record<NotificationIcon, typeof CircleCheck>;

function ToastList() {
  const { toasts } = Toast.useToastManager<{
    icon: NotificationIcon;
    duration: number;
  }>();

  return (
    <Toast.Portal>
      <Toast.Viewport
        aria-label={notificationContent.region}
        className="pointer-events-none fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 z-[10000] flex flex-col gap-3 outline-none sm:left-auto sm:w-[380px]"
      >
        {toasts.map((toast) => {
          const Icon = icons[toast.data?.icon ?? "info"];

          return (
            <Toast.Root
              key={toast.id}
              toast={toast}
              className="pointer-events-auto w-full data-[limited]:hidden"
            >
              <SwipeToast
                key={toast.updateKey}
                inline
                open={toast.transitionStatus !== "ending"}
                title={toast.title}
                description={toast.description}
                icon={<Icon size={18} strokeWidth={1.7} />}
                onClose={() => toastManager.close(toast.id)}
                background="#27272a"
                color="#f5f5f5"
                fuseColor="#f5f5f5"
                duration={toast.data?.duration ?? 4000}
                closeButton
                className="w-full!"
              />
            </Toast.Root>
          );
        })}
      </Toast.Viewport>
    </Toast.Portal>
  );
}

/** Global shadcn/Base UI toast host; survives navigation between pages. */
export function Toaster() {
  return (
    <Toast.Provider toastManager={toastManager} timeout={0} limit={3}>
      <ToastList />
    </Toast.Provider>
  );
}
