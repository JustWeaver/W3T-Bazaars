// import "./styles.css";

// import { getBazaarListings } from "./utils/api/tornpal";

import logger from "./utils/logger.ts";

async function main(): Promise<void> {
	logger.info("Script loaded. Go wild!");

	const originalFetch = window.fetch;

	unsafeWindow.fetch = async (...args) => {
		const response = await originalFetch(...args);
		const url = args[0]?.toString() || "";

		if (!url.includes("page.php?sid=iMarket&step=getListing&rfcv=")) {
			return response;
		}

		const cloned = response.clone();
		const responseData = await cloned.json();

		logger.info("Found IM request.", responseData);

		return response;
	};

	// const data = await getBazaarListings("206");

	// logger.info("Xanax Data:", data);

	// https://www.torn.com/page.php?sid=iMarket&step=getListing&rfcv=67e7fa9ca5835
	// Ideally we'd intercept this request to see if we need to open our UI
}

main().catch((err) => logger.warn("An error has occured", err));
