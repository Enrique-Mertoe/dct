import {cookies} from 'next/headers';
import {kv} from '@vercel/kv';
import {jwtVerify, SignJWT} from "jose";
// import { ReadonlyRequestCookies } from 'next/dist/server/app-render';

const encodedKey = new TextEncoder().encode(process.env.SESSION_SECRET);

// Create encryption utility
export const encryption = {
    key: process.env.SESSION_SECRET || '',

    encrypt: (payload) => {
        return new SignJWT(payload)
            .setProtectedHeader({alg: 'HS256'})
            .setIssuedAt()
            .setExpirationTime('7d')
            .sign(encodedKey);
    },

    async decrypt(session = '') {
        try {
            const {payload} = await jwtVerify(session, encodedKey, {
                algorithms: ['HS256'],
            });
            return payload;
        } catch (error) {
            console.log('Failed to verify session');
            return undefined;
        }
    }
};

/**
 * Gets a session value from cookie or KV store without modifying cookies
 * Safe to use in Route Handlers and Server Components
 */
export async function getSession(key, useKV = false) {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('session_id')?.value;

    // No session exists yet
    if (!sessionId) {
        return undefined;
    }

    // If using Vercel KV
    if (useKV && sessionId) {
        return await kv.hget(`session:${sessionId}`, key);
    }
    // Otherwise use cookies
    else {
        const sessionCookieName = 'app_session';
        const sessionCookie = cookieStore.get(sessionCookieName);

        if (sessionCookie?.value) {
            try {
                const val = await encryption.decrypt(sessionCookie.value)
                if (!val) return undefined;
                const sessionData = JSON.parse(val.data);
                return sessionData[key];
            } catch (e) {
                return undefined;
            }
        }

        return undefined;
    }
}

/**
 * Setups an initial session ID if not present
 * MUST be called from middleware or a server action
 */
export function ensureSession(cookieStore) {
    let sessionId = cookieStore.get('session_id')?.value;

    if (!sessionId) {
        sessionId = crypto.randomUUID();
        // Note: You'll need to return this cookie in middleware or server action
    }

    return sessionId;
}

/**
 * Sets a session value (ONLY use in Server Actions or from middleware)
 */
export async function setSession(
    key,
    value,
    useKV = false
) {
    const cookieStore = await cookies();
    let sessionId = cookieStore.get('session_id')?.value;

    if (!sessionId) {
        sessionId = crypto.randomUUID();
        cookieStore.set('session_id', sessionId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 1 week
        });
    }

    // If using Vercel KV
    if (useKV) {
        await kv.hset(`session:${sessionId}`, {[key]: value});
        await kv.expire(`session:${sessionId}`, 60 * 60 * 24 * 7); // 1 week
    }
    // Otherwise use cookies
    else {
        const sessionCookieName = 'app_session';
        let sessionData = {};

        const sessionCookie = cookieStore.get(sessionCookieName);
        if (sessionCookie?.value) {
            try {
                const decrypted = await encryption.decrypt(sessionCookie.value);
                sessionData = decrypted ? JSON.parse(decrypted.data) : {};
            } catch (e) {
                sessionData = {};
            }
        }

        sessionData[key] = value;
        cookieStore.set(sessionCookieName, await encryption.encrypt({
            data: JSON.stringify(sessionData),
            expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7,
        });
    }
}

/**
 * Removes a specific session value by key (ONLY use in Server Actions or from middleware)
 * @param {string} key - The session key to remove
 * @param {boolean} useKV - Whether to use Vercel KV or cookies for storage
 * @returns {Promise<boolean>} - Returns true if the key was found and removed, false otherwise
 */
export async function removeSession(
    key,
    useKV = false
) {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('session_id')?.value;

    // No session exists
    if (!sessionId) {
        return false;
    }

    // If using Vercel KV
    if (useKV) {
        try {
            // Check if the key exists before removing
            const exists = await kv.hexists(`session:${sessionId}`, key);
            if (exists) {
                await kv.hdel(`session:${sessionId}`, key);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error removing session key from KV:', error);
            return false;
        }
    }
    // Otherwise use cookies
    else {
        const sessionCookieName = 'app_session';
        const sessionCookie = cookieStore.get(sessionCookieName);

        if (sessionCookie?.value) {
            try {
                const val = await encryption.decrypt(sessionCookie.value);
                if (!val) return false;

                const sessionData = JSON.parse(val.data);

                // Check if the key exists
                if (!(key in sessionData)) {
                    return false;
                }

                // Remove the key
                delete sessionData[key];

                // Update the session cookie with the modified data
                cookieStore.set(sessionCookieName, await encryption.encrypt({
                    data: JSON.stringify(sessionData),
                    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                }), {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    maxAge: 60 * 60 * 24 * 7,
                });

                return true;
            } catch (error) {
                console.error('Error removing session key from cookie:', error);
                return false;
            }
        }

        return false;
    }
}

/**
 * Removes multiple session values by keys (ONLY use in Server Actions or from middleware)
 * @param {string[]} keys - Array of session keys to remove
 * @param {boolean} useKV - Whether to use Vercel KV or cookies for storage
 * @returns {Promise<string[]>} - Returns array of keys that were successfully removed
 */
export async function removeSessionKeys(
    keys,
    useKV = false
) {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('session_id')?.value;

    // No session exists
    if (!sessionId || keys.length === 0) {
        return [];
    }

    const removedKeys = [];

    // If using Vercel KV
    if (useKV) {
        try {
            for (const key of keys) {
                const exists = await kv.hexists(`session:${sessionId}`, key);
                if (exists) {
                    await kv.hdel(`session:${sessionId}`, key);
                    removedKeys.push(key);
                }
            }
        } catch (error) {
            console.error('Error removing session keys from KV:', error);
        }
    }
    // Otherwise use cookies
    else {
        const sessionCookieName = 'app_session';
        const sessionCookie = cookieStore.get(sessionCookieName);

        if (sessionCookie?.value) {
            try {
                const val = await encryption.decrypt(sessionCookie.value);
                if (val) {
                    const sessionData = JSON.parse(val.data);

                    // Remove each key that exists
                    for (const key of keys) {
                        if (key in sessionData) {
                            delete sessionData[key];
                            removedKeys.push(key);
                        }
                    }

                    // Update the session cookie with the modified data
                    cookieStore.set(sessionCookieName, await encryption.encrypt({
                        data: JSON.stringify(sessionData),
                        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                    }), {
                        httpOnly: true,
                        secure: process.env.NODE_ENV === 'production',
                        sameSite: 'lax',
                        maxAge: 60 * 60 * 24 * 7,
                    });
                }
            } catch (error) {
                console.error('Error removing session keys from cookie:', error);
            }
        }
    }

    return removedKeys;
}

/**
 * Clears the entire session (ONLY use in Server Actions or from middleware)
 * @param {boolean} useKV - Whether to use Vercel KV or cookies for storage
 * @returns {Promise<boolean>} - Returns true if the session was cleared successfully
 */
export async function clearSession(useKV = false) {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('session_id')?.value;

    // No session exists
    if (!sessionId) {
        return false;
    }

    // If using Vercel KV
    if (useKV) {
        try {
            await kv.del(`session:${sessionId}`);
        } catch (error) {
            console.error('Error clearing session from KV:', error);
            return false;
        }
    }

    // Clear cookies regardless
    cookieStore.delete('session_id');
    cookieStore.delete('app_session');

    return true;
}