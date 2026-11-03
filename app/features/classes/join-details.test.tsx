import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import { languageNames } from "~/language-names";
import type { AddressesForOthers } from "~/local-network.server";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { rupiah } from "~/units/rupiah";
import { JoinDetails } from "./join-details";

type JoinText =
  "addressLabel" | "share" | "localNetwork" | "severalNetworks" | "noNetwork";

// Intl puts a space that never breaks between the symbol of a currency and its amount.
const texts: Record<Locale, Record<JoinText, string>> = {
  id: {
    addressLabel: "Alamat untuk bergabung",
    share:
      "Bagikan kode atau alamat ini kepada mahasiswa Anda. Setiap mahasiswa yang bergabung mulai dengan uang virtual sebesar Rp\u00a0100.000.000.",
    localNetwork:
      'Anda membuka Portolab di "localhost", yang hanya dapat dibuka oleh komputer ini. Karena itu, alamat untuk bergabung mengarah ke komputer ini di jaringannya, yang dapat dibuka oleh ponsel di jaringan Wi-Fi yang sama. Jika ponsel tidak dapat membukanya, firewall komputer ini atau jaringan Wi-Fi itu memblokir koneksinya. Izinkan koneksi itu di firewall, atau gunakan jaringan yang membolehkan perangkat saling terhubung, misalnya hotspot ponsel.',
    severalNetworks:
      "Komputer ini terhubung ke beberapa jaringan, sehingga halaman ini menampilkan alamat di setiap jaringan, di bawah nama koneksinya. Berikan kepada mahasiswa Anda alamat di jaringan yang dipakai ponsel mereka.",
    noNetwork:
      'Ponsel belum dapat membuka Portolab, karena Anda membukanya di "localhost", yang hanya dapat dibuka oleh komputer ini, dan komputer ini tidak terhubung ke jaringan mana pun. Hubungkan komputer ini ke jaringan Wi-Fi kelas, lalu muat ulang halaman ini untuk melihat alamat yang dipakai mahasiswa Anda untuk bergabung. Setiap mahasiswa yang bergabung mulai dengan uang virtual sebesar Rp\u00a0100.000.000.',
  },
  en: {
    addressLabel: "Address for joining",
    share:
      "Share the code or the address with your students. Each student who joins starts with IDR\u00a0100,000,000 in virtual cash.",
    localNetwork:
      'You opened Portolab at "localhost", which only this computer can open. So the address for joining leads to this computer on its network, which phones on the same Wi-Fi network can open. When a phone cannot open it, the firewall of this computer or the Wi-Fi network blocks the connection. Allow the connection in the firewall, or use a network that lets devices reach each other, such as the hotspot of a phone.',
    severalNetworks:
      "This computer is on several networks, so the page shows the address on each, under the name of its connection. Give your students the address on the network that their phones use.",
    noNetwork:
      'Phones cannot open Portolab yet, because you opened it at "localhost", which only this computer can open, and this computer is on no network. Connect it to the Wi-Fi network of the class, then reload this page for the address that your students join with. Each student who joins starts with IDR\u00a0100,000,000 in virtual cash.',
  },
};

const wifi = {
  connectionName: "Wi-Fi",
  address: "http://192.0.2.20:3000/join/k7qm-4rxt",
};
const virtualMachine = {
  connectionName: "VMware Network Adapter VMnet8",
  address: "http://198.51.100.1:3000/join/k7qm-4rxt",
};

// The test renders the whole part of the page that the kind of address changes, so a sentence that holds in one kind and not in another, such as the request to share, fails where it does not hold.
function renderJoinDetails(joinAddresses: AddressesForOthers): string {
  return renderToStaticMarkup(
    <JoinDetails
      joinCode="k7qm-4rxt"
      joinAddresses={joinAddresses}
      startingCash={rupiah(100_000_000)}
    />,
  );
}

// React writes a quote in text as an entity, so a sentence is compared in the form that React writes it.
function asHtml(text: string): string {
  return renderToStaticMarkup(<>{text}</>);
}

/** Checks that the details show each text that the kind of address calls for, and none of the others. */
function expectTexts(
  html: string,
  locale: Locale,
  shown: readonly JoinText[],
): void {
  for (const [key, text] of Object.entries(texts[locale])) {
    if (shown.some((shownKey) => shownKey === key)) {
      expect(html, key).toContain(asHtml(text));
    } else {
      expect(html, key).not.toContain(asHtml(text));
    }
  }
}

for (const locale of locales) {
  const language = languageNames[locale];

  test(`asks to share the address that the lecturer opened, without a notice about the network, in ${language}`, () => {
    switchLocaleForTest(locale);
    const html = renderJoinDetails({
      kind: "asOpened",
      address: "https://portolab.example.ac.id/join/k7qm-4rxt",
    });
    expectTexts(html, locale, ["addressLabel", "share"]);
    expect(html).toContain("k7qm-4rxt");
    expect(html).toContain("https://portolab.example.ac.id/join/k7qm-4rxt");
  });

  test(`explains an address on the one network of the laptop in ${language}`, () => {
    switchLocaleForTest(locale);
    const html = renderJoinDetails({
      kind: "onLocalNetwork",
      openedHost: "localhost",
      addresses: [wifi],
    });
    expectTexts(html, locale, ["addressLabel", "share", "localNetwork"]);
    expect(html).toContain(wifi.connectionName);
    expect(html).toContain(wifi.address);
  });

  test(`explains how to choose among the addresses on several networks in ${language}`, () => {
    switchLocaleForTest(locale);
    const html = renderJoinDetails({
      kind: "onLocalNetwork",
      openedHost: "localhost",
      addresses: [virtualMachine, wifi],
    });
    expectTexts(html, locale, [
      "addressLabel",
      "share",
      "localNetwork",
      "severalNetworks",
    ]);
    for (const { connectionName, address } of [virtualMachine, wifi]) {
      expect(html).toContain(connectionName);
      expect(html).toContain(address);
    }
  });

  test(`tells a lecturer on no network to connect it, without an address or a request to share, in ${language}`, () => {
    switchLocaleForTest(locale);
    const html = renderJoinDetails({
      kind: "noNetwork",
      openedHost: "localhost",
    });
    expectTexts(html, locale, ["noNetwork"]);
    expect(html).toContain("k7qm-4rxt");
    expect(html).not.toContain("http");
  });
}
