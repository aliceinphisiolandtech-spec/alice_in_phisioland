import { describe, expect, it } from "vitest";
import { buildCsv, csvCell, csvFilename, csvRow } from "@/lib/csv";

describe("csvCell", () => {
  it("zwykły tekst zostaje bez zmian", () => {
    expect(csvCell("jan@kowalski.pl")).toBe("jan@kowalski.pl");
  });

  it("puste wartości dają pustą komórkę", () => {
    expect(csvCell(null)).toBe("");
    expect(csvCell(undefined)).toBe("");
    expect(csvCell("")).toBe("");
  });

  it("cytuje komórkę zawierającą separator", () => {
    expect(csvCell("Kowalski; Jan")).toBe('"Kowalski; Jan"');
  });

  it("podwaja cudzysłowy w środku i cytuje całość", () => {
    expect(csvCell('Ala ma "kota"')).toBe('"Ala ma ""kota"""');
  });

  it("cytuje komórkę ze złamaniem linii", () => {
    expect(csvCell("pierwsza\ndruga")).toBe('"pierwsza\ndruga"');
  });

  describe("neutralizacja formuł (CSV injection)", () => {
    it("poprzedza apostrofem wartość zaczynającą się od =", () => {
      expect(csvCell("=1+1")).toBe("'=1+1");
    });

    it("obejmuje także +, - oraz @", () => {
      expect(csvCell("+42")).toBe("'+42");
      expect(csvCell("-42")).toBe("'-42");
      expect(csvCell("@SUM(A1)")).toBe("'@SUM(A1)");
    });

    it("apostrof trafia DO ŚRODKA cudzysłowów, gdy komórka wymaga cytowania", () => {
      // Gdyby kolejność była odwrotna, apostrof wylądowałby poza cudzysłowem
      // i Excel potraktowałby zawartość jako formułę mimo neutralizacji.
      expect(csvCell('=HYPERLINK("http://zly.pl")')).toBe(
        "\"'=HYPERLINK(\"\"http://zly.pl\"\")\"",
      );
    });

    it("nie rusza wartości, która tylko zawiera = w środku", () => {
      expect(csvCell("a=b")).toBe("a=b");
    });
  });
});

describe("csvRow", () => {
  it("skleja komórki średnikiem", () => {
    expect(csvRow(["a", "b", 3])).toBe("a;b;3");
  });
});

describe("buildCsv", () => {
  it("zaczyna się BOM-em, żeby Excel czytał UTF-8", () => {
    expect(buildCsv(["e-mail"], [["jan@kowalski.pl"]]).startsWith("﻿")).toBe(
      true,
    );
  });

  it("rozdziela wiersze CRLF i kończy plik złamaniem linii", () => {
    const csv = buildCsv(["a", "b"], [["1", "2"]]);

    expect(csv).toBe("﻿a;b\r\n1;2\r\n");
  });

  it("radzi sobie z pustą listą wierszy", () => {
    expect(buildCsv(["e-mail"], [])).toBe("﻿e-mail\r\n");
  });
});

describe("csvFilename", () => {
  it("rozkłada polskie znaki i skleja człony myślnikiem", () => {
    expect(csvFilename(["zapisy", "Późne Lato"])).toBe("zapisy-pozne-lato.csv");
  });

  it("nie zostawia myślników na krańcach", () => {
    expect(csvFilename(["  ...lato!!!  "])).toBe("lato.csv");
  });

  it("ma sensowną nazwę awaryjną, gdy nic nie zostanie", () => {
    expect(csvFilename(["???"])).toBe("eksport.csv");
  });
});
