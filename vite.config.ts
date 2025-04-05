import { defineConfig } from "vite";
import monkey from "vite-plugin-monkey";

export default defineConfig({
	plugins: [
		monkey({
			entry: "src/index.ts",
			userscript: {
				name: "Bazaars in Item Market",
				author: "Weav3r [1853324]",
				namespace: "weav3r",
				version: "3.0.0",
				license: "GPLv3", // will probably change
				description:
					"Displays bazaar listings with sorting controls via TornPal.",
				match: ["https://www.torn.com/*"], // Change this to something more sane
				connect: ["tornpal.com"],
				"run-at": "document-start",
			},
		}),
	],
	build: {
		target: "esnext",
		minify: true,
	},
});
