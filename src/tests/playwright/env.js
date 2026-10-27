/* Environment for the browser tests: the DHIS2 instance and token come from .env.local, as for the scripts.
   The tests only ever read, and never against production. */
const path = require("path");
const dotenv = require("dotenv");

const root = path.join(__dirname, "..", "..", "..");
dotenv.config({ path: path.join(root, ".env.local") });

// Instance name (host + path) -> suffix of the token variable that belongs to it.
const ALLOWED_INSTANCES = {
    "portal-uat.who.int/dhis2-indiv": "PREPROD",
    "extranet.who.int/dhis2-dev": "DEV",
};

function getInstance() {
    const url = process.env.REACT_APP_DHIS2_BASE_URL;
    if (!url) throw new Error("Set REACT_APP_DHIS2_BASE_URL in .env.local");
    const { host, pathname } = new URL(url);
    const name = host + pathname.replace(/\/$/, "");
    const tokenSuffix = ALLOWED_INSTANCES[name];
    if (!tokenSuffix) {
        throw new Error(
            `Browser tests only run against ${Object.keys(ALLOWED_INSTANCES).join(
                " or "
            )}, not ${name}`
        );
    }
    return { url: url.replace(/\/$/, ""), name, tokenSuffix };
}

/** The token for the instance in .env.local (the matching variable only, never one for another instance). */
function getToken() {
    const { tokenSuffix } = getInstance();
    const token =
        process.env[`REACT_APP_DHIS2_TOKEN_${tokenSuffix}`] ??
        process.env[`DHIS2_TOKEN_${tokenSuffix}`];
    if (!token) throw new Error(`Set DHIS2_TOKEN_${tokenSuffix} in .env.local`);
    return token;
}

module.exports = { root, getInstance, getToken };
