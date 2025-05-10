import "./styles.css";

import { getBazaarListings, type Listing } from "./utils/api/tornpal.ts";
import { waitForElement } from "./utils/dom.ts";
import logger from "./utils/logger.ts";

async function createBazaarUI(): Promise<void> {
	const el = await waitForElement<HTMLLIElement>(
		'li[class^="sellerListWrapper"]',
	);

	if (!el) {
		logger.warn("Failed to find the seller list");
		return;
	}
	const itemName = "Xanax";
	const itemId = "206";

	const itemData = await getBazaarListings(itemId); // TODO: Make this not hardcoded

	if (!itemData || itemData === null) {
		logger.warn(`Failed to fetch items for ${itemId}`);
		return;
	}

	const base = $("<div>").addClass("bazaar-info-container");

	const header = $("<div>")
		.addClass("bazaar-info-header")
		.text(`Bazaar listings for ${itemName} [${itemId}]`);

	const settingsBase = $("<div>").addClass("bazaar-sort-controls");

	const sortBy = $("<select>")
		.addClass("bazaar-sort-select")
		.append(
			$("<option>").val("price").text("Sort by price"),
			$("<option>").val("quantity").text("Sort by quantity"),
			$("<option>").val("profit").text("Sort by profit"),
			$("<option>").val("updated").text("Sort by last updated"),
		)
		.on("change", function () {
			const sortValue = $(this).val();

			logger.info(`Sorting by: ${sortValue}`);

			// TODO: Sorting logic lol
		});

	const sortOrderButton = $("<button>")
		.addClass("bazaar-button", "bazaar-order-toggle")
		.text("Asc") // TODO: Get the actual value from storage
		.on("click", (_event) => {
			logger.debug("Sort button was clicked!");
		});

	const profitTypeButton = $("<button>")
		.addClass("bazaar-button", "bazaar-display-toggle")
		.text("%") // TODO: Get the actual value from storage
		.on("click", (_event) => {
			logger.debug("Profit button was clicked!");
		});

	const quantitySpan = $("<span>").text("Min Qty:");
	const minQuantityInput = $("<input>").addClass("bazaar-min-qty");

	settingsBase.append(
		sortBy,
		sortOrderButton,
		profitTypeButton,
		quantitySpan,
		minQuantityInput,
	);

	const scrollContainer = $("<div>").addClass("bazaar-scroll-container");
	const scrollWrapper = $("<div>").addClass("bazaar-scroll-wrapper");

	const CARD_WIDTH = 180;
	const BUFFER_CARDS = 2;

	const cardContainer = $("<div>")
		.addClass("bazaar-card-container")
		.css({
			position: "relative",
			height: "100%",
			width: `${itemData.listings.length * CARD_WIDTH}px`,
		});

	function createCard(listing: Listing, index: number): JQuery {
		const card = $("<div>")
			.addClass("bazaar-listing-card")
			.css({
				position: "absolute",
				left: `${index * CARD_WIDTH}px`,
				width: `${CARD_WIDTH}px`,
				height: "90px",
				padding: "8px",
				border: "1px solid var(--color-border)",
				borderRadius: "4px",
				backgroundColor: "var(--color-bg-secondary)",
			});

		// todo: port this to jquery lol
		card.html(`
            <div class="bazaar-card-content">
                <div class="bazaar-seller">
                    <a href="https://www.torn.com/bazaar.php?userId=${listing.player_id}" target="_blank">
                        ${listing.player_id || `ID: ${listing.player_id}`}
                    </a>
                </div>
                <div class="bazaar-price">$${listing.price.toLocaleString()}</div>
                <div class="bazaar-quantity">Qty: ${listing.quantity}</div>
                <div class="bazaar-updated">Updated: ${new Date(listing.updated * 1000).toLocaleString()}</div>
            </div>
        `);

		return card;
	}

	function renderVisibleCards(): void {
		const scrollLeft = scrollWrapper.scrollLeft() as number;
		const containerWidth = scrollWrapper.width() || 0;

		const startIndex = Math.max(
			0,
			Math.floor(scrollLeft / CARD_WIDTH) - BUFFER_CARDS,
		);
		const endIndex = Math.min(
			itemData.listings.length,
			Math.ceil((scrollLeft + containerWidth) / CARD_WIDTH) + BUFFER_CARDS,
		);

		cardContainer.empty();

		for (let i = startIndex; i < endIndex; i++) {
			const card = createCard(itemData?.listings[i], i);
			cardContainer.append(card);
		}
	}

	scrollWrapper.on("scroll", () => {
		if (scrollWrapper.data("scrollTimeout")) {
			clearTimeout(scrollWrapper.data("scrollTimeout"));
		}

		scrollWrapper.data(
			"scrollTimeout",
			setTimeout(() => {
				renderVisibleCards();
			}, 50),
		);
	});

	scrollWrapper.append(cardContainer);
	scrollContainer.append(scrollWrapper);
	base.append(header, settingsBase, scrollContainer);

	$(el).prepend(base);
}

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

		createBazaarUI();

		return response;
	};
}

main().catch((err) => logger.warn("An error has occured", err));
