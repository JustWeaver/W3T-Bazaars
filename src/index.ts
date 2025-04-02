import "./styles.css";

import logger from "./utils/logger.ts";

async function main(): Promise<void> {
	logger.info("Script loaded. Go wild!");
}

main().catch((err) => logger.warn("An error has occured", err));
