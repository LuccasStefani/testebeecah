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
  X,
} from "lucide-react";
import { notificationContent } from "@/src/content/notifications";
import { toastManager, type NotificationIcon } from "@/src/lib/notifications";

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
  const { toasts } = Toast.useToastManager<{ icon: NotificationIcon }>();

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
              swipeDirection={["right", "down"]}
              className="pointer-events-auto relative w-full rounded-2xl border border-white/15 bg-neutral-950 p-4 text-white shadow-[0_12px_40px_#00000026] transition-[opacity,transform] duration-200 data-[starting-style]:translate-y-3 data-[starting-style]:opacity-0 data-[ending-style]:translate-y-3 data-[ending-style]:opacity-0 data-[limited]:hidden motion-reduce:transition-none"
            >
              <Toast.Content className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white text-black">
                  <Icon size={19} strokeWidth={1.7} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1 self-center py-0.5">
                  <Toast.Title className="text-sm leading-5 font-medium" />
                  <Toast.Description className="mt-1 text-xs leading-5 text-neutral-300 empty:hidden" />
                </div>
                <Toast.Close
                  aria-label={notificationContent.close}
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg text-neutral-400 transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  <X size={16} aria-hidden="true" />
                </Toast.Close>
              </Toast.Content>
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
    <Toast.Provider toastManager={toastManager} timeout={4500} limit={3}>
      <ToastList />
    </Toast.Provider>
  );
}
