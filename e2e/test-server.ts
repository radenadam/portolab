export const serverPort = 4173;
export const baseUrl = `http://localhost:${String(serverPort)}`;
/** The variable through which the global setup tells the tests where the database of the server is, so that a test can create accounts in it. */
export const databasePathVariable = "PORTOLAB_TEST_DATABASE_PATH";
