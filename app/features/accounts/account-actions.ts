/** The actions of the account command, which the person who runs the server names on its command line. */
export const accountActions = ["create-lecturer", "reset-password"] as const;

export type AccountAction = (typeof accountActions)[number];
