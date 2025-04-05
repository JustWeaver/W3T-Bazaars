import logger from "../logger";
import storage, { Time } from "../storage";
import { makeRequest } from "./fetch";

type ListingSource = "bazaar" | "itemmarket";

interface Listing {
	item_id: number;
	player_id: number | null;
	quantity: number;
	price: number;
	updated: number; // Unix timestamp
	source: ListingSource;
}

interface Meta {
	marketlowestprice: number;
	bazaarlowestprice: number;
	pricedifference: number;
}

interface MarketList {
	listings: Listing[];
	meta: Meta;
}

export async function getBazaarListings(
	itemId: string,
	comment = "wBazaarMarket",
): Promise<MarketList | null> {
	const cache = storage.get<MarketList>(`item-${itemId}`);

	if (cache) return cache;

	const data = await makeRequest<MarketList>({
		url: `https://tornpal.com/api/v1/markets/clist/${itemId}?comment=${comment}`,
	});

	if ("code" in data) {
		// TODO: check if the code is 429
		// If it is, kill all requests for the following minute (check how long exactly)

		if (data.code === 429) {
			// we're cooked
		}

		logger.warn("Failed to fetch bazaar data from Torn Pal.", data);

		return null;
	}

	storage.set(`item-${itemId}`, data, {
		amount: 30,
		unit: Time.Seconds,
	});

	logger.debug(`Returned fresh data for item ${itemId}`);

	return data;
}
