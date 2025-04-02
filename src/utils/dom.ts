import logger from "./logger";

/**
 * Waits for an element matching the querySelector to appear in the DOM
 * @param querySelector CSS selector to find the element
 * @param timeout Optional timeout in milliseconds
 * @returns Promise resolving to the found element or null if timeout reached
 */
export async function waitForElement<T extends Element>(
	querySelector: string,
	timeout?: number,
): Promise<T | null> {
	const existingElement = document.querySelector<T>(querySelector);
	if (existingElement) return existingElement;

	return new Promise<T | null>((resolve) => {
		let timer: Timer | undefined;

		const observer = new MutationObserver(() => {
			const element = document.querySelector<T>(querySelector);
			if (element) {
				cleanup();
				resolve(element);
			}
		});

		observer.observe(document.body, {
			childList: true,
			subtree: true,
		});

		if (timeout) {
			timer = setTimeout(() => {
				cleanup();
				resolve(null);
			}, timeout);
		}

		function cleanup() {
			observer.disconnect();
			if (timer) clearTimeout(timer);
		}
	});
}

/**
 * Gets the RFC verification token from cookies
 * This is used for CSRF protection in Torn API requests
 * @returns The RFC token value or empty string if not found
 */
export function getRFC(): string {
	try {
		// biome-ignore lint/suspicious/noExplicitAny: types for jquery cookie are missing
		const jQueryRfc = ($ as any).cookie?.("rfc_v");
		if (jQueryRfc) return jQueryRfc;

		// Fallback to native cookie parsing
		const match = document.cookie.match(/(?:^|;\s*)rfc_v=([^;]*)/);
		return match ? decodeURIComponent(match[1]) : "";
	} catch (e) {
		logger.error("Error getting RFC token:", e);
		return "";
	}
}

/**
 * Parses URL hash into URLSearchParams
 * Handles various hash formats used in Torn's frontend
 * @param hash Optional hash string, defaults to current location.hash
 * @returns URLSearchParams object containing the parsed parameters
 */
export function getHashParameters(hash?: string): URLSearchParams {
	// Use provided hash or current location hash
	let finalHash = hash || location.hash;

	// Strip leading "#/" or "#" or "/"
	if (finalHash.startsWith("#/")) {
		finalHash = finalHash.substring(2);
	} else if (finalHash.startsWith("#") || finalHash.startsWith("/")) {
		finalHash = finalHash.substring(1);
	}

	// Ensure proper format for URLSearchParams
	if (!finalHash.startsWith("!") && !finalHash.startsWith("?")) {
		finalHash = `?${finalHash}`;
	}

	return new URLSearchParams(finalHash);
}
