import { describe, expect, it } from "vitest";
import {
  classifyEmailProvider,
  emailDomain,
  needsGoogleEmailConfirmation,
} from "@/lib/google-email";

/**
 * Testy rozpoznawania konta Google przy zapisie na listę.
 *
 * Kluczowe jest tu jedno rozróżnienie: własna domena MUSI wychodzić jako
 * „nie wiadomo", a nie jako „nie Google" — bo od tego zależy, czy klientka
 * z firmowym Workspace zobaczy komunikat „to nie jest konto Google" (nieprawdę)
 * czy „jeśli to Workspace, wszystko gra".
 */

describe("emailDomain", () => {
  it("wyciąga domenę i sprowadza ją do małych liter", () => {
    expect(emailDomain("  Jan.Kowalski@GMAIL.com ")).toBe("gmail.com");
  });

  it("bierze ostatni znak @ — wcześniejsze mogą siedzieć w części lokalnej", () => {
    expect(emailDomain('"dziwny@adres"@klinika.pl')).toBe("klinika.pl");
  });

  it("zwraca null, gdy brakuje którejś strony adresu", () => {
    expect(emailDomain("jan.kowalski")).toBeNull();
    expect(emailDomain("@gmail.com")).toBeNull();
    expect(emailDomain("jan@")).toBeNull();
  });
});

describe("classifyEmailProvider", () => {
  it("rozpoznaje domeny Google", () => {
    expect(classifyEmailProvider("jan@gmail.com")).toBe("google");
    expect(classifyEmailProvider("jan@googlemail.com")).toBe("google");
    expect(classifyEmailProvider("JAN@Gmail.COM")).toBe("google");
  });

  it("rozpoznaje znanych dostawców spoza Google", () => {
    for (const email of [
      "anna@wp.pl",
      "anna@o2.pl",
      "anna@interia.pl",
      "anna@poczta.onet.pl",
      "anna@outlook.com",
      "anna@icloud.com",
    ]) {
      expect(classifyEmailProvider(email)).toBe("foreign");
    }
  });

  it("własną domenę zostawia jako 'unknown' — to może być Google Workspace", () => {
    expect(classifyEmailProvider("anna@klinika-ruchu.pl")).toBe("unknown");
    expect(classifyEmailProvider("biuro@kocikdev.com")).toBe("unknown");
  });

  it("nie daje się nabrać domenie, która tylko kończy się jak gmail", () => {
    expect(classifyEmailProvider("anna@niegmail.com")).toBe("unknown");
    expect(classifyEmailProvider("anna@mojegmail.com.pl")).toBe("unknown");
  });

  it("literówka w gmailu nie przechodzi jako Google", () => {
    // Ważne, bo to jedyny moment, w którym da się ją jeszcze poprawić —
    // pytanie w oknie potwierdzenia każe spojrzeć na wpisany adres.
    expect(classifyEmailProvider("anna@gmial.com")).not.toBe("google");
    expect(classifyEmailProvider("anna@gmail.con")).not.toBe("google");
  });
});

describe("needsGoogleEmailConfirmation", () => {
  it("pyta o wszystko poza pewnym Google", () => {
    expect(needsGoogleEmailConfirmation("anna@gmail.com")).toBe(false);
    expect(needsGoogleEmailConfirmation("anna@wp.pl")).toBe(true);
    expect(needsGoogleEmailConfirmation("anna@klinika-ruchu.pl")).toBe(true);
  });
});
