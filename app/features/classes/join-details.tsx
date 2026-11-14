import { NumberText } from "~/number-text";
import type { ReactNode } from "react";
import { formatRupiah } from "~/formatting";
import type { AddressesForOthers } from "~/local-network.server";
import { m } from "~/paraglide/messages.js";
import type { Rupiah } from "~/units/rupiah";
import styles from "./classes.module.css";

/** What a lecturer shares so that students join a class: the code and the address, with the cash that each student starts with. The address is one that the phones of students can open, so a lecturer who opened Portolab at localhost learns the address of the laptop on its network instead, and a laptop on no network gets no request to share at all. */
export function JoinDetails({
  joinCode,
  joinAddresses,
  startingCash,
}: {
  joinCode: string;
  joinAddresses: AddressesForOthers;
  startingCash: Rupiah;
}): ReactNode {
  return (
    <>
      <ShareNotices
        joinAddresses={joinAddresses}
        cash={formatRupiah(startingCash)}
      />
      <dl className={styles["share"]}>
        <dt>{m.classes_code_label()}</dt>
        <dd className={styles["code"]}>
          <NumberText>{joinCode}</NumberText>
        </dd>
        <JoinAddresses joinAddresses={joinAddresses} />
      </dl>
    </>
  );
}

/** What the lecturer shares, and when the address leads to the laptop on its network, why it does and how to choose among several networks. A laptop on no network gets the reason that phones cannot open Portolab yet in place of the request to share. */
function ShareNotices({
  joinAddresses,
  cash,
}: {
  joinAddresses: AddressesForOthers;
  cash: string;
}): ReactNode {
  switch (joinAddresses.kind) {
    case "asOpened":
      return (
        <p>
          <NumberText>{m.classes_share_notice({ cash })}</NumberText>
        </p>
      );
    case "onLocalNetwork":
      return (
        <>
          <p>
            <NumberText>{m.classes_share_notice({ cash })}</NumberText>
          </p>
          <p>
            <NumberText>
              {m.classes_local_network_notice({
                host: joinAddresses.openedHost,
              })}
            </NumberText>
          </p>
          {joinAddresses.addresses.length > 1 && (
            <p>{m.classes_several_networks_notice()}</p>
          )}
        </>
      );
    case "noNetwork":
      return (
        <p>
          <NumberText>
            {m.classes_no_network_notice({
              host: joinAddresses.openedHost,
              cash,
            })}
          </NumberText>
        </p>
      );
  }
}

/** The address for joining: the address that the lecturer opened, or the address on each network of the laptop under the name of its connection. A laptop on no network has none. */
function JoinAddresses({
  joinAddresses,
}: {
  joinAddresses: AddressesForOthers;
}): ReactNode {
  switch (joinAddresses.kind) {
    case "asOpened":
      return (
        <>
          <dt>{m.classes_join_address_label()}</dt>
          <dd className={styles["address"]}>
            <NumberText>{joinAddresses.address}</NumberText>
          </dd>
        </>
      );
    case "onLocalNetwork":
      return (
        <>
          <dt>{m.classes_join_address_label()}</dt>
          {joinAddresses.addresses.map(({ connectionName, address }) => (
            <dd
              key={`${connectionName} ${address}`}
              className={styles["address"]}
            >
              <span className={styles["connection"]}>
                <NumberText>{connectionName}</NumberText>
              </span>
              <NumberText>{address}</NumberText>
            </dd>
          ))}
        </>
      );
    case "noNetwork":
      return null;
  }
}
