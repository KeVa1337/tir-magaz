import type { VehicleKind } from "@prisma/client";

export interface SeedEngine { code: string; powerHp?: number; euroClass?: string }
export interface SeedSeries { name: string; slug: string; yearFrom?: number; yearTo?: number; engines: SeedEngine[] }
export interface SeedMake {
  name: string; slug: string; kind: VehicleKind; wmi: string[]; country: string; series: SeedSeries[];
}

// WMI-коди — стартова таблиця, ПЕРЕВІРИТИ перед продакшеном (SPEC.md §9).
export const MAKES: SeedMake[] = [
  {
    name: "DAF", slug: "daf", kind: "TRACTOR", wmi: ["XLR"], country: "Нідерланди",
    series: [
      { name: "XF 105", slug: "xf-105", yearFrom: 2005, yearTo: 2013, engines: [
        { code: "MX-340", powerHp: 460, euroClass: "Euro 5" }, { code: "MX-375", powerHp: 510, euroClass: "Euro 5" } ] },
      { name: "XF 106", slug: "xf-106", yearFrom: 2013, yearTo: 2021, engines: [
        { code: "MX-13", powerHp: 480, euroClass: "Euro 6" }, { code: "MX-11", powerHp: 440, euroClass: "Euro 6" } ] },
      { name: "CF 85", slug: "cf-85", yearFrom: 2001, yearTo: 2013, engines: [
        { code: "MX-265", powerHp: 360, euroClass: "Euro 5" }, { code: "PR-228", powerHp: 310, euroClass: "Euro 5" } ] },
    ],
  },
  {
    name: "MAN", slug: "man", kind: "TRACTOR", wmi: ["WMA"], country: "Німеччина",
    series: [
      { name: "TGX", slug: "tgx", yearFrom: 2007, yearTo: 2020, engines: [
        { code: "D2676 LF", powerHp: 480, euroClass: "Euro 5" }, { code: "D2066 LF", powerHp: 440, euroClass: "Euro 5" } ] },
      { name: "TGS", slug: "tgs", yearFrom: 2007, yearTo: 2020, engines: [
        { code: "D2066 LF", powerHp: 400, euroClass: "Euro 5" } ] },
      { name: "TGA", slug: "tga", yearFrom: 2000, yearTo: 2008, engines: [
        { code: "D2876 LF", powerHp: 460, euroClass: "Euro 3" }, { code: "D2066 LF", powerHp: 410, euroClass: "Euro 4" } ] },
    ],
  },
  {
    name: "Volvo", slug: "volvo", kind: "TRACTOR", wmi: ["YV2"], country: "Швеція",
    series: [
      { name: "FH4", slug: "fh4", yearFrom: 2012, yearTo: 2020, engines: [
        { code: "D13K", powerHp: 460, euroClass: "Euro 6" } ] },
      { name: "FH3", slug: "fh3", yearFrom: 2008, yearTo: 2012, engines: [
        { code: "D13A", powerHp: 440, euroClass: "Euro 5" }, { code: "D13C", powerHp: 460, euroClass: "Euro 5" } ] },
      { name: "FM", slug: "fm", yearFrom: 2013, yearTo: 2021, engines: [
        { code: "D11K", powerHp: 410, euroClass: "Euro 6" } ] },
    ],
  },
  {
    name: "Scania", slug: "scania", kind: "TRACTOR", wmi: ["YS2"], country: "Швеція",
    series: [
      { name: "R-series", slug: "r-series", yearFrom: 2004, yearTo: 2016, engines: [
        { code: "DC13", powerHp: 440, euroClass: "Euro 5" }, { code: "DC12", powerHp: 420, euroClass: "Euro 4" } ] },
      { name: "S-series", slug: "s-series", yearFrom: 2016, engines: [
        { code: "DC13 148", powerHp: 500, euroClass: "Euro 6" } ] },
      { name: "G-series", slug: "g-series", yearFrom: 2009, yearTo: 2016, engines: [
        { code: "DC09", powerHp: 360, euroClass: "Euro 5" } ] },
    ],
  },
  {
    name: "Mercedes-Benz", slug: "mercedes-benz", kind: "TRACTOR", wmi: ["WDB", "W1T"], country: "Німеччина",
    series: [
      { name: "Actros MP4", slug: "actros-mp4", yearFrom: 2011, yearTo: 2018, engines: [
        { code: "OM471", powerHp: 449, euroClass: "Euro 6" } ] },
      { name: "Actros MP3", slug: "actros-mp3", yearFrom: 2008, yearTo: 2011, engines: [
        { code: "OM501LA", powerHp: 435, euroClass: "Euro 5" }, { code: "OM502LA", powerHp: 503, euroClass: "Euro 5" } ] },
      { name: "Axor", slug: "axor", yearFrom: 2001, yearTo: 2013, engines: [
        { code: "OM457LA", powerHp: 428, euroClass: "Euro 5" } ] },
    ],
  },
  {
    name: "Renault Trucks", slug: "renault-trucks", kind: "TRACTOR", wmi: ["VF6"], country: "Франція",
    series: [
      { name: "Premium", slug: "premium", yearFrom: 2006, yearTo: 2013, engines: [
        { code: "DXi11", powerHp: 450, euroClass: "Euro 5" } ] },
      { name: "T-series", slug: "t-series", yearFrom: 2013, engines: [
        { code: "DTI13", powerHp: 480, euroClass: "Euro 6" }, { code: "DTI11", powerHp: 430, euroClass: "Euro 6" } ] },
      { name: "Magnum", slug: "magnum", yearFrom: 2005, yearTo: 2013, engines: [
        { code: "DXi13", powerHp: 480, euroClass: "Euro 5" } ] },
    ],
  },
  {
    name: "Iveco", slug: "iveco", kind: "TRACTOR", wmi: ["ZCF"], country: "Італія",
    series: [
      { name: "Stralis", slug: "stralis", yearFrom: 2007, yearTo: 2019, engines: [
        { code: "Cursor 10", powerHp: 420, euroClass: "Euro 5" }, { code: "Cursor 13", powerHp: 500, euroClass: "Euro 5" } ] },
      { name: "S-Way", slug: "s-way", yearFrom: 2019, engines: [
        { code: "Cursor 13 NP", powerHp: 490, euroClass: "Euro 6" } ] },
    ],
  },
  {
    name: "Schmitz Cargobull", slug: "schmitz-cargobull", kind: "TRAILER", wmi: ["WSM"], country: "Німеччина",
    series: [
      { name: "S.KO Cool", slug: "sko-cool", yearFrom: 2005, engines: [] },
      { name: "S.CS Curtainsider", slug: "scs-curtainsider", yearFrom: 2005, engines: [] },
    ],
  },
  {
    name: "Krone", slug: "krone", kind: "TRAILER", wmi: ["WKE"], country: "Німеччина",
    series: [
      { name: "Profi Liner", slug: "profi-liner", yearFrom: 2004, engines: [] },
      { name: "Cool Liner", slug: "cool-liner", yearFrom: 2006, engines: [] },
    ],
  },
  {
    name: "Kögel", slug: "koegel", kind: "TRAILER", wmi: ["WK0"], country: "Німеччина",
    series: [
      { name: "Cargo", slug: "cargo", yearFrom: 2008, engines: [] },
      { name: "Mega", slug: "mega", yearFrom: 2008, engines: [] },
    ],
  },
];

export const AXLE_BRANDS = ["BPW", "SAF", "ROR"] as const;
