import { n as create, t as persist } from "../_libs/zustand.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/workspace-store-DLpsM2wz.js
function nid() {
	return crypto.randomUUID();
}
var empty = {
	currentProjectId: null,
	projects: [],
	prompts: [],
	blueprints: []
};
var useWorkspaceStore = create()(persist((set, get) => ({
	workspaceId: nid(),
	...empty,
	setCurrentProjectId: (id) => set({ currentProjectId: id }),
	upsertProject: (item) => {
		const id = item.id ?? get().currentProjectId ?? nid();
		const next = {
			id,
			title: item.title,
			html: item.html,
			code: item.code,
			updatedAt: Date.now()
		};
		set((s) => {
			const rest = s.projects.filter((p) => p.id !== id);
			return {
				currentProjectId: id,
				projects: [next, ...rest].slice(0, 40)
			};
		});
		return id;
	},
	removeProject: (id) => set((s) => ({
		projects: s.projects.filter((p) => p.id !== id),
		currentProjectId: s.currentProjectId === id ? null : s.currentProjectId
	})),
	addPrompt: (title, body) => {
		const t = title.trim() || body.trim().slice(0, 42) || "Prompt";
		const b = body.trim();
		if (!b) return;
		set((s) => ({ prompts: [{
			id: nid(),
			title: t,
			body: b,
			updatedAt: Date.now()
		}, ...s.prompts].slice(0, 80) }));
	},
	removePrompt: (id) => set((s) => ({ prompts: s.prompts.filter((p) => p.id !== id) })),
	addBlueprint: (title, html) => {
		const h = html.trim();
		if (!h) return;
		set((s) => ({ blueprints: [{
			id: nid(),
			title: title.trim() || "Blueprint",
			html: h,
			updatedAt: Date.now()
		}, ...s.blueprints].slice(0, 40) }));
	},
	removeBlueprint: (id) => set((s) => ({ blueprints: s.blueprints.filter((p) => p.id !== id) })),
	clearLocal: () => set({
		...empty,
		workspaceId: nid()
	})
}), { name: "cozy-workspace-v1" }));
//#endregion
export { useWorkspaceStore as t };
