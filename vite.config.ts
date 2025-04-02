import { defineConfig } from "vite";
import monkey from "vite-plugin-monkey";

export default defineConfig({
	plugins: [
		monkey({
			entry: "src/index.ts",
			userscript: {
				name: "Bazaars in Item Market",
				author: "Weav3r [1853324]",
				version: "3.0.0",
				license: "GPLv3", // will probably change
				description:
					"Displays bazaar listings with sorting controls via TornPal.",
				match: ["https://www.torn.com/*"], // Change this to something more sane
				"run-at": "document-end",
			},
		}),
	],
	build: {
		target: "esnext",
		minify: true,
	},
});
