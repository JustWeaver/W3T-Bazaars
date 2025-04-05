type CommonError = {
	code: number;
	message: string;
	url: string;
	method: string;
	timestamp: number;
	requestDetails?: {
		headers?: Record<string, string>;
		body?: string;
	};
	responseDetails?: {
		headers?: Record<string, string>;
		body?: string;
		statusText?: string;
	};
};

type Errorable<T> = T | CommonError;

type RequestOptions = {
	url: string;
	method?: "GET" | "POST" | "PUT" | "DELETE";
	headers?: Record<string, string>;
	body?: string;
	timeout?: number;
};

type PDAHttpRequest = {
	status: number;
	statusText: string;
	responseText: string;
	responseHeaders: string;
};

const pdaKey = "###PDA-APIKEY###";
const isTornPDA = pdaKey.includes("PDA-APIKEY") === false;

async function normalRequest<T>(
	options: RequestOptions,
): Promise<Errorable<T>> {
	try {
		const response = await fetch(options.url, {
			method: options.method || "GET",
			headers: options.headers,
			body: options.body,
		});

		if (!response.ok) {
			const responseBody = await response.text();
			let errorCode = response.status;
			let errorMessage = response.statusText;

			try {
				const parsedBody = JSON.parse(responseBody);

				// Checks if it's a Torn API error
				if (parsedBody?.error?.code) {
					errorCode = parsedBody.error.code;
					errorMessage = parsedBody.error.message;
				}
			} catch (e) {
				// Response wasn't valid JSON, use the raw text
			}

			const responseHeaders: Record<string, string> = {};
			response.headers.forEach((value, key) => {
				responseHeaders[key] = value;
			});

			return {
				code: errorCode,
				message: errorMessage,
				url: options.url,
				method: options.method || "GET",
				timestamp: Date.now(),
				requestDetails: {
					headers: options.headers,
					body: options.body,
				},
				responseDetails: {
					headers: responseHeaders,
					body: responseBody,
					statusText: response.statusText,
				},
			};
		}

		return response.json();
	} catch (error) {
		return {
			code: 0,
			message:
				error instanceof Error ? error.message : "Unknown error occurred",
			url: options.url,
			method: options.method || "GET",
			timestamp: Date.now(),
			requestDetails: {
				headers: options.headers,
				body: options.body,
			},
		};
	}
}

async function pdaRequest<T>(options: RequestOptions): Promise<Errorable<T>> {
	try {
		// biome-ignore lint/suspicious/noExplicitAny: There's no types available for this
		const response = (await (window as any).flutter_inappwebview.callHandler(
			"PDA_httpPost",
			options.url,
			options.headers,
			options.body,
		)) as PDAHttpRequest;

		if (response.status !== 200) {
			const responseHeaders: Record<string, string> = {};
			try {
				if (response.responseHeaders) {
					for (const line of response.responseHeaders.split("\n")) {
						const [key, value] = line.split(":", 2);
						if (key && value) {
							responseHeaders[key.trim()] = value.trim();
						}
					}
				}
			} catch (e) {}

			return {
				code: response.status,
				message: response.statusText || "PDA request failed",
				url: options.url,
				method: options.method || "POST",
				timestamp: Date.now(),
				requestDetails: {
					headers: options.headers,
					body: options.body,
				},
				responseDetails: {
					headers: responseHeaders,
					body: response.responseText,
					statusText: response.statusText,
				},
			};
		}

		return JSON.parse(response.responseText);
	} catch (error) {
		return {
			code: 0,
			message:
				error instanceof Error ? error.message : "Unknown PDA error occurred",
			url: options.url,
			method: options.method || "POST",
			timestamp: Date.now(),
			requestDetails: {
				headers: options.headers,
				body: options.body,
			},
		};
	}
}

async function monkeyRequest<T>(
	options: RequestOptions,
): Promise<Errorable<T>> {
	try {
		const response = await GM.xmlHttpRequest<T>(options);

		if (response.status !== 200) {
			const responseHeaders: Record<string, string> = {};

			try {
				if (response.responseHeaders) {
					for (const line of response.responseHeaders.split("\n")) {
						const [key, value] = line.split(":", 2);
						if (key && value) {
							responseHeaders[key.trim()] = value.trim();
						}
					}
				}
			} catch (e) {}

			return {
				code: response.status,
				message:
					typeof response.statusText === "string"
						? response.statusText
						: "Request failed",
				url: options.url,
				method: options.method || "GET",
				timestamp: Date.now(),
				requestDetails: {
					headers: options.headers,
					body: options.body,
				},
				responseDetails: {
					headers: responseHeaders,
					body: response.responseText,
				},
			};
		}

		return JSON.parse(response.responseText);
	} catch (error) {
		return {
			code: 0,
			message:
				error instanceof Error
					? error.message
					: "Unknown Monkey error occurred",
			url: options.url,
			method: options.method || "GET",
			timestamp: Date.now(),
			requestDetails: {
				headers: options.headers,
				body: options.body,
			},
		};
	}
}

export async function makeRequest<T>(
	options: RequestOptions,
): Promise<Errorable<T>> {
	const url = new URL(options.url);

	if (url.host === "torn.com" || url.host === "api.torn.com") {
		return normalRequest<T>(options);
	}

	if (isTornPDA) {
		return pdaRequest(options);
	}

	return monkeyRequest<T>(options);
}
