/*

to extract info about a price list, go to a "Pricing plan" in the management tab
(e.g. https://reservise.com/management/pricingplan/359/)

and run

```js
{
  const list = document.querySelector('.objects-list ul')
  const data = [...list.querySelectorAll('a')].map((e) => ({ name: e.innerText.trim(), id: e.href.match(/(\d+)/)[1] }))
  console.log(Object.fromEntries(data.map((e) => [e.id, { name: e.name, cards: null }])))
}
```

then, edit as needed and paste here

*/

export const VENUE_PRICE_INFO = {
  80: {
    name: "SquashCity Jerozolimskie 200",
    class_prices: {
      benefit: 1646,
    },
    price_default: 5163,
    prices: {
      null: { cards: 0, name: "Własna cena" },

      //======================================================
      // Old
      // https://reservise.com/management/pricingplan/359/
      //======================================================

      1707: { cards: 0, name: "Cennik Standardowy" },
      1708: {
        cards: 1,
        name: "Mam 1 Kartę MultiSport Plus/FitProfit/OK System",
      },
      1709: {
        cards: 2,
        name: "Mam 2 Karty MultiSport Plus/FitProfit/OK System",
      },
      1710: { cards: 1, name: "Mam 1 Kartę OK System Gold" },
      1711: { cards: 0, name: "Karnet 5h" },
      1713: { cards: 1, name: "Karnet 5h - 1 karta zniżkowa" },
      1712: { cards: 0, name: "Karnet 10h" },
      1714: { cards: 1, name: "Karnet 10h - 1 karta zniżkowa" },
      1936: { cards: 2, name: "Karnet 10h - 2 karty zniżkowe" },
      1757: { cards: 0, name: "Juniorzy, Studenci (<26l) - 1h" },
      1758: { cards: 1, name: "Juniorzy, Studenci (<26l) - 1 karta zniżkowa" },
      1759: { cards: 2, name: "Juniorzy, Studenci (<26l) - 2 karty zniżkowe" },
      1760: { cards: 0, name: "Open Juniorzy, Studenci (<26 l)  - karnet 5h" },
      1762: {
        cards: 1,
        name: "Open Juniorzy, Studenci (<26 l)  - karnet 5h - jedna karta zniżkowa",
      },
      1761: { cards: 0, name: "Open Juniorzy, Studenci (<26 l)  - karnet 10h" },
      1763: {
        cards: 1,
        name: "Open Juniorzy, Studenci (<26 l)  - karnet 10h - jedna karta zniżkowa",
      },
      1754: { cards: 0, name: "Decathlon - cena hurtowa" },
      1755: { cards: 0, name: "Sekcja - cena hurtowa" },
      1756: { cards: 0, name: "Liga - cena hurtowa" },
      1918: { cards: 0, name: "Cennik trenerski" },
      3107: { cards: 0, name: "DoRozliczenia" },
      2380: { cards: 0, name: "__Goodie z kodem" },

      //======================================================
      // Some weird intermediate garbage
      // https://reservise.com/management/pricingplan/634/
      //======================================================

      2673: {
        cards: 0,
        name: "Karnet 10 h",
      },
      2674: {
        cards: 0,
        name: "Karnet 5h",
      },
      2675: {
        cards: 0,
        name: "Open Juniorzy, Studenci (<26 l) - karnet 10h",
      },
      2676: {
        cards: 0,
        name: "Open Juniorzy, Studenci (<26 l) - karnet 5h",
      },
      2677: {
        cards: 0,
        name: "Cennik Standardowy",
      },
      2678: {
        cards: 0,
        name: "Cennik trenerski",
      },
      2683: {
        cards: 1,
        name: "Mam 1 Kartę Multisport Plus/FitProfit/OK System",
      },
      2684: {
        cards: 2,
        name: "Mam 2 Karty MultiSport Plus/FitProfit/OK System",
      },
      2685: {
        cards: 1,
        name: "Mam 1 Kartę OK System Gold",
      },
      2686: {
        cards: 1,
        name: "Karnet 5h - 1 karta zniżkowa",
      },
      2687: {
        cards: 1,
        name: "Karnet 10h - 1 karta zniżkowa",
      },
      2688: {
        cards: 2,
        name: "Karnet 10h - 2 karty zniżkowe",
      },
      2743: {
        cards: 0,
        name: "Juniorzy, Studenci (<26l)",
      },
      2988: {
        cards: 0,
        name: "Korty dla Pań 25 zł (28-29-.09.19)",
      },
      2989: {
        cards: 0,
        name: "Korty dla Pań 25 zł z kartą zniżkową (28-29-.09.19)",
      },

      //======================================================
      // 2024
      // https://reservise.com/management/pricingplan/1145/
      //======================================================

      5163: { cards: 0, name: "Cennik Standardowy" },
      5164: {
        cards: 1,
        name: "Mam 1 Kartę MultiSport Plus/FitProfit/Medicover Sport",
      },
      5165: {
        cards: 2,
        name: "Mam 2 Karty MultiSport Plus/FitProfit/Medicover Sport",
      },
      5166: { cards: 0, name: "Juniorzy, Studenci (<26l)" },
      5167: {
        cards: 1,
        name: "Juniorzy, Studenci (<26l) - 1 Karta MultiSport Plus/FitProfit/Medicover Sport",
      },
      5168: {
        cards: 2,
        name: "Juniorzy, Studenci (<26l) - 2 karty MultiSport Plus/FitProfit/Medicover Sport",
      },
      5169: { cards: 0, name: "Cennik trenerski" },
      5170: { cards: 0, name: "ROZLICZENIA-LIGI" },
      5177: { cards: 0, name: "Karnet 10h" },
      5178: { cards: 1, name: "Karnet 10h - 1 karta zniżkowa" },
      5179: { cards: 2, name: "Karnet 10h - 2 karty zniżkowe" },
      5180: { cards: 0, name: "Karnet 5h" },
      5181: { cards: 1, name: "Karnet 5h - 1 karta zniżkowa" },
      5182: { cards: 0, name: "karnet 10h Juniorzy, Studenci (<26 l)" },
      5183: {
        cards: 1,
        name: "karnet 10h Juniorzy, Studenci (<26 l) - 1 karta zniżkowa",
      },
    },
    carnets: {
      355: { cards: 0, name: "Karnet OPEN 5h, pn-pt 9-17" },
      356: { cards: 0, name: "Karnet OPEN 5h, pn-pt 17-23" },
      357: { cards: 0, name: "Karnet OPEN 5h, sb-nd" },
      358: { cards: 0, name: "Karnet OPEN 10h, pn-pt 9-17" },
      359: { cards: 0, name: "Karnet OPEN 10h, pn-pt 17-23" },
      360: { cards: 0, name: "Karnet OPEN 10h, sb-nd" },
      361: { cards: 1, name: "Karnet OPEN 5h, pn-pt 9-17 + 1 karta zniżkowa" },
      362: { cards: 1, name: "Karnet OPEN 5h, pn-pt 17-23 + 1 karta zniżkowa" },
      363: { cards: 1, name: "Karnet OPEN 5h, sb-nd + 1 karta zniżkowa" },
      364: { cards: 1, name: "Karnet OPEN 10h, pn-pt 9-17 + 1 karta zniżkowa" },
      365: {
        cards: 1,
        name: "Karnet OPEN 10h, pn-pt 17-23 + 1 karta zniżkowa ",
      },
      366: { cards: 1, name: "Karnet OPEN 10h, sb-nd + 1 karta zniżkowa" },
      376: { cards: 0, name: "Karnet JUNIOR OPEN 5h, pn-pt 9-16" },
      476: { cards: 0, name: "Karnet OPEN 5h, pn-pt 7-9" },
      477: { cards: 1, name: "Karnet OPEN 5h, pn-pt 7-9 + 1 karta zniżkowa" },
      478: { cards: 1, name: "Karnet OPEN 10h, pn-pt 7-9 + 1 karta zniżkowa" },
      479: { cards: 0, name: "Karnet OPEN 10h, pn-pt 7-9" },
      480: {
        cards: 1,
        name: "Karnet JUNIOR OPEN 5h, pn-pt 9-16 + 1 karta zniżkowa",
      },
      481: {
        cards: 1,
        name: "Karnet JUNIOR OPEN 10h, pn-pt 9-16 + 1 karta zniżkowa",
      },
      482: { cards: 0, name: "Karnet JUNIOR OPEN 10h, pn-pt 9-16" },
      501: { cards: 2, name: "Karnet OPEN 10h, sb-nd + 2 karty zniżkowe" },
      502: { cards: 2, name: "Karnet OPEN 10h, pn-pt 7-9 + 2 karty zniżkowe" },
      503: {
        cards: 2,
        name: "Karnet OPEN 10h, pn-pt 17-23 + 2 karty zniżkowe",
      },
      504: { cards: 2, name: "Karnet OPEN 10h, pn-pt 9-17 + 2 karty zniżkowe" },

      //==================
      // 2024
      //==================

      1374: { cards: 0, name: "Carnet OPEN 10h, pn-pt 7-9 (450.00) 112days" },
      1375: { cards: 0, name: "Carnet OPEN 10h, pn-pt 9-17 (350.00) 112days" },
      1376: { cards: 0, name: "Carnet OPEN 10h, pn-pt 17-23 (650.00) 112days" },
      1377: { cards: 0, name: "Carnet OPEN 10h, sb-nd (550.00) 112days" },
      1378: {
        cards: 1,
        name: "Carnet OPEN 10h, pn-pt 7-9 + 1 karta zniżkowa (300.00) 112days",
      },
      1379: {
        cards: 1,
        name: "Carnet OPEN 10h, pn-pt 9-17 + 1 karta zniżkowa (200.00) 112days",
      },
      1380: {
        cards: 1,
        name: "Carnet OPEN 10h, pn-pt 17-23 + 1 karta zniżkowa (500.00) 112days",
      },
      1381: {
        cards: 1,
        name: "Carnet OPEN 10h, sb-nd + 1 karta zniżkowa (400.00) 112days",
      },
      1382: {
        cards: 2,
        name: "Carnet OPEN 10h, pn-pt 7-9 + 2 karty zniżkowe (150.00) 112days",
      },
      1383: {
        cards: 2,
        name: "Carnet OPEN 10h, pn-pt 9-17 + 2 karty zniżkowe (50.00) 112days",
      },
      1384: {
        cards: 2,
        name: "Carnet OPEN 10h, sb-nd + 2 karty zniżkowe (250.00) 112days",
      },
      1385: { cards: 0, name: "Carnet OPEN 5h, pn-pt 9-17 (200.00) 56days" },
      1386: {
        cards: 0,
        name: "Carnet JUNIOR OPEN 10h, pn-pt 9-16 (300.00) 112days",
      },
      1398: {
        cards: 2,
        name: "Carnet Open 10h pn-pt, 17-23 + 2 karty zniżkowe (350.00) 24days",
      },
    },
  },
  82: {
    name: "SquashCity Targówek",
    price_default: 1540,
    class_prices: {
      benefit: 1646,
    },
    prices: {
      null: { cards: 0, name: "Własna cena" },
      1540: { cards: 0, name: "Standardowy" },
      1541: { cards: 0, name: "Juniorzy, Studenci (<26l) - 1h" },
      1542: { cards: 1, name: "1 karta Multisport Plus/FitProfit/OK System" },
      1543: { cards: 2, name: "2 karty Multisport Plus/FitProfit/OK System" },
      1547: { cards: 0, name: "Karnet 5h" },
      1539: { cards: 1, name: "Karnet 5h - 1 karta zniżkowa" },
      1959: { cards: 0, name: "Karnet 10h" },
      1960: { cards: 1, name: "Karnet 10h - 1 karta zniżkowa" },
      1961: { cards: 2, name: "Karnet 10h - 2 Karty zniżkowe" },
      2961: { cards: 0, name: "Karnet Liga" },
      3108: { cards: 0, name: "DoRozliczenia" },
      1617: { cards: 0, name: "Cennik trenerski" },
      2984: { cards: 0, name: "Korty dla Pań 25 zł (28-29.09.19)" },
      2985: { cards: 1, name: "Korty dla Pań z kartą zniżkową (28-29.09.19)" },
      2986: { cards: 0, name: "Korty dla Pań 50% taniej (27.09.19)" },
      2987: {
        cards: 1,
        name: "Korty dla Pań 50% taniej z kartą zniżkową  (27.09.19)",
      },
      1546: { cards: 0, name: "XXX - do usunięcia: 7:00 - 17:00" },
      1548: { cards: 0, name: "XXX - do usunięcia: weekend 9:00 - 22:00" },
      1549: { cards: 0, name: "STARE: 1 wejście, OPEN" },
      1572: { cards: 0, name: "STARE: Zgrana paka, 1 wejście (pon-czw)" },
    },
    carnets: {
      380: { cards: 0, name: "Carnet OPEN 10h, pn-pt 7-17" },
      381: { cards: 0, name: "Carnet OPEN 10h, pn-pt 17-23" },
      382: { cards: 0, name: "Carnet OPEN 10h, sb-nd" },
      391: { cards: 1, name: "Carnet OPEN 10h, pn-pt 7-17 + 1 Karta zniżkowa" },
      392: {
        cards: 1,
        name: "Carnet OPEN 10h, pn-pt 17-23 + 1 Karta zniżkowa",
      },
      393: { cards: 1, name: "Carnet OPEN 10h, sb-nd  + 1 Karta zniżkowa" },
      394: {
        cards: 2,
        name: "Carnet OPEN 10h, pn-pt 17-23 + 2 Karty zniżkowe",
      },
      395: { cards: 2, name: "Carnet OPEN 10h, sb-nd + 2 Karty zniżkowe" },
      377: { cards: 0, name: "Carnet OPEN 5h, pn-pt 7-17" },
      378: { cards: 0, name: "Carnet OPEN 5h, pn-pt 17-23" },
      379: { cards: 0, name: "Carnet OPEN 5h, sb-nd" },
      385: { cards: 1, name: "Carnet OPEN 5h, pn-pt 7-17 + 1 Karta zniżkowa" },
      386: { cards: 1, name: "Carnet OPEN 5h, pn-pt 17-23 + 1 Karta zniżkowa" },
      387: { cards: 1, name: "Carnet OPEN 5h, sb-nd + 1 Karta zniżkowa" },
      398: { cards: 0, name: "Carnet JUNIOR OPEN 10h, pn-pt 7-16" },
      397: {
        cards: 1,
        name: "Carnet JUNIOR OPEN 10h, pn-pt 7-16 + 1 Karta zniżkowa",
      },
      384: { cards: 0, name: "Carnet JUNIOR OPEN 5h" },
      383: { cards: 0, name: "Carnet JUNIOR OPEN 5h, pn-pt 7-16" },
      396: {
        cards: 1,
        name: "Carnet JUNIOR OPEN 5h, pn-pt 7-16 + 1 Karta zniżkowa",
      },
      306: { cards: 0, name: "Carnet OPEN 10h" },
      325: { cards: 0, name: "Carnet  Zgrana Paka - Weekend" },
      326: { cards: 0, name: "Carnet Zgrana paka" },
    },
  },
};
