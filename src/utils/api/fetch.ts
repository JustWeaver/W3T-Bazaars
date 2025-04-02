// This doesn't feel like it's enough information to pass through. I'll most likely expand this.
type CommonError = {
	code: number;
	message: string;
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
	const response = await fetch(options.url, {
		method: options.method,
		headers: options.headers,
		body: options.body,
	});

	if (!response.ok) {
		const body = await response.json().catch(null);

		if (!body) {
			return {
				code: response.status,
				message: "Something lol",
			};
		}

		// TODO: This assumes it's a TornAPI error. It's not ideal, but realistically it's correct :p
		return {
			code: body.error.code,
			message: body?.error?.message,
		};
	}

	return response.json();
}

async function pdaRequest<T>(options: RequestOptions): Promise<Errorable<T>> {
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	const response = (await (window as any).flutter_inappwebview.callHandler(
		"PDA_httpPost",
		options.url,
		options.headers,
		options.body,
	)) as PDAHttpRequest;

	if (response.status !== 200) {
		return {
			code: response.status,
			message: "Call failed.",
		};
	}

	return JSON.parse(response.responseText);
}

async function monkeyRequest<T>(
	options: RequestOptions,
): Promise<Errorable<T>> {
	const response = await GM.xmlHttpRequest<T>(options);

	if (response.status !== 200) {
		return {
			code: response.status,
			message: response.responseText,
		};
	}

	return JSON.parse(response.responseText);
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
