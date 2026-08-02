import type { Metadata } from "next";
import { PatientZonePage } from "@/components/site/patient-zone/PatientZonePage";
import React from "react";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildMetadata, physioBusinessSchema } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Strefa Pacjenta — fizjoterapeuta Warszawa",
  description:
    "Umów wizytę u fizjoterapeutki Alicji Wójcik w Warszawie. Diagnostyka różnicowa, terapia i edukacja pacjenta. Dowiedz się, jak przygotować się do wizyty.",
  path: "/strefa-pacjenta",
  keywords: [
    "fizjoterapeuta Warszawa",
    "fizjoterapia Warszawa",
    "wizyta fizjoterapeuta",
    "rehabilitacja Warszawa",
    "Alicja Wójcik fizjoterapeuta",
  ],
});

const page = () => {
  return (
    <>
      <JsonLd data={physioBusinessSchema()} />
      <PatientZonePage />
    </>
  );
};

export default page;
