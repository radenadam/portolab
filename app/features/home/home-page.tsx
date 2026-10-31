import type { ReactNode } from "react";
import { Link } from "react-router";
import { m } from "~/paraglide/messages.js";
import type { Route } from "./+types/home-page";

export function meta(): Route.MetaDescriptors {
  return [{ title: m.app_name() }];
}

export default function HomePage(): ReactNode {
  return (
    <>
      <h1>{m.app_name()}</h1>
      <p>{m.home_tagline()}</p>
      <p>
        <Link to="/prices">{m.home_prices_link()}</Link>
      </p>
    </>
  );
}
