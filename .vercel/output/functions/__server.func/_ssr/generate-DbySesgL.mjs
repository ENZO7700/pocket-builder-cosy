import { n as TSS_SERVER_FUNCTION, r as getServerFnById, t as createServerFn } from "./ssr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/generate-DbySesgL.js
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var getAiStatus = createServerFn({ method: "GET" }).handler(createSsrRpc("f227d4eea10a68e9d8585a0dc73fb9fdd43027ec62d209ec539b6535cf0bb6b6"));
var redeemGenerateAccess = createServerFn({ method: "POST" }).validator((input) => ({ token: String(input?.token ?? "").slice(0, 200) })).handler(createSsrRpc("29e91aac58d6c13f9a841438f5a53c1e78e6a40c2fb30e2947f7685219a832b4"));
var generatePreview = createServerFn({ method: "POST" }).validator((input) => ({
	prompt: String(input?.prompt ?? "").slice(0, 4e3),
	html: String(input?.html ?? "").slice(0, 16e3)
})).handler(createSsrRpc("3096e05fa2ff184a30803214dbf4335bfdadfbfb4c6d691fb8dcbce8d9564003"));
//#endregion
export { getAiStatus as n, redeemGenerateAccess as r, generatePreview as t };
