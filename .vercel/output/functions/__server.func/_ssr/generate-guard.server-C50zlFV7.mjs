import { a as getRequest, c as setCookie$1, i as getCookie, l as setResponseHeader, o as getRequestIP$1, s as getRequestProtocol$1, u as setResponseStatus } from "./ssr.mjs";
import { timingSafeEqual } from "node:crypto";
//#region node_modules/.nitro/vite/services/ssr/assets/generate-guard.server-C50zlFV7.js
/**
* Fetch-Metadata sibling isolation — **server-only** (`.server.ts` suffix).
*
* MUST keep the `.server` suffix: this file imports `@tanstack/react-start/server`
* (`getRequest` → Node `AsyncLocalStorage`). If it is imported from a dual
* client/server module under a non-`.server` name, Vite ships it to the browser
* and the app dies with: `AsyncLocalStorage is not a constructor`.
*
* Apps deployed on `*.grok.me` are "same-site" to each other but MUTUALLY
* UNTRUSTED, and a `SameSite=Lax` session cookie IS sent on same-site
* subrequests — so without this, a malicious sibling could make a SCRIPTED
* (fetch/XHR/form-POST) request to this app's server functions and ride this
* app's session cookie.
*
* We allow only: same-origin requests (this app's own client), non-browser
* requests (SSR / server-to-server, which send no `Sec-Fetch-Site`), and
* top-level GET navigations (how the OAuth callback and normal page loads
* arrive). Every cross-site / same-site *scripted* request is rejected.
* Together with `__Host-` cookies and Better Auth's `trustedOrigins`, this
* closes the sibling-tenant attack surface. Enforced at the `authMiddleware`
* chokepoint (see `middleware.ts`).
*/
var CrossSiteRequestError = class extends Error {
	status = 403;
	constructor() {
		super("Forbidden: cross-site request blocked");
		this.name = "CrossSiteRequestError";
	}
};
/** Throw `CrossSiteRequestError` for a scripted cross-site/sibling request. */
function assertSameSiteRequest() {
	const request = getRequest();
	if (!request) return;
	const h = request.headers;
	const site = h.get("sec-fetch-site");
	if (!site || site === "same-origin" || site === "none") return;
	const dest = h.get("sec-fetch-dest");
	if (h.get("sec-fetch-mode") === "navigate" && request.method === "GET" && dest !== "object" && dest !== "embed") return;
	throw new CrossSiteRequestError();
}
function utcDayKey(nowMs) {
	return new Date(nowMs).toISOString().slice(0, 10);
}
function secondsUntilNextUtcDay(nowMs) {
	const d = new Date(nowMs);
	const next = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1);
	return Math.max(1, Math.ceil((next - nowMs) / 1e3));
}
function consumeQuota(store, ip, nowMs, perMinute, perDay) {
	const windowMs = 6e4;
	let bucket = store.get(ip);
	if (!bucket) {
		bucket = {
			hits: [],
			day: utcDayKey(nowMs),
			dayCount: 0
		};
		store.set(ip, bucket);
	}
	bucket.hits = bucket.hits.filter((t) => nowMs - t < windowMs);
	const day = utcDayKey(nowMs);
	if (bucket.day !== day) {
		bucket.day = day;
		bucket.dayCount = 0;
	}
	if (bucket.hits.length >= perMinute) {
		const oldest = bucket.hits[0] ?? nowMs;
		return {
			ok: false,
			retryAfter: Math.max(1, Math.ceil((oldest + windowMs - nowMs) / 1e3)),
			reason: "minute"
		};
	}
	if (bucket.dayCount >= perDay) return {
		ok: false,
		retryAfter: secondsUntilNextUtcDay(nowMs),
		reason: "day"
	};
	bucket.hits.push(nowMs);
	bucket.dayCount += 1;
	return {
		ok: true,
		remainingMinute: perMinute - bucket.hits.length,
		remainingDay: perDay - bucket.dayCount
	};
}
var GenerateGateError = class extends Error {
	status;
	retryAfter;
	constructor(status, message, retryAfter) {
		super(message);
		this.name = "GenerateGateError";
		this.status = status;
		this.retryAfter = retryAfter;
	}
};
var COOKIE = "cozy_generate_access";
var globalRef = globalThis;
function quotaStore() {
	globalRef.__generateQuota__ ??= /* @__PURE__ */ new Map();
	return globalRef.__generateQuota__;
}
function envInt(name, fallback) {
	const n = Number(process.env[name]);
	return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}
function configuredAccessToken() {
	return (process.env.GENERATE_ACCESS_TOKEN ?? process.env.API_SECRET ?? "").trim();
}
function safeEqual(a, b) {
	const left = Buffer.from(a);
	const right = Buffer.from(b);
	if (left.length !== right.length) return false;
	return timingSafeEqual(left, right);
}
function clientIp() {
	return getRequestIP$1({ xForwardedFor: true })?.trim() || "unknown";
}
function presentedToken() {
	const header = getRequest()?.headers.get("authorization") ?? "";
	if (header.toLowerCase().startsWith("bearer ")) return header.slice(7).trim();
	return (getCookie(COOKIE) ?? "").trim();
}
function applyGateHttp(err) {
	setResponseStatus(err.status);
	setResponseHeader("Cache-Control", "no-store");
	if (err.retryAfter) setResponseHeader("Retry-After", String(err.retryAfter));
}
function gateGenerate() {
	try {
		assertSameSiteRequest();
	} catch (e) {
		if (e instanceof CrossSiteRequestError) throw new GenerateGateError(403, "Forbidden");
		throw e;
	}
	const expected = configuredAccessToken();
	if (expected) {
		const got = presentedToken();
		if (!got || !safeEqual(got, expected)) {
			clientIp();
			throw new GenerateGateError(401, "Unauthorized");
		}
	}
	const ip = clientIp();
	const perMinute = envInt("MAX_REQUESTS_PER_MINUTE", 10);
	const perDay = envInt("MAX_REQUESTS_PER_DAY", 100);
	const result = consumeQuota(quotaStore(), ip, Date.now(), perMinute, perDay);
	if (!result.ok) {
		const message = result.reason === "day" ? "Daily generate quota exceeded" : "Too many requests";
		result.reason, result.retryAfter;
		throw new GenerateGateError(429, message, result.retryAfter);
	}
	result.remainingMinute, result.remainingDay;
	return { ip };
}
function redeemAccess(token) {
	try {
		assertSameSiteRequest();
	} catch {
		return {
			ok: false,
			error: "Forbidden",
			status: 403
		};
	}
	const expected = configuredAccessToken();
	if (!expected) return {
		ok: false,
		error: "Access token is not required",
		status: 400
	};
	const got = token.trim();
	if (!got || !safeEqual(got, expected)) {
		clientIp();
		setResponseStatus(401);
		return {
			ok: false,
			error: "Unauthorized",
			status: 401
		};
	}
	const secure = getRequestProtocol$1() === "https";
	setCookie$1(COOKIE, expected, {
		httpOnly: true,
		sameSite: "strict",
		path: "/",
		maxAge: 2592e3,
		secure
	});
	clientIp();
	return { ok: true };
}
//#endregion
export { GenerateGateError, applyGateHttp, gateGenerate, redeemAccess };
