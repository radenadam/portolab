import type { ReactNode } from "react";
import { pageTitle } from "~/page-title";
import { m } from "~/paraglide/messages.js";
import type { Route } from "./+types/privacy-page";
import { PrivacyNotice } from "./privacy-notice";

export function meta(): Route.MetaDescriptors {
  return [{ title: pageTitle(m.accounts_privacy_title()) }];
}

export default function PrivacyPage(): ReactNode {
  return (
    <>
      <h1>{m.accounts_privacy_title()}</h1>
      <PrivacyNotice />
    </>
  );
}
