import type { ReactNode } from "react";
import type { AddressesForOthers } from "~/local-network.server";
import { m } from "~/paraglide/messages.js";
import styles from "./classes.module.css";

/** The code and the address with which students join a class, as its lecturer shares them. The address is one that the phones of students can open, so a lecturer who opened Portolab at localhost learns the address of the laptop on its network instead. */
export function JoinDetails({
  joinCode,
  joinAddresses,
}: {
  joinCode: string;
  joinAddresses: AddressesForOthers;
}): ReactNode {
  return (
    <>
      <LocalNetworkNotices joinAddresses={joinAddresses} />
      <dl className={styles["share"]}>
        <dt>{m.classes_code_label()}</dt>
        <dd className={styles["code"]}>{joinCode}</dd>
        <dt>{m.classes_join_address_label()}</dt>
        <JoinAddresses joinAddresses={joinAddresses} />
      </dl>
    </>
  );
}

/** Why the address for joining leads to the laptop on its network instead of to the address that the lecturer opened, and how to choose among several networks. */
function LocalNetworkNotices({
  joinAddresses,
}: {
  joinAddresses: AddressesForOthers;
}): ReactNode {
  switch (joinAddresses.kind) {
    case "asOpened":
    case "noNetwork":
      return null;
    case "onLocalNetwork":
      return (
        <>
          <p>
            {m.classes_local_network_notice({
              host: joinAddresses.openedHost,
            })}
          </p>
          {joinAddresses.addresses.length > 1 && (
            <p>{m.classes_several_networks_notice()}</p>
          )}
        </>
      );
  }
}

/** The values of the address for joining: the address that the lecturer opened, the address on each network of the laptop under the name of its connection, or why phones cannot open Portolab yet. */
function JoinAddresses({
  joinAddresses,
}: {
  joinAddresses: AddressesForOthers;
}): ReactNode {
  switch (joinAddresses.kind) {
    case "asOpened":
      return <dd className={styles["address"]}>{joinAddresses.address}</dd>;
    case "onLocalNetwork":
      return joinAddresses.addresses.map(({ connectionName, address }) => (
        <dd key={`${connectionName} ${address}`} className={styles["address"]}>
          <span className={styles["connection"]}>{connectionName}</span>
          {address}
        </dd>
      ));
    case "noNetwork":
      return (
        <dd>
          {m.classes_no_network_notice({ host: joinAddresses.openedHost })}
        </dd>
      );
  }
}
