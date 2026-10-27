/**
 * DHIS2 script auth/connectivity layer.
 *
 * This is a deliberate port of the equivalent layer in the `glass-dev` repo
 * (src/scripts/common.ts + src/utils/d2-api.ts), kept name-for-name so the two
 * repos read the same and so a single .env.local can drive both. The repos are
 * separate packages with separate node_modules, so a shared import is not
 * possible without restructuring; this module is the single source of truth
 * within amr-surveys.
 *
 * Env vars (same names and precedence as glass-dev):
 *   REACT_APP_DHIS2_BASE_URL          (required)
 *   REACT_APP_DHIS2_TOKEN_PROD        )
 *   REACT_APP_DHIS2_TOKEN_PREPROD     ) first one set wins (Personal Access Token)
 *   REACT_APP_DHIS2_TOKEN_TRAINING    )
 *   REACT_APP_DHIS2_TOKEN             )
 *   REACT_APP_DHIS2_AUTH              fallback, "username:password"
 *
 * .env.local is NOT loaded automatically. Run with `-r dotenv/config` and
 * `DOTENV_CONFIG_PATH=.env.local`, exactly as the glass-dev scripts are run.
 */
import { D2Api } from "../types/d2-api";

export type Auth = { username: string; password: string };

export type InstanceData = {
    url: string;
    username?: string;
    password?: string;
    token?: string;
};

/** Mirrors glass-dev's src/data/entities/Instance.ts. */
export class Instance {
    public readonly url: string;
    public readonly token: string | undefined;
    private username: string | undefined;
    private password: string | undefined;

    constructor(data: InstanceData) {
        this.url = data.url;
        this.username = data.username;
        this.password = data.password;
        this.token = data.token;
    }

    public get auth(): Auth | undefined {
        return this.username && this.password
            ? { username: this.username, password: this.password }
            : undefined;
    }
}

export type EnvVars = { url: string; token?: string; auth?: Auth };

/**
 * Reads connection details from the environment. Never logs the secret itself.
 * Same precedence as glass-dev's getEnvVars().
 */
export function getEnvVars(): EnvVars {
    const url = process.env.REACT_APP_DHIS2_BASE_URL;
    if (!url) {
        throw new Error(
            "REACT_APP_DHIS2_BASE_URL must be set. Copy .env.template to .env.local and run with " +
                "DOTENV_CONFIG_PATH=.env.local"
        );
    }
    if (url.includes("@")) {
        throw new Error(
            "REACT_APP_DHIS2_BASE_URL must not contain embedded credentials; use " +
                "REACT_APP_DHIS2_TOKEN_* or REACT_APP_DHIS2_AUTH."
        );
    }

    const token =
        process.env.REACT_APP_DHIS2_TOKEN_PROD ||
        process.env.REACT_APP_DHIS2_TOKEN_PREPROD ||
        process.env.REACT_APP_DHIS2_TOKEN_TRAINING ||
        process.env.REACT_APP_DHIS2_TOKEN;

    if (token) return { url, token };

    const rawAuth = process.env.REACT_APP_DHIS2_AUTH;
    if (!rawAuth) {
        throw new Error(
            "Either REACT_APP_DHIS2_TOKEN_PROD, REACT_APP_DHIS2_TOKEN_PREPROD, " +
                "REACT_APP_DHIS2_TOKEN_TRAINING, REACT_APP_DHIS2_TOKEN, or REACT_APP_DHIS2_AUTH must be set."
        );
    }

    const [username, password] = rawAuth.split(":");
    if (!username || !password) {
        throw new Error("REACT_APP_DHIS2_AUTH must be in the format 'username:password'");
    }
    return { url, auth: { username, password } };
}

/** Human-readable description of how we are authenticating. Contains no secret. */
export function describeAuth(envVars: EnvVars): string {
    return envVars.token ? "Personal Access Token" : `basic auth as ${envVars.auth?.username}`;
}

export function getInstance(args: EnvVars): Instance {
    if (args.token) return new Instance({ url: args.url, token: args.token });
    return new Instance({ url: args.url, ...args.auth });
}

/**
 * Mirrors glass-dev's src/utils/d2-api.ts. Note `backend: "fetch"` — required
 * for these scripts to work under Node.
 */
export function getD2APiFromInstance(instance: Instance): D2Api {
    if (instance.token) {
        // Dummy auth forces credentials:"omit"; the ApiToken header overrides Basic auth
        // (extraHeaders win in FetchHttpClientRepository).
        const api = new D2Api({
            baseUrl: instance.url,
            auth: { username: "_", password: "_" },
            backend: "fetch",
        });
        patchWithApiToken(api.baseConnection, instance.token);
        patchWithApiToken(api.apiConnection, instance.token);
        return api;
    }
    return new D2Api({ baseUrl: instance.url, auth: instance.auth, backend: "fetch" });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function patchWithApiToken(connection: any, token: string): void {
    const original = connection.request.bind(connection);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    connection.request = (options: any) =>
        original({
            ...options,
            headers: { ...options.headers, Authorization: `ApiToken ${token}` },
        });
}

/**
 * DHIS2 workaround: a bug in certain DHIS2 versions causes PAT (Personal Access Token)
 * sessions to fail on the first real API call. Calling GET /me first forces the server
 * to fully initialize the session, after which all subsequent calls succeed normally.
 * Call this once per script run, right after creating the D2Api instance.
 */
export async function warmUpSession(api: D2Api): Promise<{ id: string; username: string }> {
    const user = await api.get<{ id: string; username: string }>("/me").getData();
    console.log(`[auth] Session initialized for user: ${user.username} (${user.id})`);
    return user;
}

export function sleep(milliseconds: number): Promise<unknown> {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}

export function isAuthError(error: unknown): boolean {
    const text = (error instanceof Error ? error.message : String(error)).toLowerCase();
    return (
        text.includes("401") ||
        text.includes("403") ||
        text.includes("unauthorized") ||
        text.includes("forbidden")
    );
}

/**
 * Derives a short, filesystem-safe label identifying which DHIS2 instance a run targets,
 * purely algorithmically from the base URL (no hostname->name table, which would need upkeep
 * and risks mislabelling something "PROD"). Host prefix alone is not enough: e.g.
 * extranet.who.int/dhis2-demo-indiv and extranet.who.int/dhis2-indiv share a host and differ
 * only by path, so both contribute.
 */
export function deriveEnvLabel(rawUrl: string): string {
    try {
        const url = new URL(rawUrl);
        const hostPrefix = url.hostname.split(".")[0] ?? "";
        const pathTail = url.pathname.replace(/^\/+|\/+$/g, "").replace(/\//g, "-");
        const combined = [hostPrefix, pathTail].filter(Boolean).join("-");
        const sanitized = combined
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, "-")
            .replace(/-+/g, "-")
            .replace(/^-|-$/g, "");
        return sanitized || "unknown-env";
    } catch {
        return "unknown-env";
    }
}

const AUTH_COOLDOWN_PERIOD = 60000; // never refresh the session more than once per minute

export type SessionManager = {
    /** Refresh the session, coalescing concurrent callers and respecting a cooldown. */
    reauthenticate(reason: string): Promise<void>;
    /** Run `operation`, retrying with exponential backoff and re-authenticating on auth errors. */
    retryWithBackoff<T>(operation: () => Promise<T>, maxRetries?: number): Promise<T>;
    /** Set once an auth failure is unrecoverable; further work should stop. */
    readonly fatalAuthError: string | null;
};

/**
 * Mirrors the auth-refresh/retry behaviour of glass-dev's bulkDownloadAMUFiles.ts, with the
 * module-level globals there (authPromise / lastAuthTime / fatalAuthErrorMessage) encapsulated
 * per run instead.
 */
export function createSessionManager(api: D2Api): SessionManager {
    let authPromise: Promise<unknown> | null = null;
    let lastAuthTime: number | null = null;
    let fatalAuthErrorMessage: string | null = null;

    async function reauthenticate(reason: string): Promise<void> {
        const now = Date.now();
        if (lastAuthTime && now - lastAuthTime < AUTH_COOLDOWN_PERIOD) return;
        if (authPromise) {
            await authPromise;
            return;
        }
        authPromise = warmUpSession(api);
        try {
            await authPromise;
            lastAuthTime = Date.now();
            console.info(`Session refreshed (${reason})`);
        } catch (authError) {
            const message = authError instanceof Error ? authError.message : String(authError);
            console.warn(`Session refresh failed (${reason}): ${message}`);
            if (isAuthError(authError)) {
                fatalAuthErrorMessage = `Authentication failed during session refresh (${reason}): ${message}. Aborting.`;
            }
        } finally {
            authPromise = null;
        }
    }

    async function retryWithBackoff<T>(
        operation: () => Promise<T>,
        maxRetries = 3,
        delay = 2000,
        maxDelay = 20000
    ): Promise<T> {
        let attempt = 1;
        for (;;) {
            try {
                return await operation();
            } catch (error) {
                const errorText = error instanceof Error ? error.message : String(error);

                if (attempt >= maxRetries) {
                    throw new Error(`Failed after ${maxRetries} retries: ${errorText}`);
                }
                if (attempt === Math.floor(maxRetries / 2) || errorText.includes("Bad Gateway")) {
                    await reauthenticate("retry");
                    if (fatalAuthErrorMessage) throw new Error(fatalAuthErrorMessage);
                }

                const backoffDelay = Math.min(delay * Math.pow(2, attempt - 1), maxDelay);
                console.warn(`  Retry ${attempt}/${maxRetries} in ${backoffDelay}ms after: ${errorText}`);
                await sleep(backoffDelay);
                attempt++;
            }
        }
    }

    return {
        reauthenticate,
        retryWithBackoff,
        get fatalAuthError() {
            return fatalAuthErrorMessage;
        },
    };
}
