export const serverPort = 4173;
export const baseUrl = `http://localhost:${String(serverPort)}`;
/** The variable through which the global setup tells the tests where the database of the server is, so that a test can create accounts in it. */
export const databasePathVariable = "PORTOLAB_TEST_DATABASE_PATH";

// RFC 2606 reserves the domain test for tests, so this name never leads to a real site.
const publicServerName = "portolab.test";

/** The test server under a domain, as a public server serves Portolab. Its pages keep the address that the reader opened, which the devices of others open as well. */
export const publicServerUrl = `http://${publicServerName}:${String(serverPort)}`;

/** The argument that makes Chromium resolve the domain of the public server to this computer, where the test server runs. */
export const publicServerResolverRule = `--host-resolver-rules=MAP ${publicServerName} 127.0.0.1`;
