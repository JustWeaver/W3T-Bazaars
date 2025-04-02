// import "./styles.css";

// import { getBazaarListings } from "./utils/api/tornpal";

import logger from "./utils/logger.ts";

async function main(): Promise<void> {
	logger.info("Script loaded. Go wild!");

	// const data = await getBazaarListings("206");

	// logger.info("Xanax Data:", data);

	// https://www.torn.com/page.php?sid=iMarket&step=getListing&rfcv=67e7fa9ca5835
	// Ideally we'd intercept this request to see if we need to open our UI
}

main().catch((err) => logger.warn("An error has occured", err));
