"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bell,
  ShoppingCart,
  BadgeDollarSign,
  Check,
  Loader2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { pl } from "date-fns/locale";
import OneSignal from "react-onesignal";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";
import {
  ONESIGNAL_ENABLED,
  hasPushPermission,
  initOneSignal,
} from "@/components/panel-kursanta/OneSignalInit";
import {
  getAdminNotifications,
  markAllNotificationsRead,
  type AdminNotificationDTO,
} from "@/app/actions/admin-notifications";

const POLL_MS = 60_000; // odświeżanie listy co 60s

/** Tag identyfikujący urządzenie admina — OneSignal kieruje pushe sprzedażowe po nim. */
async function tagAsAdmin() {
  await OneSignal.User.addTag("role", "admin");
}

export default function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AdminNotificationDTO[]>([]);
  const [unread, setUnread] = useState(0);
  const [enabling, setEnabling] = useState(false);
  const [needsPermission, setNeedsPermission] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await getAdminNotifications();
      setItems(data.items);
      setUnread(data.unread);
    } catch {
      /* po cichu — to tylko odpytywanie w tle */
    }
  }, []);

  // Odtworzenie tagu na urządzeniu, które JUŻ ma zgodę, i polling listy.
  useEffect(() => {
    const granted = hasPushPermission();
    setNeedsPermission(!granted);

    /*
     * OneSignal startuje tu wyłącznie wtedy, gdy pozwolenie przeglądarki
     * zostało wcześniej udzielone — czyli gdy admin sam o to poprosił przy
     * poprzedniej wizycie. Bez tego warunku samo otwarcie panelu budziłoby
     * dostawcę u kogoś, kto powiadomień nigdy nie chciał.
     *
     * Tag trzeba nakładać przy każdym starcie, bo po wyczyszczeniu danych
     * przeglądarki subskrypcja odtwarza się bez niego, a to po nim OneSignal
     * kieruje pushe sprzedażowe.
     */
    if (ONESIGNAL_ENABLED && granted) {
      initOneSignal()
        .then((ready) => (ready ? tagAsAdmin() : undefined))
        .catch(() => {
          /* po cichu — brak tagu nie psuje listy powiadomień w panelu */
        });
    }

    refresh();
    const id = setInterval(refresh, POLL_MS);
    return () => clearInterval(id);
  }, [refresh]);

  // Zamknięcie dropdownu po kliknięciu poza nim.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const toggleOpen = async () => {
    const next = !open;
    setOpen(next);

    // Otwarcie = oznaczamy wszystko jako przeczytane (optymistycznie).
    if (next && unread > 0) {
      setUnread(0);
      setItems((prev) => prev.map((i) => ({ ...i, read: true })));
      await markAllNotificationsRead();
    }
  };

  const enablePush = async () => {
    // Bez inicjalizacji SDK ten przycisk mógłby tylko rzucić błędem — mówimy
    // wprost, dlaczego lokalnie nie zadziała.
    if (!ONESIGNAL_ENABLED) {
      toast.info(
        "Powiadomienia push działają tylko na produkcji (OneSignal jest przypięty do domeny).",
      );
      return;
    }

    setEnabling(true);
    try {
      // SDK budzi się dopiero tutaj — kliknięcie w „włącz powiadomienia" jest
      // momentem zgody. Wcześniej OneSignal nie dotyka tej przeglądarki.
      const ready = await initOneSignal();

      if (!ready) {
        toast.error("Nie udało się uruchomić powiadomień. Odśwież panel.");
        return;
      }

      await OneSignal.Notifications.requestPermission();
      await tagAsAdmin();
      const granted =
        typeof Notification !== "undefined" &&
        Notification.permission === "granted";
      setNeedsPermission(!granted);
      if (granted) {
        toast.success("Powiadomienia włączone na tym urządzeniu.");
      } else {
        toast.info("Powiadomienia nie zostały włączone.");
      }
    } catch {
      toast.error("Nie udało się włączyć powiadomień.");
    } finally {
      setEnabling(false);
    }
  };

  return (
    <div className="relative" ref={ref}>
      {/* DZWONEK */}
      <button
        type="button"
        onClick={toggleOpen}
        aria-label="Powiadomienia"
        className="relative flex h-10 w-10 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {/* DROPDOWN */}
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[360px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.15)] max-[980px]:fixed max-[980px]:right-4 max-[980px]:left-4 max-[980px]:w-auto">
          {/* HEADER */}
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <h3 className="text-sm font-bold text-[#0c493e]">Powiadomienia</h3>
            {items.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setUnread(0);
                  setItems((prev) => prev.map((i) => ({ ...i, read: true })));
                  markAllNotificationsRead();
                }}
                className="flex items-center gap-1 text-xs font-medium text-gray-400 hover:text-[#0c493e] transition-colors"
              >
                <Check className="h-3.5 w-3.5" />
                Przeczytane
              </button>
            )}
          </div>

          {/* PROŚBA O ZGODĘ (gdy push nieaktywny) */}
          {needsPermission && (
            <div className="flex items-center justify-between gap-3 bg-[#0c493e]/5 px-4 py-3">
              <p className="text-xs text-gray-600">
                Włącz powiadomienia, aby dostawać alerty o sprzedaży.
              </p>
              <button
                type="button"
                onClick={enablePush}
                disabled={enabling}
                className="flex shrink-0 items-center gap-1.5 rounded-lg bg-[#0c493e] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#09362e] transition-colors disabled:opacity-60"
              >
                {enabling && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Włącz
              </button>
            </div>
          )}

          {/* LISTA */}
          <div className="max-h-[420px] overflow-y-auto">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                  <Bell className="h-5 w-5 text-gray-300" />
                </div>
                <p className="text-sm font-medium text-gray-500">
                  Brak powiadomień
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  Tu pojawią się alerty o sprzedaży i porzuconych koszykach.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {items.map((n) => (
                  <NotificationRow key={n.id} item={n} />
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationRow({ item }: { item: AdminNotificationDTO }) {
  const isSale = item.type === "sale";
  const Icon = isSale ? BadgeDollarSign : ShoppingCart;

  const content = (
    <div
      className={cn(
        "flex items-start gap-3 px-4 py-3 transition-colors hover:bg-gray-50",
        !item.read && "bg-[#c5e96b]/10",
      )}
    >
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
          isSale ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700",
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-gray-800">{item.title}</p>
        <p className="text-xs leading-relaxed text-gray-500">{item.body}</p>
        <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-gray-400">
          {formatDistanceToNow(new Date(item.createdAt), {
            addSuffix: true,
            locale: pl,
          })}
        </p>
      </div>
      {!item.read && (
        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#0c493e]" />
      )}
    </div>
  );

  return item.url ? <a href={item.url}>{content}</a> : content;
}
