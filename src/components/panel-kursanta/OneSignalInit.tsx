"use client";

import OneSignal from "react-onesignal";

/**
 * Uruchomienie OneSignala — WYŁĄCZNIE na żądanie użytkowniczki.
 *
 * Wcześniej SDK startowało samo, z głównego layoutu, czyli na każdej stronie
 * serwisu i każdemu odwiedzającemu — także komuś, kto nigdy się nie zaloguje
 * i nigdy nie zechce powiadomień. OneSignal rejestruje przy starcie service
 * workera i zapisuje identyfikatory w przeglądarce, a to jest zapis na
 * urządzeniu: push nie jest funkcją niezbędną do działania strony, więc nie
 * mieści się w wyjątku od zgody. Dodatkowo dostawca przetwarza w USA, więc
 * im mniej osób go w ogóle dotyka, tym węższy transfer.
 *
 * Dlatego nie ma tu już komponentu montowanego w drzewie. Jest funkcja, którą
 * wołają wyłącznie miejsca, w których użytkownik sam prosi o powiadomienia.
 *
 * Do tego dokładamy bramkę zgody samego dostawcy (`setConsentRequired` +
 * `setConsentGiven` z dokumentacji OneSignala). Wygląda to na podwójne
 * zabezpieczenie i jest nim celowo — ale nie chodzi o samą ostrożność:
 * bez bramki dostawcy NIE MA JAK zgody cofnąć. `setConsentGiven(false)`
 * to jedyna droga, żeby raz uruchomiony SDK przestał zbierać dane, a zgodę
 * trzeba dać się wycofać równie łatwo, jak się jej udziela.
 *
 * Poza produkcją SDK i tak odmawia działania: aplikacja w panelu OneSignal
 * jest przypięta do https://aliceinphysioland.pl, więc na localhoście zostaje
 * w konsoli „Can only be used on: …". Stąd bezpiecznik na środowisko —
 * do prób lokalnych (np. przez tunel HTTPS na właściwej domenie) wystarczy
 * NEXT_PUBLIC_ONESIGNAL_DEV=true w .env.
 */

const IS_DEV = process.env.NODE_ENV !== "production";
const FORCE_IN_DEV = process.env.NEXT_PUBLIC_ONESIGNAL_DEV === "true";

export const ONESIGNAL_ENABLED = !IS_DEV || FORCE_IN_DEV;

/**
 * Pamięć na trwający albo zakończony start SDK.
 *
 * `OneSignal.init()` wolno zawołać tylko raz na całe życie strony — drugie
 * wywołanie rzuca błędem. Trzymamy więc obietnicę z pierwszego wywołania
 * i przy kolejnych oddajemy tę samą, zamiast startować od nowa. Zmienna
 * modułowa, a nie stan komponentu, bo dotyczy całej karty przeglądarki,
 * a nie tego, co akurat jest wyrenderowane.
 */
let initPromise: Promise<boolean> | null = null;

/**
 * Startuje SDK i zwraca informację, czy się udało.
 *
 * `false` znaczy „nie ma po co iść dalej" — albo jesteśmy poza produkcją,
 * albo brakuje identyfikatora aplikacji, albo SDK odmówiło startu.
 */
export function initOneSignal(): Promise<boolean> {
  if (initPromise) return initPromise;

  const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;

  if (!ONESIGNAL_ENABLED || !appId) {
    initPromise = Promise.resolve(false);
    return initPromise;
  }

  // Bramka zgody musi być postawiona PRZED `init` — po nim SDK zdążyłby już
  // zebrać dane. Tak każe dokumentacja OneSignala i tak też się zachowuje:
  // wywołania metod sprzed zgody są po cichu ignorowane.
  OneSignal.setConsentRequired(true);

  initPromise = OneSignal.init({
    appId,
    // Dzwonek OneSignala wyłączony — mamy własny przełącznik w profilu i dwa
    // sterowania obok siebie tylko myliłyby. Typy SDK wymagają przy tym polu
    // kompletu ustawień wyglądu dzwonka, który i tak się nie pojawi, więc
    // asercję zawężamy do tego jednego pola zamiast rozluźniać całe wywołanie.
    notifyButton: { enable: false } as NonNullable<
      NonNullable<Parameters<typeof OneSignal.init>[0]>["notifyButton"]
    >,
    // Zalecane przez dostawcę: po wyczyszczeniu danych przeglądarki subskrypcja
    // odtwarza się sama, zamiast cicho przestać działać.
    autoResubscribe: true,
  })
    .then(() => {
      // Do tego miejsca dochodzimy wyłącznie z kliknięcia „Włącz", więc zgoda
      // już padła — otwieramy bramkę od razu po starcie SDK.
      OneSignal.setConsentGiven(true);
      return true;
    })
    .catch((error) => {
      console.error("Nie udało się uruchomić OneSignal:", error);
      // Zerujemy pamięć, żeby kolejne kliknięcie mogło spróbować jeszcze raz —
      // powodem bywa chwilowy brak sieci, a nie trwała awaria.
      initPromise = null;
      return false;
    });

  return initPromise;
}

/**
 * Wycofanie zgody — druga strona `initOneSignal`.
 *
 * `optOut` idzie PRZED odebraniem zgody, bo po zamknięciu bramki SDK ignoruje
 * kolejne wywołania: odwrotna kolejność zostawiłaby urządzenie zapisane
 * do wysyłki. Samego pozwolenia przeglądarki stąd nie cofniemy — to potrafi
 * wyłącznie użytkownik w jej ustawieniach — ale po tym wywołaniu dostawca
 * przestaje zbierać dane i przestaje wysyłać.
 */
export async function revokeOneSignalConsent(): Promise<void> {
  if (!initPromise) return;

  try {
    await OneSignal.User.PushSubscription.optOut();
    OneSignal.setConsentGiven(false);
  } catch (error) {
    console.error("Nie udało się wycofać zgody w OneSignal:", error);
  }
}

/**
 * Czy przeglądarka ma już zgodę na powiadomienia.
 *
 * Pytamy natywnego API, a nie OneSignala: to działa bez uruchamiania SDK,
 * więc ekran profilu może pokazać stan, nie dotykając dostawcy.
 */
export function hasPushPermission(): boolean {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return false;
  }

  return Notification.permission === "granted";
}

/**
 * Nasza własna pamięć decyzji — osobno od pozwolenia przeglądarki.
 *
 * Są to DWIE różne rzeczy i mylenie ich daje ekran, który kłamie. Pozwolenia
 * raz udzielonego przeglądarce nie da się cofnąć ze strony (potrafi to tylko
 * użytkownik w jej ustawieniach), więc po wyłączeniu powiadomień u nas
 * `Notification.permission` dalej zwraca „granted". Gdyby ekran profilu czytał
 * wyłącznie to, po kliknięciu „Wyłącz" nadal pokazywałby „włączone".
 */
const CONSENT_KEY = "aip-push-consent";

/**
 * Czy powiadomienia mają być traktowane jako włączone.
 *
 * Wymaga OBU rzeczy naraz: pozwolenia przeglądarki i braku naszego wyłączenia.
 * Brak wpisu przy udzielonym pozwoleniu czytamy jako „włączone" — tak wygląda
 * urządzenie, na którym ktoś włączył powiadomienia, zanim ten przełącznik
 * w ogóle powstał.
 */
export function isPushEnabled(): boolean {
  if (!hasPushPermission()) return false;

  try {
    return window.localStorage.getItem(CONSENT_KEY) !== "off";
  } catch {
    // Tryb prywatny potrafi zablokować localStorage. Wtedy zdanie decyduje
    // pozwolenie przeglądarki — lepiej to niż wywrócony ekran profilu.
    return true;
  }
}

export function rememberPushChoice(enabled: boolean): void {
  try {
    window.localStorage.setItem(CONSENT_KEY, enabled ? "on" : "off");
  } catch {
    /* patrz wyżej — brak pamięci nie może zablokować samej operacji */
  }
}
