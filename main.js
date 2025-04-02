// ==UserScript==
// @name         Bazaars in Item Market powered by TornPal and IronNerd BETA
// @namespace    http://tampermonkey.net/
// @version      2.40b
// @description  Displays bazaar listings with sorting controls via TornPal & IronNerd
// @author       Weav3r
// @match        https://www.torn.com/*
// @grant        GM.xmlHttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_listValues
// @grant        GM.setValue
// @grant        GM.getValue
// @grant        GM.deleteValue
// @grant        GM.listValues
// @connect      tornpal.com
// @connect      www.ironnerd.me
// @run-at       document-end
// ==/UserScript==

(() => {
	const CACHE_DURATION_MS = 60000;
	const CARD_WIDTH = 180;

	let currentSortKey = "price";
	let currentSortOrder = "asc";
	let allListings = [];
	let currentDarkMode = document.body.classList.contains("dark-mode");
	let currentItemName = "";
	let displayMode = "percentage";
	let isMobileView = false;

	const scriptSettings = {
		defaultSort: "price",
		defaultOrder: "asc",
		apiKey: "",
		listingFee: Number.parseFloat(GM_getValue("bazaarListingFee") || "0"),
		defaultDisplayMode: "percentage",
		linkBehavior: GM_getValue("bazaarLinkBehavior") || "new_tab",
	};

	function checkMobileView() {
		isMobileView = window.innerWidth < 784;
		return isMobileView;
	}
	checkMobileView();
	window.addEventListener("resize", () => {
		checkMobileView();
		processMobileSellerList();
	});

	function loadSettings() {
		try {
			const saved = GM_getValue("bazaarsSettings");
			if (saved) {
				const parsedSettings = JSON.parse(saved);

				Object.assign(scriptSettings, parsedSettings);

				if (parsedSettings.defaultSort) {
					currentSortKey = parsedSettings.defaultSort;
				}
				if (parsedSettings.defaultOrder) {
					currentSortOrder = parsedSettings.defaultOrder;
				}
				if (parsedSettings.defaultDisplayMode) {
					displayMode = parsedSettings.defaultDisplayMode;
				}
			}
		} catch (e) {
			console.error("Oops, settings failed to load:", e);
		}
	}

	function saveSettings() {
		try {
			GM_setValue("bazaarsSettings", JSON.stringify(scriptSettings));
			GM_setValue("bazaarApiKey", scriptSettings.apiKey || "");
			GM_setValue("bazaarDefaultSort", scriptSettings.defaultSort || "price");
			GM_setValue("bazaarDefaultOrder", scriptSettings.defaultOrder || "asc");
			GM_setValue("bazaarListingFee", scriptSettings.listingFee || 0);
			GM_setValue(
				"bazaarDefaultDisplayMode",
				scriptSettings.defaultDisplayMode || "percentage",
			);
			GM_setValue(
				"bazaarLinkBehavior",
				scriptSettings.linkBehavior || "new_tab",
			);
		} catch (e) {
			console.error("Settings save hiccup:", e);
		}
	}
	loadSettings();

	function fetchJSON(url, callback) {
		let retryCount = 0;
		const MAX_RETRIES = 2;
		const TIMEOUT_MS = 10000;
		const RETRY_DELAY_MS = 2000;

		function makeRequest(options) {
			// First, check if we're running in Torn PDA
			if (typeof window.flutter_inappwebview !== "undefined") {
				// Try to detect Torn PDA environment
				return window.flutter_inappwebview
					.callHandler("isTornPDA")
					.then((response) => {
						if (response?.isTornPDA) {
							// We're in Torn PDA, use its HTTP handlers
							return window.flutter_inappwebview
								.callHandler("PDA_httpGet", options.url, options.headers || {})
								.then((response) => {
									// Convert Torn PDA response to match GM_xmlhttpRequest format
									if (options.onload) {
										options.onload({
											status: response.status,
											responseText: response.responseText,
											statusText: response.statusText,
										});
									}
								})
								.catch((error) => {
									if (options.onerror) {
										options.onerror(error);
									}
								});
						}
						// Fallback to standard methods if not in Torn PDA
						return handleStandardRequest(options);
					})
					.catch(() => {
						// If isTornPDA handler fails, fallback to standard methods
						return handleStandardRequest(options);
					});
			}
			// Not in Torn PDA environment, use standard methods
			return handleStandardRequest(options);
		}

		function handleStandardRequest(options) {
			if (typeof GM_xmlhttpRequest !== "undefined") {
				return GM_xmlhttpRequest(options);
			}
			if (
				typeof GM !== "undefined" &&
				typeof GM.xmlHttpRequest !== "undefined"
			) {
				return GM.xmlHttpRequest(options);
			}
			console.error(
				"Neither GM_xmlhttpRequest nor GM.xmlHttpRequest are available",
			);
			options.onerror?.(new Error("XMLHttpRequest API not available"));
			return null;
		}

		function attemptFetch() {
			const timeoutId = setTimeout(() => {
				console.warn(
					`Request to ${url} timed out, ${retryCount < MAX_RETRIES ? "retrying..." : "giving up."}`,
				);
				if (retryCount < MAX_RETRIES) {
					retryCount++;
					setTimeout(attemptFetch, RETRY_DELAY_MS);
				} else {
					callback(null);
				}
			}, TIMEOUT_MS);

			makeRequest({
				method: "GET",
				url,
				timeout: TIMEOUT_MS,
				onload: (res) => {
					clearTimeout(timeoutId);
					try {
						if (res.status >= 200 && res.status < 300) {
							callback(JSON.parse(res.responseText));
						} else {
							console.warn(
								`Request to ${url} failed with status ${res.status}`,
							);
							if (retryCount < MAX_RETRIES) {
								retryCount++;
								setTimeout(attemptFetch, RETRY_DELAY_MS);
							} else {
								callback(null);
							}
						}
					} catch (e) {
						console.error(`Error parsing response from ${url}:`, e);
						callback(null);
					}
				},
				onerror: (error) => {
					clearTimeout(timeoutId);
					console.warn(`Request to ${url} failed:`, error);
					if (retryCount < MAX_RETRIES) {
						retryCount++;
						setTimeout(attemptFetch, RETRY_DELAY_MS);
					} else {
						callback(null);
					}
				},
				ontimeout: () => {
					clearTimeout(timeoutId);
					console.warn(`Request to ${url} timed out natively`);
					if (retryCount < MAX_RETRIES) {
						retryCount++;
						setTimeout(attemptFetch, RETRY_DELAY_MS);
					} else {
						callback(null);
					}
				},
			});
		}
		attemptFetch();
	}

	let cachedItemsData = null;
	function getStoredItems() {
		if (cachedItemsData === null) {
			try {
				cachedItemsData = JSON.parse(GM_getValue("tornItems") || "{}");
			} catch (e) {
				cachedItemsData = {};
				console.error("Stored items got funky:", e);
			}
		}
		return cachedItemsData;
	}

	function getCache(itemId) {
		try {
			const key = `tornBazaarCache_${itemId}`;
			const cached = GM_getValue(key);
			if (cached) {
				const payload = JSON.parse(cached);
				if (Date.now() - payload.timestamp < CACHE_DURATION_MS)
					return payload.data;
			}
		} catch (e) {}
		return null;
	}

	function setCache(itemId, data) {
		try {
			GM_setValue(
				`tornBazaarCache_${itemId}`,
				JSON.stringify({ timestamp: Date.now(), data }),
			);
		} catch (e) {}
	}

	function getRelativeTime(ts) {
		const diffSec = Math.floor((Date.now() - ts * 1000) / 1000);
		if (diffSec < 60) return `${diffSec}s ago`;
		if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
		if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
		return `${Math.floor(diffSec / 86400)}d ago`;
	}

	const svgTemplates = {
		rightArrow: `<svg viewBox="0 0 320 512"><path fill="currentColor" d="M310.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-192 192c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L242.7 256 73.4 86.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l192 192z"/></svg>`,
		leftArrow: `<svg viewBox="0 0 320 512"><path fill="currentColor" d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l192 192c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L77.3 256 246.6 86.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-192 192z"/></svg>`,
		warningIcon: `<path fill="currentColor" d="M256 32c14.2 0 27.3 7.5 34.5 19.8l216 368c7.3 12.4 7.3 27.7 .2 40.1S486.3 480 472 480H40c-14.3 0-27.6-7.7-34.7-20.1s-7-27.8 .2-40.1l216-368C228.7 39.5 241.8 32 256 32zm0 128c-13.3 0-24 10.7-24 24V296c0 13.3 10.7 24 24 24s24-10.7 24-24V184c0-13.3-10.7-24-24-24zm32 224a32 32 0 1 0 -64 0 32 32 0 1 0 64 0z"/>`,
		infoIcon: `<path fill="currentColor" d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM216 336h24V272H216c-13.3 0-24-10.7-24-24s10.7-24 24-24h48c13.3 0 24 10.7 24 24v88h8c13.3 0 24 10.7 24 24s-10.7 24-24 24zm40-208a32 32 0 1 1 0 64 32 32 0 1 1 0-64z"/>`,
	};

	function createListingCard(listing, index) {
		const card = document.createElement("div");
		card.className = "bazaar-listing-card";
		card.dataset.index = index;
		const listingKey = `${listing.player_id}-${listing.price}-${listing.quantity}`;
		card.dataset.listingKey = listingKey;
		card.dataset.quantity = listing.quantity;
		card.style.position = "absolute";
		card.style.left = `${index * CARD_WIDTH}px`;
		card.style.width = `${CARD_WIDTH}px`;

		let visitedColor = "#00aaff";
		try {
			const key = `visited_${listing.item_id}_${listing.player_id}`;
			const data = JSON.parse(GM_getValue(key));
			if (data && data.lastClickedUpdated >= listing.updated) {
				visitedColor = "purple";
			}
		} catch (e) {}

		const displayName = listing.player_name
			? listing.player_name
			: `ID: ${listing.player_id}`;
		card.innerHTML = `
            <div>
                <div style="display:flex; align-items:center; gap:5px; margin-bottom:6px; flex-wrap:wrap">
<a href="https://www.torn.com/bazaar.php?userId=${listing.player_id}&itemId=${listing.item_id}&highlight=1&price=${listing.price}#/"
                       data-visited-key="visited_${listing.item_id}_${listing.player_id}"
                       data-updated="${listing.updated}"
                       ${scriptSettings.linkBehavior === "new_tab" ? 'target="_blank" rel="noopener noreferrer"' : ""}
                       style="font-weight:bold; color:${visitedColor}; text-decoration:underline;">
                       Player: ${displayName}
                    </a>
                </div>
                <div>
                    <div style="margin-bottom:2px">
                        <strong>Price:</strong> <span style="word-break:break-all;">$${listing.price.toLocaleString()}</span>
                    </div>
                    <div style="display:flex; align-items:center">
                        <strong>Qty:</strong> <span style="margin-left:4px">${listing.quantity}</span>
                        <span style="margin-left:auto">${getPriceComparisonHtml(listing.price, listing.quantity)}</span>
                    </div>
                </div>
            </div>
            <div style="margin-top:6px">
                <div class="bazaar-listing-footnote">Updated: ${getRelativeTime(listing.updated)}</div>
                <div class="bazaar-listing-source">Source: ${listing.source === "ironnerd" ? "IronNerd" : listing.source === "bazaar" ? "TornPal" : listing.source}</div>
            </div>
        `;

		const playerLink = card.querySelector("a");
		playerLink.addEventListener("click", (e) => {
			GM_setValue(
				playerLink.dataset.visitedKey,
				JSON.stringify({ lastClickedUpdated: listing.updated }),
			);
			playerLink.style.color = "purple";
			const behavior = scriptSettings.linkBehavior || "new_tab";
			if (behavior !== "same_tab") {
				e.preventDefault();
				if (behavior === "new_window") {
					window.open(
						playerLink.href,
						"_blank",
						"noopener,noreferrer,width=1200,height=800",
					);
				} else {
					window.open(playerLink.href, "_blank", "noopener,noreferrer");
				}
			}
		});

		const priceComparison = card.querySelector(".bazaar-price-comparison");
		if (priceComparison) {
			const tooltip = document.createElement("div");
			tooltip.className = "bazaar-profit-tooltip";
			tooltip.style.display = "none";
			tooltip.style.opacity = "0";
			tooltip.innerHTML = priceComparison.getAttribute("data-tooltip");

			priceComparison.addEventListener("mouseenter", (e) => {
				document.body.appendChild(tooltip);
				tooltip.style.display = "block";

				// Position initially to measure size
				tooltip.style.left = "0";
				tooltip.style.top = "0";

				// Get dimensions after adding to DOM
				const rect = e.target.getBoundingClientRect();
				const tooltipRect = tooltip.getBoundingClientRect();

				// Calculate optimal position
				let left = rect.left;
				let top = rect.bottom + 5;

				// Check horizontal overflow
				if (left + tooltipRect.width > window.innerWidth) {
					left = Math.max(5, window.innerWidth - tooltipRect.width - 5);
				}

				// Check vertical overflow and place above if needed
				if (top + tooltipRect.height > window.innerHeight) {
					top = Math.max(5, rect.top - tooltipRect.height - 5);
				}

				// Apply final position
				tooltip.style.left = `${left}px`;
				tooltip.style.top = `${top}px`;

				// Fade in
				requestAnimationFrame(() => {
					tooltip.style.opacity = "1";
				});
			});

			priceComparison.addEventListener("mouseleave", () => {
				tooltip.style.opacity = "0";
				// Remove after transition
				setTimeout(() => {
					if (tooltip.parentNode) tooltip.parentNode.removeChild(tooltip);
				}, 200);
			});
		}

		return card;
	}

	function getPriceComparisonHtml(listingPrice, quantity) {
		try {
			const stored = getStoredItems();
			const match = Object.values(stored).find(
				(item) =>
					item.name &&
					item.name.toLowerCase() === currentItemName.toLowerCase(),
			);
			if (match?.market_value) {
				const marketValue = Number(match.market_value);
				const priceDiff = listingPrice - marketValue;
				const percentDiff = (listingPrice / marketValue - 1) * 100;
				const listingFee = scriptSettings.listingFee || 0;
				const totalCost = listingPrice * quantity;
				const potentialRevenue = marketValue * quantity;
				const feeAmount = Math.ceil(potentialRevenue * (listingFee / 100));
				const potentialProfit = potentialRevenue - totalCost - feeAmount;
				const minResellPrice = Math.ceil(listingPrice / (1 - listingFee / 100));

				let color;
				let text;
				const absProfit = Math.abs(potentialProfit);
				let abbrevValue = potentialProfit < 0 ? "-" : "";
				if (absProfit >= 1000000) {
					abbrevValue += `$${(absProfit / 1000000).toFixed(1).replace(/\.0$/, "")}m`;
				} else if (absProfit >= 1000) {
					abbrevValue += `$${(absProfit / 1000).toFixed(1).replace(/\.0$/, "")}k`;
				} else {
					abbrevValue += `$${absProfit}`;
				}
				if (potentialProfit > 0) {
					color = currentDarkMode ? "#7fff7f" : "#006400";
					text =
						displayMode === "percentage"
							? `(${percentDiff.toFixed(1)}%)`
							: `(${abbrevValue})`;
				} else if (potentialProfit < 0) {
					color = currentDarkMode ? "#ff7f7f" : "#8b0000";
					text =
						displayMode === "percentage"
							? `(+${percentDiff.toFixed(1)}%)`
							: `(${abbrevValue})`;
				} else {
					color = currentDarkMode ? "#cccccc" : "#666666";
					text = displayMode === "percentage" ? "(0%)" : "($0)";
				}

				// Improved tooltip content focusing only on key information
				const tooltipContent = `
                    <div style="font-weight:bold; font-size:13px; margin-bottom:6px; text-align:center;">
                        ${potentialProfit >= 0 ? "PROFIT" : "LOSS"}: ${potentialProfit >= 0 ? "$" : "-$"}${Math.abs(potentialProfit).toLocaleString()}
                    </div>
                    <hr style="margin: 4px 0; border-color: ${currentDarkMode ? "#444" : "#ddd"}">
                    <div>Total Cost: $${totalCost.toLocaleString()} (${quantity} item${quantity > 1 ? "s" : ""})</div>
                    ${listingFee > 0 ? `<div>Resale Fee: ${listingFee}% ($${feeAmount.toLocaleString()})</div>` : ""}
                    ${listingFee > 0 ? `<div style="margin-top:6px; font-weight:bold;">Min. Resell Price: $${minResellPrice.toLocaleString()}</div>` : ""}
                `;
				const span = document.createElement("span");
				span.style.fontWeight = "bold";
				span.style.fontSize = "10px";
				span.style.padding = "0 4px";
				span.style.borderRadius = "2px";
				span.style.color = color;
				span.style.cursor = "help";
				span.style.whiteSpace = "nowrap";
				span.textContent = text;
				span.className = "bazaar-price-comparison";
				span.setAttribute("data-tooltip", tooltipContent);
				return span.outerHTML;
			}
		} catch (e) {
			console.error("Price comparison error:", e);
		}
		return "";
	}

	function renderVirtualCards(infoContainer) {
		const cardContainer = infoContainer.querySelector(".bazaar-card-container");
		const scrollWrapper = infoContainer.querySelector(".bazaar-scroll-wrapper");
		if (!cardContainer || !scrollWrapper || !infoContainer.isConnected) return;
		try {
			const minQtyInput = infoContainer.querySelector(".bazaar-min-qty");
			const minQty = minQtyInput?.value
				? Number.parseInt(minQtyInput.value, 10)
				: 0;
			if (
				!infoContainer.originalListings &&
				allListings &&
				allListings.length > 0
			) {
				infoContainer.originalListings = [...allListings];
			}
			if (
				(!allListings || allListings.length === 0) &&
				infoContainer.originalListings
			) {
				allListings = [...infoContainer.originalListings];
			}
			const filteredListings =
				minQty > 0
					? allListings.filter((listing) => listing.quantity >= minQty)
					: allListings;
			if (filteredListings.length === 0 && allListings.length > 0) {
				cardContainer.innerHTML = "";
				const messageContainer = document.createElement("div");
				messageContainer.style.cssText =
					"display:flex; flex-direction:column; align-items:center; justify-content:center; padding:20px; text-align:center; width:100%; height:70px;";
				const iconSvg = document.createElementNS(
					"http://www.w3.org/2000/svg",
					"svg",
				);
				iconSvg.setAttribute("viewBox", "0 0 512 512");
				iconSvg.setAttribute("width", "24");
				iconSvg.setAttribute("height", "24");
				iconSvg.style.marginBottom = "10px";
				iconSvg.innerHTML = svgTemplates.infoIcon;
				const textDiv = document.createElement("div");
				textDiv.textContent = `No listings found with quantity ≥ ${minQty}. Try a lower value.`;
				messageContainer.appendChild(iconSvg);
				messageContainer.appendChild(textDiv);
				cardContainer.appendChild(messageContainer);
				const countElement = infoContainer.querySelector(
					".bazaar-listings-count",
				);
				if (countElement) {
					countElement.textContent = `No listings match minimum quantity of ${minQty} (from ${allListings.length} total listings)`;
				}
				return;
			}

			if (
				cardContainer.style.width !==
				`${filteredListings.length * CARD_WIDTH}px`
			) {
				cardContainer.style.width = `${filteredListings.length * CARD_WIDTH}px`;
			}

			const scrollLeft = scrollWrapper.scrollLeft;
			const containerWidth = scrollWrapper.clientWidth;
			const visibleCards = Math.ceil(containerWidth / CARD_WIDTH);
			const buffer = Math.max(2, Math.floor(visibleCards / 3));
			const totalItems = filteredListings.length;

			if (
				infoContainer.lastRenderScrollLeft !== undefined &&
				Math.abs(infoContainer.lastRenderScrollLeft - scrollLeft) <
					CARD_WIDTH * 0.3
			) {
			}
			infoContainer.lastRenderScrollLeft = scrollLeft;

			const startIndex = Math.max(
				0,
				Math.floor(scrollLeft / CARD_WIDTH) - buffer,
			);
			const endIndex = Math.min(
				totalItems,
				Math.ceil((scrollLeft + containerWidth) / CARD_WIDTH) + buffer,
			);

			const newVisible = {};
			for (let i = startIndex; i < endIndex; i++) {
				const listing = filteredListings[i];
				const key = `${listing.player_id}-${listing.price}-${listing.quantity}`;
				newVisible[key] = i;
			}
			Array.from(cardContainer.children).forEach((card) => {
				if (!card.classList.contains("bazaar-listing-card")) return;
				const key = card.dataset.listingKey;
				if (key in newVisible) {
					const newIndex = newVisible[key];
					card.dataset.index = newIndex;
					card.style.left = `${newIndex * CARD_WIDTH}px`;
					delete newVisible[key];
				} else {
					card.classList.add("fade-out");
					card.addEventListener("transitionend", () => card.remove(), {
						once: true,
					});
				}
			});
			const fragment = document.createDocumentFragment();
			for (const key in newVisible) {
				const newIndex = newVisible[key];
				const listing = filteredListings[newIndex];
				const newCard = createListingCard(listing, newIndex);
				newCard.classList.add("fade-in");
				fragment.appendChild(newCard);
				requestAnimationFrame(() => {
					newCard.classList.remove("fade-in");
				});
			}
			if (fragment.childElementCount > 0) {
				cardContainer.appendChild(fragment);
			}
			const totalQuantity = filteredListings.reduce(
				(sum, listing) => sum + listing.quantity,
				0,
			);
			const countElement = infoContainer.querySelector(
				".bazaar-listings-count",
			);
			if (countElement) {
				if (minQty > 0 && filteredListings.length < allListings.length) {
					countElement.textContent = `Showing ${filteredListings.length} of ${allListings.length} bazaars (${totalQuantity.toLocaleString()} items total, min qty: ${minQty})`;
				} else {
					countElement.textContent = `Showing bazaars ${startIndex + 1}-${endIndex} of ${totalItems} (${totalQuantity.toLocaleString()} items total)`;
				}
			}
		} catch (error) {
			console.error("Error rendering virtual cards:", error);
		}
	}

	function createInfoContainer(itemName, itemId) {
		const container = document.createElement("div");
		container.className = "bazaar-info-container";
		container.dataset.itemid = itemId;
		currentItemName = itemName;
		const header = document.createElement("div");
		header.className = "bazaar-info-header";
		let marketValueText = "";
		try {
			const stored = getStoredItems();
			const match = Object.values(stored).find(
				(item) =>
					item.name && item.name.toLowerCase() === itemName.toLowerCase(),
			);
			if (match?.market_value) {
				marketValueText = `Market Value: $${Number(match.market_value).toLocaleString()}`;
			}
		} catch (e) {
			console.error("Header market value error:", e);
		}
		header.textContent = `Bazaar Listings for ${itemName} (ID: ${itemId})`;
		if (marketValueText) {
			const span = document.createElement("span");
			span.style.marginLeft = "8px";
			span.style.fontSize = "14px";
			span.style.fontWeight = "normal";
			span.style.color = currentDarkMode ? "#aaa" : "#666";
			span.textContent = `• ${marketValueText}`;
			header.appendChild(span);
		}
		container.appendChild(header);
		currentSortOrder = getSortOrderForKey(currentSortKey);
		const sortControls = document.createElement("div");
		sortControls.className = "bazaar-sort-controls";
		sortControls.innerHTML = `
            <span>Sort by:</span>
            <select class="bazaar-sort-select">
                <option value="price" ${currentSortKey === "price" ? "selected" : ""}>Price</option>
                <option value="quantity" ${currentSortKey === "quantity" ? "selected" : ""}>Quantity</option>
                <option value="profit" ${currentSortKey === "profit" ? "selected" : ""}>Profit</option>
                <option value="updated" ${currentSortKey === "updated" ? "selected" : ""}>Last Updated</option>
            </select>
            <button class="bazaar-button bazaar-order-toggle">
                ${currentSortOrder === "asc" ? "Asc" : "Desc"}
            </button>
            <button class="bazaar-button bazaar-display-toggle" title="Toggle between percentage difference and total profit">
                ${displayMode === "percentage" ? "%" : "$"}
            </button>
            <span style="margin-left: 8px;">Min Qty:</span>
            <input type="number" class="bazaar-min-qty" style="width: 60px; padding: 3px; border: 1px solid #ccc; border-radius: 4px;" min="0" placeholder="">
        `;
		container.appendChild(sortControls);
		const scrollContainer = document.createElement("div");
		scrollContainer.className = "bazaar-scroll-container";
		function createScrollArrow(direction) {
			const arrow = document.createElement("div");
			arrow.className = `bazaar-scroll-arrow ${direction}`;
			arrow.innerHTML =
				svgTemplates[direction === "left" ? "leftArrow" : "rightArrow"];
			let isScrolling = false;
			let scrollAnimationId = null;
			let startTime = 0;
			let isClickAction = false;
			const ACTION_THRESHOLD = 200;
			function smoothScroll() {
				if (!isScrolling) return;
				scrollWrapper.scrollLeft += direction === "left" ? -1.5 : 1.5;
				scrollAnimationId = requestAnimationFrame(smoothScroll);
			}
			function startScrolling(e) {
				e.preventDefault();
				startTime = Date.now();
				isClickAction = false;
				setTimeout(() => {
					if (startTime && Date.now() - startTime >= ACTION_THRESHOLD) {
						isScrolling = true;
						smoothScroll();
					}
				}, ACTION_THRESHOLD);
			}
			function stopScrolling() {
				const holdDuration = Date.now() - startTime;
				isScrolling = false;
				if (scrollAnimationId) {
					cancelAnimationFrame(scrollAnimationId);
					scrollAnimationId = null;
				}
				if (holdDuration < ACTION_THRESHOLD && !isClickAction) {
					isClickAction = true;
					scrollWrapper.scrollBy({
						left: direction === "left" ? -200 : 200,
						behavior: "smooth",
					});
				}
				startTime = 0;
			}
			arrow.addEventListener("mousedown", startScrolling);
			arrow.addEventListener("mouseup", stopScrolling);
			arrow.addEventListener("mouseleave", stopScrolling);
			arrow.addEventListener("touchstart", startScrolling, { passive: false });
			arrow.addEventListener("touchend", stopScrolling);
			arrow.addEventListener("touchcancel", stopScrolling);
			return arrow;
		}
		scrollContainer.appendChild(createScrollArrow("left"));
		const scrollWrapper = document.createElement("div");
		scrollWrapper.className = "bazaar-scroll-wrapper";
		const cardContainer = document.createElement("div");
		cardContainer.className = "bazaar-card-container";
		scrollWrapper.appendChild(cardContainer);
		scrollContainer.appendChild(scrollWrapper);
		scrollContainer.appendChild(createScrollArrow("right"));
		scrollWrapper.addEventListener("scroll", () => {
			if (!scrollWrapper.isScrolling) {
				scrollWrapper.isScrolling = true;
				requestAnimationFrame(function checkScroll() {
					renderVirtualCards(container);
					if (scrollWrapper.lastKnownScrollLeft === scrollWrapper.scrollLeft) {
						renderVirtualCards(container);
						scrollWrapper.isScrolling = false;
					} else {
						scrollWrapper.lastKnownScrollLeft = scrollWrapper.scrollLeft;
						requestAnimationFrame(checkScroll);
					}
				});
			}
		});
		container.appendChild(scrollContainer);
		const footerContainer = document.createElement("div");
		footerContainer.className = "bazaar-footer-container";
		const listingsCount = document.createElement("div");
		listingsCount.className = "bazaar-listings-count";
		listingsCount.textContent = "Loading...";
		footerContainer.appendChild(listingsCount);
		const poweredBy = document.createElement("div");
		poweredBy.className = "bazaar-powered-by";
		poweredBy.innerHTML = `
            <span>Powered by </span>
            <a href="https://tornpal.com/login?ref=1853324" target="_blank">TornPal</a>
            <span> &amp; </span>
            <a href="https://ironnerd.me/" target="_blank">IronNerd</a>
        `;
		footerContainer.appendChild(poweredBy);
		container.appendChild(footerContainer);
		return container;
	}

	function sortListings(listings) {
		return listings.slice().sort((a, b) => {
			let diff;
			if (currentSortKey === "profit") {
				try {
					const stored = getStoredItems();
					const match = Object.values(stored).find(
						(item) =>
							item.name &&
							item.name.toLowerCase() === currentItemName.toLowerCase(),
					);
					if (match?.market_value) {
						const marketValue = Number(match.market_value);
						const fee = scriptSettings.listingFee || 0;
						const aProfit =
							marketValue * a.quantity -
							a.price * a.quantity -
							Math.ceil(marketValue * a.quantity * (fee / 100));
						const bProfit =
							marketValue * b.quantity -
							b.price * b.quantity -
							Math.ceil(marketValue * b.quantity * (fee / 100));
						diff = aProfit - bProfit;
					} else {
						diff = a.price - b.price;
					}
				} catch (e) {
					console.error("Profit sort error:", e);
					diff = a.price - b.price;
				}
			} else {
				diff =
					currentSortKey === "price"
						? a.price - b.price
						: currentSortKey === "quantity"
							? a.quantity - b.quantity
							: a.updated - b.updated;
			}
			return currentSortOrder === "asc" ? diff : -diff;
		});
	}

	function updateInfoContainer(wrapper, itemId, itemName) {
		if (wrapper.hasAttribute("data-has-bazaar-info")) return;
		let infoContainer = document.querySelector(
			`.bazaar-info-container[data-itemid="${itemId}"]`,
		);
		if (!infoContainer) {
			infoContainer = createInfoContainer(itemName, itemId);
			wrapper.insertBefore(infoContainer, wrapper.firstChild);
			wrapper.setAttribute("data-has-bazaar-info", "true");
		} else if (!wrapper.contains(infoContainer)) {
			infoContainer = createInfoContainer(itemName, itemId);
			wrapper.insertBefore(infoContainer, wrapper.firstChild);
			wrapper.setAttribute("data-has-bazaar-info", "true");
		} else {
			const header = infoContainer.querySelector(".bazaar-info-header");
			if (header) {
				header.textContent = `Bazaar Listings for ${itemName} (ID: ${itemId})`;
			}
		}
		const cardContainer = infoContainer.querySelector(".bazaar-card-container");
		const countElement = infoContainer.querySelector(".bazaar-listings-count");
		const updateListingsCount = (text) => {
			if (countElement) {
				countElement.textContent = text;
			}
		};
		const showEmptyState = (isError) => {
			if (cardContainer) {
				cardContainer.innerHTML = "";
				cardContainer.style.width = "";
				renderMessageInContainer(cardContainer, isError);
			}
			updateListingsCount(
				isError ? "API Error - Check back later" : "No listings available",
			);
		};
		if (cardContainer) {
			cardContainer.innerHTML =
				'<div style="padding:10px; text-align:center; width:100%;">Loading bazaar listings...</div>';
		}
		const cachedData = getCache(itemId);
		if (cachedData) {
			allListings = sortListings(cachedData.listings);
			if (allListings.length === 0) {
				showEmptyState(false);
			} else {
				renderVirtualCards(infoContainer);
			}
			return;
		}
		const listings = [];
		let responses = 0;
		let apiErrors = false;
		const requestTimeout = setTimeout(() => {
			console.warn("Bazaar listings request timed out");
			if (responses < 2) {
				showEmptyState(true);
				responses = 2;
			}
		}, 15000);
		function processResponse(newListings, error) {
			if (error) {
				apiErrors = true;
			}
			if (Array.isArray(newListings)) {
				newListings.forEach((newItem) => {
					const normalized =
						newItem.user_id !== undefined
							? {
									item_id: newItem.item_id,
									player_id: newItem.user_id,
									quantity: newItem.quantity,
									price: newItem.price,
									updated: newItem.last_updated,
									source: "ironnerd",
									player_name: newItem.player_name || null,
								}
							: newItem;
					const duplicate = listings.find(
						(item) =>
							item.player_id === normalized.player_id &&
							item.price === normalized.price &&
							item.quantity === normalized.quantity,
					);
					if (duplicate) {
						duplicate.source =
							duplicate.source === normalized.source
								? duplicate.source
								: "TornPal & IronNerd";
						if (!duplicate.player_name && normalized.player_name) {
							duplicate.player_name = normalized.player_name;
						}
					} else {
						listings.push(normalized);
					}
				});
			}
			responses++;
			if (responses === 2) {
				clearTimeout(requestTimeout);
				setCache(itemId, { listings });
				if (listings.length === 0) {
					showEmptyState(apiErrors);
				} else {
					allListings = sortListings(listings);
					renderVirtualCards(infoContainer);
				}
			}
		}
		fetchJSON(
			`https://tornpal.com/api/v1/markets/clist/${itemId}?comment=wBazaarMarket`,
			(data) => {
				processResponse(
					data && Array.isArray(data.listings)
						? data.listings.filter((l) => l.source === "bazaar")
						: [],
					data === null,
				);
			},
		);
		fetchJSON(
			`https://www.ironnerd.me/get_bazaar_items/${itemId}?comment=wBazaarMarket`,
			(data) => {
				processResponse(
					data && Array.isArray(data.bazaar_items) ? data.bazaar_items : [],
					data === null,
				);
			},
		);
	}

	function renderMessageInContainer(container, isApiError) {
		container.innerHTML = "";
		const messageContainer = document.createElement("div");
		messageContainer.style.cssText =
			"display:flex; flex-direction:column; align-items:center; justify-content:center; padding:20px; text-align:center; width:100%; height:70px;";
		const iconSvg = document.createElementNS(
			"http://www.w3.org/2000/svg",
			"svg",
		);
		iconSvg.setAttribute("viewBox", "0 0 512 512");
		iconSvg.setAttribute("width", "24");
		iconSvg.setAttribute("height", "24");
		iconSvg.style.marginBottom = "10px";
		const textDiv = document.createElement("div");
		if (isApiError) {
			iconSvg.innerHTML = svgTemplates.warningIcon;
			textDiv.textContent =
				"Unable to load bazaar listings. Please try again later.";
			textDiv.style.cssText = currentDarkMode
				? "color:#ff9999; font-weight:bold;"
				: "color:#cc0000; font-weight:bold;";
		} else {
			iconSvg.innerHTML = svgTemplates.infoIcon;
			textDiv.textContent = "No bazaar listings available for this item.";
		}
		messageContainer.appendChild(iconSvg);
		messageContainer.appendChild(textDiv);
		container.appendChild(messageContainer);
	}

	function processSellerWrapper(wrapper) {
		if (
			!wrapper ||
			wrapper.classList.contains("bazaar-info-container") ||
			wrapper.hasAttribute("data-bazaar-processed")
		)
			return;
		const existingContainer = wrapper.querySelector(
			":scope > .bazaar-info-container",
		);
		if (existingContainer) return;
		const itemTile = wrapper.previousElementSibling;
		if (!itemTile) return;
		const nameEl = itemTile.querySelector(".name___ukdHN");
		const btn = itemTile.querySelector(
			'button[aria-controls^="wai-itemInfo-"]',
		);
		if (nameEl && btn) {
			const itemName = nameEl.textContent.trim();
			const idParts = btn.getAttribute("aria-controls").split("-");
			const itemId = idParts[idParts.length - 1];
			wrapper.setAttribute("data-bazaar-processed", "true");
			updateInfoContainer(wrapper, itemId, itemName);
		}
	}

	function processMobileSellerList() {
		if (!checkMobileView()) return;
		const sellerList = document.querySelector(
			'ul.sellerList___e4C9_, ul[class*="sellerList"]',
		);
		if (!sellerList) {
			const existing = document.querySelector(".bazaar-info-container");
			if (existing && !document.contains(existing.parentNode)) {
				existing.remove();
			}
			return;
		}
		if (sellerList.hasAttribute("data-has-bazaar-container")) {
			return;
		}
		const headerEl = document.querySelector(
			'.itemsHeader___ZTO9r .title___ruNCT, [class*="itemsHeader"] [class*="title"]',
		);
		const itemName = headerEl ? headerEl.textContent.trim() : "Unknown";
		const btn = document.querySelector(
			'.itemsHeader___ZTO9r button[aria-controls^="wai-itemInfo-"], [class*="itemsHeader"] button[aria-controls^="wai-itemInfo-"]',
		);
		let itemId = "unknown";
		if (btn) {
			const parts = btn.getAttribute("aria-controls").split("-");
			itemId =
				parts.length > 2 ? parts[parts.length - 2] : parts[parts.length - 1];
		}
		const existingContainer = document.querySelector(
			`.bazaar-info-container[data-itemid="${itemId}"]`,
		);
		if (existingContainer) {
			if (
				existingContainer.parentNode !== sellerList.parentNode ||
				existingContainer.nextSibling !== sellerList
			) {
				sellerList.parentNode.insertBefore(existingContainer, sellerList);
			}
			return;
		}
		const infoContainer = createInfoContainer(itemName, itemId);
		sellerList.parentNode.insertBefore(infoContainer, sellerList);
		sellerList.setAttribute("data-has-bazaar-container", "true");
		updateInfoContainer(infoContainer, itemId, itemName);
	}

	function processAllSellerWrappers(root = document.body) {
		if (checkMobileView()) return;
		const sellerWrappers = root.querySelectorAll(
			'[class*="sellerListWrapper"]',
		);
		sellerWrappers.forEach((wrapper) => processSellerWrapper(wrapper));
	}
	processAllSellerWrappers();
	processMobileSellerList();

	const observeTarget = document.querySelector("#root") || document.body;
	let isProcessing = false;
	const observer = new MutationObserver((mutations) => {
		if (isProcessing) return;
		let needsProcessing = false;
		mutations.forEach((mutation) => {
			const isOurMutation = Array.from(mutation.addedNodes).some(
				(node) =>
					node.nodeType === Node.ELEMENT_NODE &&
					(node.classList.contains("bazaar-info-container") ||
						node.querySelector(".bazaar-info-container")),
			);
			if (isOurMutation) return;
			mutation.addedNodes.forEach((node) => {
				if (node.nodeType === Node.ELEMENT_NODE) {
					needsProcessing = true;
				}
			});
			mutation.removedNodes.forEach((node) => {
				if (
					node.nodeType === Node.ELEMENT_NODE &&
					(node.matches("ul.sellerList___e4C9_") ||
						node.matches('ul[class*="sellerList"]')) &&
					checkMobileView()
				) {
					const container = document.querySelector(".bazaar-info-container");
					if (container) container.remove();
				}
			});
		});
		if (needsProcessing) {
			if (observer.processingTimeout) {
				clearTimeout(observer.processingTimeout);
			}
			observer.processingTimeout = setTimeout(() => {
				try {
					isProcessing = true;
					if (checkMobileView()) {
						processMobileSellerList();
					} else {
						processAllSellerWrappers();
					}
				} finally {
					isProcessing = false;
					observer.processingTimeout = null;
				}
			}, 100);
		}
	});
	observer.observe(observeTarget, { childList: true, subtree: true });
	const bodyObserver = new MutationObserver((mutations) => {
		mutations.forEach((mutation) => {
			if (mutation.attributeName === "class") {
				currentDarkMode = document.body.classList.contains("dark-mode");
			}
		});
	});
	bodyObserver.observe(document.body, {
		attributes: true,
		attributeFilter: ["class"],
	});

	if (window.location.href.includes("bazaar.php")) {
		function scrollToTargetItem() {
			const params = new URLSearchParams(window.location.search);
			const targetItemId = params.get("itemId");
			const highlight = params.get("highlight");
			const priceParam = params.get("price");
			if (!targetItemId || highlight !== "1") return;
			function removeHighlightParam() {
				params.delete("highlight");
				history.replaceState(
					{},
					"",
					`${window.location.pathname}?${params.toString()}${window.location.hash}`,
				);
			}
			function showToast(message) {
				const toast = document.createElement("div");
				toast.textContent = message;
				toast.style.cssText =
					"position:fixed; bottom:20px; left:50%; transform:translateX(-50%); background-color:rgba(0,0,0,0.7); color:white; padding:10px 20px; border-radius:5px; z-index:100000; font-size:14px;";
				document.body.appendChild(toast);
				setTimeout(() => {
					toast.remove();
				}, 3000);
			}
			function findItemCard() {
				const img = document.querySelector(
					`img[src*="/images/items/${targetItemId}/"]`,
				);
				if (!img) return null;

				if (priceParam) {
					// Look for all potential item cards with this image
					const allCards = document.querySelectorAll("[class*=item_]");
					for (const card of allCards) {
						if (
							card.querySelector(`img[src*="/images/items/${targetItemId}/"]`)
						) {
							const priceElement = card.querySelector("[class*=price_]");
							if (priceElement) {
								// Clean up the price text to match format from URL
								const priceText = priceElement.textContent.trim();
								const cleanPrice = priceText.replace(/[$,]/g, "");
								if (cleanPrice === priceParam) {
									return card;
								}
							}
						}
					}
					return null;
				}

				return img ? img.closest(".item___GYCYJ") : null;
			}
			const scrollInterval = setInterval(() => {
				const card = findItemCard();
				if (card) {
					clearInterval(scrollInterval);
					removeHighlightParam();
					card.classList.add("green-outline", "pop-flash");
					card.scrollIntoView({ behavior: "smooth", block: "center" });
					setTimeout(() => {
						card.classList.remove("pop-flash");
					}, 800);
				} else {
					if (
						window.innerHeight + window.scrollY >=
						document.body.offsetHeight
					) {
						showToast("Item not found on this page.");
						removeHighlightParam();
						clearInterval(scrollInterval);
					} else {
						window.scrollBy({ top: 300, behavior: "auto" });
					}
				}
			}, 50);
		}
		function waitForItems() {
			const container = document.querySelector(
				".ReactVirtualized__Grid__innerScrollContainer",
			);
			if (container && container.childElementCount > 0) {
				scrollToTargetItem();
			} else {
				setTimeout(waitForItems, 500);
			}
		}
		waitForItems();
	}

	function dailyCleanup() {
		const lastCleanup = GM_getValue("lastDailyCleanup");
		const oneDay = 24 * 60 * 60 * 1000;
		const now = Date.now();
		if (!lastCleanup || now - Number.parseInt(lastCleanup, 10) > oneDay) {
			const sevenDays = 7 * 24 * 60 * 60 * 1000;

			let keys = [];
			try {
				if (typeof GM_listValues === "function") {
					keys = GM_listValues();
				}
				if (keys.length === 0) {
					const checkKey = (prefix) => {
						let i = 0;
						while (true) {
							const testKey = `${prefix}${i}`;
							const value = GM_getValue(testKey);
							if (value === undefined) break;
							keys.push(testKey);
							i++;
						}
					};

					["visited_", "tornBazaarCache_"].forEach((prefix) => {
						for (let id = 1; id <= 1000; id++) {
							const key = `${prefix}${id}`;
							const value = GM_getValue(key);
							if (value !== undefined) {
								keys.push(key);
							}
						}
					});
				}
			} catch (e) {
				console.error("Error listing storage keys:", e);
			}

			keys.forEach((key) => {
				if (
					key &&
					(key.startsWith("visited_") || key.startsWith("tornBazaarCache_"))
				) {
					try {
						const val = JSON.parse(GM_getValue(key));
						let ts = null;
						if (key.startsWith("visited_") && val && val.lastClickedUpdated) {
							ts = val.lastClickedUpdated;
						} else if (
							key.startsWith("tornBazaarCache_") &&
							val &&
							val.timestamp
						) {
							ts = val.timestamp;
						} else {
							GM_deleteValue(key);
						}
						if (ts !== null && now - ts > sevenDays) {
							GM_deleteValue(key);
						}
					} catch (e) {
						GM_deleteValue(key);
					}
				}
			});

			GM_setValue("lastDailyCleanup", now.toString());
		}
	}
	dailyCleanup();

	document.body.addEventListener("click", (event) => {
		const container = event.target.closest(".bazaar-info-container");
		if (!container) return;
		if (event.target.matches(".bazaar-order-toggle")) {
			currentSortOrder = currentSortOrder === "asc" ? "desc" : "asc";
			event.target.textContent = currentSortOrder === "asc" ? "Asc" : "Desc";
			performSort(container);
		}
		if (event.target.matches(".bazaar-display-toggle")) {
			displayMode = displayMode === "percentage" ? "profit" : "percentage";
			event.target.textContent = displayMode === "percentage" ? "%" : "$";
			scriptSettings.defaultDisplayMode = displayMode;
			saveSettings();

			const allContainers = document.querySelectorAll(".bazaar-info-container");
			allContainers.forEach((container) => {
				renderVirtualCards(container);

				const cardContainer = container.querySelector(".bazaar-card-container");
				if (cardContainer) {
					const scrollWrapper = container.querySelector(
						".bazaar-scroll-wrapper",
					);
					const currentScroll = scrollWrapper ? scrollWrapper.scrollLeft : 0;

					const itemId = container.dataset.itemid;
					if (itemId) {
						if (allListings && allListings.length > 0) {
							cardContainer.innerHTML = "";
							renderVirtualCards(container);

							if (scrollWrapper) {
								scrollWrapper.scrollLeft = currentScroll;
							}
						}
					}
				}
			});

			return;
		}
	});

	document.body.addEventListener("input", (event) => {
		const container = event.target.closest(".bazaar-info-container");
		if (!container) return;
		if (event.target.matches(".bazaar-min-qty")) {
			clearTimeout(event.target.debounceTimer);
			event.target.debounceTimer = setTimeout(() => {
				const scrollWrapper = container.querySelector(".bazaar-scroll-wrapper");
				if (scrollWrapper) {
					scrollWrapper.scrollLeft = 0;
				}
				container.lastRenderScrollLeft = undefined;
				if (!allListings || allListings.length === 0) {
					const itemId = container.getAttribute("data-itemid");
					if (itemId) {
						const cachedData = getCache(itemId);
						if (cachedData?.listings && cachedData.listings.length > 0) {
							allListings = sortListings(cachedData.listings);
						}
					}
				}
				renderVirtualCards(container);
			}, 300);
		}
	});

	document.body.addEventListener("change", (event) => {
		const container = event.target.closest(".bazaar-info-container");
		if (!container) return;
		if (event.target.matches(".bazaar-sort-select")) {
			const newSortKey = event.target.value;
			if (newSortKey !== currentSortKey) {
				currentSortKey = newSortKey;
				currentSortOrder = getSortOrderForKey(currentSortKey);
				const orderToggle = container.querySelector(".bazaar-order-toggle");
				if (orderToggle) {
					orderToggle.textContent = currentSortOrder === "asc" ? "Asc" : "Desc";
				}
			} else {
				currentSortKey = newSortKey;
			}
			performSort(container);
		}
	});

	function performSort(container) {
		allListings = sortListings(allListings);
		const cardContainer = container.querySelector(".bazaar-card-container");
		const scrollWrapper = container.querySelector(".bazaar-scroll-wrapper");
		if (cardContainer && scrollWrapper) {
			scrollWrapper.scrollLeft = 0;
			container.lastRenderScrollLeft = undefined;
			renderVirtualCards(container);
		}
	}

	function addSettingsMenuItem() {
		const menu = document.querySelector(".settings-menu");
		if (!menu || document.querySelector(".bazaar-settings-button")) return;
		const li = document.createElement("li");
		li.className = "link bazaar-settings-button";
		const a = document.createElement("a");
		a.href = "#";
		const iconDiv = document.createElement("div");
		iconDiv.className = "icon-wrapper";
		const svgIcon = document.createElementNS(
			"http://www.w3.org/2000/svg",
			"svg",
		);
		svgIcon.setAttribute("class", "default");
		svgIcon.setAttribute("fill", "#fff");
		svgIcon.setAttribute("stroke", "transparent");
		svgIcon.setAttribute("stroke-width", "0");
		svgIcon.setAttribute("width", "16");
		svgIcon.setAttribute("height", "16");
		svgIcon.setAttribute("viewBox", "0 0 640 512");
		const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
		path.setAttribute(
			"d",
			"M36.8 192l566.3 0c20.3 0 36.8-16.5 36.8-36.8c0-7.3-2.2-14.4-6.2-20.4L558.2 21.4C549.3 8 534.4 0 518.3 0L121.7 0c-16 0-31 8-39.9 21.4L6.2 134.7c-4 6.1-6.2 13.2-6.2 20.4C0 175.5 16.5 192 36.8 192zM64 224l0 160 0 80c0 26.5 21.5 48 48 48l224 0c26.5 0 48-21.5 48-48l0-80 0-160-64 0 0 160-192 0 0-160-64 0zm448 0l0 256c0 17.7 14.3 32 32 32s32-14.3 32-32l0-256-64 0z",
		);
		const span = document.createElement("span");
		span.textContent = "Bazaar Settings";
		svgIcon.appendChild(path);
		iconDiv.appendChild(svgIcon);
		a.appendChild(iconDiv);
		a.appendChild(span);
		li.appendChild(a);
		a.addEventListener("click", (e) => {
			e.preventDefault();
			document.body.click();
			openSettingsModal();
		});
		const logoutButton = menu.querySelector("li.logout");
		if (logoutButton) {
			menu.insertBefore(li, logoutButton);
		} else {
			menu.appendChild(li);
		}
	}

	function openSettingsModal() {
		const overlay = document.createElement("div");
		overlay.className = "bazaar-modal-overlay";
		const modal = document.createElement("div");
		modal.className = "bazaar-settings-modal";
		modal.innerHTML = `
            <div class="bazaar-settings-title">Bazaar Listings Settings</div>
            <div class="bazaar-tabs">
                <div class="bazaar-tab active" data-tab="settings">Settings</div>
                <div class="bazaar-tab" data-tab="scripts">Other Scripts</div>
            </div>
            <div class="bazaar-tab-content active" id="tab-settings" style="max-height: 350px; overflow-y: auto;">
                <div class="bazaar-settings-group">
                    <div class="bazaar-settings-item">
                        <label for="bazaar-api-key">Torn API Key (Optional)</label>
                        <div style="display: flex; gap: 5px; align-items: center; width: 100%;">
                            <input type="text" id="bazaar-api-key" value="${scriptSettings.apiKey || ""}" placeholder="Enter your API key here" style="flex-grow: 1; max-width: none;">
                            <button class="bazaar-button refresh-market-data" id="refresh-market-data" style="white-space: nowrap; padding: 8px 10px; height: 35px;">Refresh Values</button>
                        </div>
                        <div id="refresh-status" style="margin-top: 5px; font-size: 12px; display: none;"></div>
                        <div class="bazaar-api-note">
                            Providing an API key enables market value comparison. Your key stays local.<br>
                            Alternatively, install <a href="https://greasyfork.org/en/scripts/527925-customizable-bazaar-filler" target="_blank">Bazaar Filler</a>, which works seamlessly with this script (Only ONE API call is made each day!)
                        </div>
                    </div>
                    <div class="bazaar-settings-item">
                        <label for="bazaar-default-sort">Default Sort</label>
                        <select id="bazaar-default-sort">
                            <option value="price" ${scriptSettings.defaultSort === "price" ? "selected" : ""}>Price</option>
                            <option value="quantity" ${scriptSettings.defaultSort === "quantity" ? "selected" : ""}>Quantity</option>
                            <option value="profit" ${scriptSettings.defaultSort === "profit" ? "selected" : ""}>Profit</option>
                            <option value="updated" ${scriptSettings.defaultSort === "updated" ? "selected" : ""}>Last Updated</option>
                        </select>
                        <div class="bazaar-api-note">
                            Choose how listings are sorted: Price, Quantity, Profit, or Last Updated.
                        </div>
                    </div>
                    <div class="bazaar-settings-item">
                        <label for="bazaar-default-order">Default Order</label>
                        <select id="bazaar-default-order">
                            <option value="asc" ${scriptSettings.defaultOrder === "asc" ? "selected" : ""}>Ascending</option>
                            <option value="desc" ${scriptSettings.defaultOrder === "desc" ? "selected" : ""}>Descending</option>
                        </select>
                        <div class="bazaar-api-note">
                            Choose the sorting direction.
                        </div>
                    </div>
                    <div class="bazaar-settings-item">
                        <label for="bazaar-listing-fee">Listing Fee (%)</label>
                        <input type="number" id="bazaar-listing-fee" class="bazaar-number-input" value="${scriptSettings.listingFee || 0}" min="0" max="100" step="1">
                        <div class="bazaar-api-note">
                            Set the fee percentage when listing items. (e.g., 10% fee means $10,000 on $100,000)
                        </div>
                    </div>
                    <div class="bazaar-settings-item">
                        <label for="bazaar-default-display">Default Display Mode</label>
                        <select id="bazaar-default-display">
                            <option value="percentage" ${scriptSettings.defaultDisplayMode === "percentage" ? "selected" : ""}>Percentage Difference</option>
                            <option value="profit" ${scriptSettings.defaultDisplayMode === "profit" ? "selected" : ""}>Potential Profit</option>
                        </select>
                        <div class="bazaar-api-note">
                            Choose whether to display price comparisons as a percentage or in dollars.
                        </div>
                    </div>
                    <div class="bazaar-settings-item">
                        <label for="bazaar-link-behavior">Bazaar Link Click Behavior</label>
                        <select id="bazaar-link-behavior">
                            <option value="new_tab" ${scriptSettings.linkBehavior === "new_tab" ? "selected" : ""}>Open in New Tab</option>
                            <option value="new_window" ${scriptSettings.linkBehavior === "new_window" ? "selected" : ""}>Open in New Window</option>
                            <option value="same_tab" ${scriptSettings.linkBehavior === "same_tab" ? "selected" : ""}>Open in Same Tab</option>
                        </select>
                        <div class="bazaar-api-note">
                            Choose how bazaar links open when clicked.
                        </div>
                    </div>
                </div>
            </div>
            <div class="bazaar-tab-content" id="tab-scripts" style="max-height: 350px; overflow-y: auto;">
                <div class="bazaar-script-item">
                    <div class="bazaar-script-name">Customizable Bazaar Filler</div>
                    <div class="bazaar-script-desc">Auto-fills bazaar item quantities and prices.</div>
                    <a href="https://greasyfork.org/en/scripts/527925-customizable-bazaar-filler" target="_blank" class="bazaar-script-link">Install from Greasy Fork</a>
                </div>
                <div class="bazaar-script-item">
                    <div class="bazaar-script-name">Torn Item Market Highlighter</div>
                    <div class="bazaar-script-desc">Highlights items based on rules and prices.</div>
                    <a href="https://greasyfork.org/en/scripts/513617-torn-item-market-highlighter" target="_blank" class="bazaar-script-link">Install from Greasy Fork</a>
                </div>
                <div class="bazaar-script-item">
                    <div class="bazaar-script-name">Torn Item Market Max Quantity Calculator</div>
                    <div class="bazaar-script-desc">Calculates the max quantity you can buy.</div>
                    <a href="https://greasyfork.org/en/scripts/513790-torn-item-market-max-quantity-calculator" target="_blank" class="bazaar-script-link">Install from Greasy Fork</a>
                </div>
                <div class="bazaar-script-item">
                    <div class="bazaar-script-name">Enhanced Chat Buttons V2</div>
                    <div class="bazaar-script-desc">Improves chat with extra buttons.</div>
                    <a href="https://greasyfork.org/en/scripts/488294-torn-com-enhanced-chat-buttons-v2" target="_blank" class="bazaar-script-link">Install from Greasy Fork</a>
                </div>
                <div class="bazaar-script-item">
                    <div class="bazaar-script-name">Market Item Locker</div>
                    <div class="bazaar-script-desc">Lock items when listing to avoid accidental sales.</div>
                    <a href="https://greasyfork.org/en/scripts/513784-torn-market-item-locker" target="_blank" class="bazaar-script-link">Install from Greasy Fork</a>
                </div>
                <div class="bazaar-script-item">
                    <div class="bazaar-script-name">Market Quick Remove</div>
                    <div class="bazaar-script-desc">Quickly remove items from your listings.</div>
                    <a href="https://greasyfork.org/en/scripts/515870-torn-market-quick-remove" target="_blank" class="bazaar-script-link">Install from Greasy Fork</a>
                </div>
                <div class="bazaar-script-item">
                    <div class="bazaar-script-name">Trade Chat Timer on Button</div>
                    <div class="bazaar-script-desc">Adds a timer to the trade chat button.</div>
                    <a href="https://greasyfork.org/en/scripts/496284-trade-chat-timer-on-button" target="_blank" class="bazaar-script-link">Install from Greasy Fork</a>
                </div>
            </div>
            <div class="bazaar-settings-buttons">
                <button class="bazaar-settings-save">Save</button>
                <button class="bazaar-settings-cancel">Cancel</button>
            </div>
            <div class="bazaar-settings-footer">
                <p>This script uses data from <a href="https://tornpal.com" target="_blank">TornPal</a> and <a href="https://www.ironnerd.me/torn/" target="_blank">IronNerd</a>.</p>
                <p>Created by <a href="https://www.torn.com/profiles.php?XID=1853324" target="_blank">Weav3r [1853324]</a></p>
            </div>
        `;
		overlay.appendChild(modal);
		const tabs = modal.querySelectorAll(".bazaar-tab");
		tabs.forEach((tab) => {
			tab.addEventListener("click", function () {
				tabs.forEach((t) => t.classList.remove("active"));
				this.classList.add("active");
				modal
					.querySelectorAll(".bazaar-tab-content")
					.forEach((content) => content.classList.remove("active"));
				document
					.getElementById(`tab-${this.getAttribute("data-tab")}`)
					.classList.add("active");
			});
		});
		modal
			.querySelector(".bazaar-settings-save")
			.addEventListener("click", () => {
				saveSettingsFromModal(modal);
				overlay.remove();
			});
		modal
			.querySelector(".bazaar-settings-cancel")
			.addEventListener("click", () => {
				overlay.remove();
			});
		overlay.addEventListener("click", (e) => {
			if (e.target === overlay) overlay.remove();
		});
		document.body.appendChild(overlay);
	}

	function saveSettingsFromModal(modal) {
		const oldLinkBehavior = scriptSettings.linkBehavior;
		scriptSettings.apiKey = modal.querySelector("#bazaar-api-key").value.trim();
		scriptSettings.defaultSort = modal.querySelector(
			"#bazaar-default-sort",
		).value;
		scriptSettings.defaultOrder = modal.querySelector(
			"#bazaar-default-order",
		).value;
		scriptSettings.listingFee = Math.round(
			Number.parseFloat(modal.querySelector("#bazaar-listing-fee").value) || 0,
		);
		scriptSettings.defaultDisplayMode = modal.querySelector(
			"#bazaar-default-display",
		).value;
		scriptSettings.linkBehavior = modal.querySelector(
			"#bazaar-link-behavior",
		).value;

		if (scriptSettings.listingFee < 0) scriptSettings.listingFee = 0;
		if (scriptSettings.listingFee > 100) scriptSettings.listingFee = 100;
		currentSortKey = scriptSettings.defaultSort;
		currentSortOrder = scriptSettings.defaultOrder;
		displayMode = scriptSettings.defaultDisplayMode;
		saveSettings();
		document.querySelectorAll(".bazaar-info-container").forEach((container) => {
			const sortSelect = container.querySelector(".bazaar-sort-select");
			if (sortSelect) sortSelect.value = currentSortKey;
			const orderToggle = container.querySelector(".bazaar-order-toggle");
			if (orderToggle)
				orderToggle.textContent = currentSortOrder === "asc" ? "Asc" : "Desc";
			const displayToggle = container.querySelector(".bazaar-display-toggle");
			if (displayToggle)
				displayToggle.textContent = displayMode === "percentage" ? "%" : "$";
			if (oldLinkBehavior !== scriptSettings.linkBehavior) {
				const cardContainer = container.querySelector(".bazaar-card-container");
				if (cardContainer) {
					cardContainer.innerHTML = "";
					container.lastRenderScrollLeft = undefined;
					renderVirtualCards(container);
				}
			} else {
				performSort(container);
			}
		});
		if (scriptSettings.apiKey) {
			fetchTornItems(true);
		}
	}

	function fetchTornItems(forceRefresh = false) {
		const stored = GM_getValue("tornItems");
		const lastUpdated = GM_getValue("lastTornItemsUpdate") || 0;
		const now = Date.now();
		const oneDayMs = 24 * 60 * 60 * 1000;
		const lastUTC = new Date(Number.parseInt(lastUpdated))
			.toISOString()
			.split("T")[0];
		const todayUTC = new Date().toISOString().split("T")[0];
		const lastHour = Math.floor(
			Number.parseInt(lastUpdated) / (60 * 60 * 1000),
		);
		const currentHour = Math.floor(now / (60 * 60 * 1000));

		const needsRefresh =
			forceRefresh ||
			lastUTC < todayUTC ||
			now - lastUpdated >= oneDayMs ||
			(lastHour < currentHour && currentHour - lastHour >= 1);

		if (scriptSettings.apiKey && (!stored || needsRefresh)) {
			const refreshStatus = document.getElementById("refresh-status");
			if (refreshStatus) {
				refreshStatus.style.display = "block";
				refreshStatus.textContent = "Fetching market values...";
				refreshStatus.style.color = currentDarkMode ? "#aaa" : "#666";
			}

			return fetch(
				`https://api.torn.com/torn/?key=${scriptSettings.apiKey}&selections=items&comment=wBazaars`,
			)
				.then((r) => r.json())
				.then((data) => {
					if (!data.items) {
						console.error(
							"Failed to fetch Torn items. Check your API key or rate limit.",
						);
						if (refreshStatus) {
							refreshStatus.textContent = data.error
								? `Error: ${data.error.error}`
								: "Failed to fetch market values. Check your API key.";
							refreshStatus.style.color = "#cc0000";
							setTimeout(() => {
								refreshStatus.style.display = "none";
							}, 5000);
						}
						return false;
					}

					cachedItemsData = null;

					const filtered = {};
					for (const [id, item] of Object.entries(data.items)) {
						if (item.tradeable) {
							filtered[id] = {
								name: item.name,
								market_value: item.market_value,
							};
						}
					}
					GM_setValue("tornItems", JSON.stringify(filtered));
					GM_setValue("lastTornItemsUpdate", now.toString());

					if (refreshStatus) {
						refreshStatus.textContent = `Market values updated successfully! (${todayUTC})`;
						refreshStatus.style.color = "#009900";
						setTimeout(() => {
							refreshStatus.style.display = "none";
						}, 3000);
					}

					document
						.querySelectorAll(".bazaar-info-container")
						.forEach((container) => {
							if (container.isConnected) {
								const cardContainer = container.querySelector(
									".bazaar-card-container",
								);
								if (cardContainer) {
									cardContainer.innerHTML = "";
									container.lastRenderScrollLeft = undefined;
									renderVirtualCards(container);
								}
							}
						});

					return true;
				})
				.catch((err) => {
					console.error("Error fetching Torn items:", err);
					if (refreshStatus) {
						refreshStatus.textContent = `Error: ${err.message || "Failed to fetch market values"}`;
						refreshStatus.style.color = "#cc0000";
						setTimeout(() => {
							refreshStatus.style.display = "none";
						}, 5000);
					}
					return false;
				});
		}
		return Promise.resolve(false);
	}

	document.body.addEventListener("click", (event) => {
		if (
			event.target.id === "refresh-market-data" ||
			event.target.closest("#refresh-market-data")
		) {
			event.preventDefault();
			const apiKeyInput = document.getElementById("bazaar-api-key");
			const refreshStatus = document.getElementById("refresh-status");

			if (!apiKeyInput || !apiKeyInput.value.trim()) {
				if (refreshStatus) {
					refreshStatus.style.display = "block";
					refreshStatus.textContent = "Please enter an API key first.";
					refreshStatus.style.color = "#cc0000";
					setTimeout(() => {
						refreshStatus.style.display = "none";
					}, 3000);
				}
				return;
			}

			scriptSettings.apiKey = apiKeyInput.value.trim();
			fetchTornItems(true);
		}
	});

	function observeUserMenu() {
		const menuObserver = new MutationObserver((mutations) => {
			mutations.forEach((mutation) => {
				if (mutation.addedNodes.length > 0) {
					for (const node of mutation.addedNodes) {
						if (
							node.nodeType === Node.ELEMENT_NODE &&
							node.classList.contains("settings-menu")
						) {
							addSettingsMenuItem();
							break;
						}
					}
				}
			});
		});
		menuObserver.observe(document.body, { childList: true, subtree: true });
		if (document.querySelector(".settings-menu")) {
			addSettingsMenuItem();
		}
	}
	observeUserMenu();

	function getSortOrderForKey(key) {
		return key === "price" ? "asc" : "desc";
	}

	function cleanupResources() {
		if (observer) {
			observer.disconnect();
		}
		if (bodyObserver) {
			bodyObserver.disconnect();
		}
		document
			.querySelectorAll(".bazaar-scroll-container")
			.forEach((container) => {
				const scrollWrapper = container.querySelector(".bazaar-scroll-wrapper");
				if (scrollWrapper?.isScrolling) {
					cancelAnimationFrame(scrollWrapper.scrollAnimationId);
				}
			});
	}
	window.addEventListener("beforeunload", cleanupResources);

	// Function to detect if running in Torn PDA
	function isTornPDAEnvironment() {
		return new Promise((resolve) => {
			if (typeof window.flutter_inappwebview !== "undefined") {
				window.flutter_inappwebview
					.callHandler("isTornPDA")
					.then((response) => {
						resolve(response?.isTornPDA);
					})
					.catch(() => {
						resolve(false);
					});
			} else {
				resolve(false);
			}
		});
	}

	// Function to evaluate JavaScript using appropriate method based on environment
	function evaluateJavaScript(code) {
		return new Promise((resolve, reject) => {
			isTornPDAEnvironment()
				.then((isPDA) => {
					if (isPDA) {
						// Use Torn PDA's JavaScript evaluation handler
						window.flutter_inappwebview
							.callHandler("PDA_evaluateJavascript", code)
							.then(resolve)
							.catch(reject);
					} else {
						// Use standard eval in non-PDA environments
						try {
							// Using Function constructor is slightly safer than direct eval
							const result = Function(`"use strict";${code}`)();
							resolve(result);
						} catch (error) {
							reject(error);
						}
					}
				})
				.catch(reject);
		});
	}

	// Create a function to handle API POST requests to TornPal and IronNerd
	function makeAPIPostRequest(url, data, callback) {
		const MAX_RETRIES = 2;
		const TIMEOUT_MS = 10000;
		const RETRY_DELAY_MS = 2000;
		let retryCount = 0;

		function attemptPost() {
			const timeoutId = setTimeout(() => {
				console.warn(
					`POST request to ${url} timed out, ${retryCount < MAX_RETRIES ? "retrying..." : "giving up."}`,
				);
				if (retryCount < MAX_RETRIES) {
					retryCount++;
					setTimeout(attemptPost, RETRY_DELAY_MS);
				} else {
					callback(null);
				}
			}, TIMEOUT_MS);

			// Determine if we're in Torn PDA environment
			if (typeof window.flutter_inappwebview !== "undefined") {
				window.flutter_inappwebview
					.callHandler("isTornPDA")
					.then((response) => {
						if (response?.isTornPDA) {
							// Use Torn PDA's HTTP POST handler
							const headers = {
								"Content-Type": "application/json",
								Accept: "application/json",
							};

							const body =
								typeof data === "string" ? data : JSON.stringify(data);

							window.flutter_inappwebview
								.callHandler("PDA_httpPost", url, headers, body)
								.then((response) => {
									clearTimeout(timeoutId);
									try {
										if (response.status >= 200 && response.status < 300) {
											callback(JSON.parse(response.responseText));
										} else {
											console.warn(
												`POST request to ${url} failed with status ${response.status}`,
											);
											if (retryCount < MAX_RETRIES) {
												retryCount++;
												setTimeout(attemptPost, RETRY_DELAY_MS);
											} else {
												callback(null);
											}
										}
									} catch (e) {
										console.error(`Error parsing response from ${url}:`, e);
										callback(null);
									}
								})
								.catch((error) => {
									clearTimeout(timeoutId);
									console.warn(`POST request to ${url} failed:`, error);
									if (retryCount < MAX_RETRIES) {
										retryCount++;
										setTimeout(attemptPost, RETRY_DELAY_MS);
									} else {
										callback(null);
									}
								});
						} else {
							// Use standard GM methods
							useStandardPostMethod();
						}
					})
					.catch(() => {
						// If handler check fails, use standard methods
						useStandardPostMethod();
					});
			} else {
				// Not in Torn PDA, use standard methods
				useStandardPostMethod();
			}

			function useStandardPostMethod() {
				const postFunction =
					typeof GM_xmlhttpRequest !== "undefined"
						? GM_xmlhttpRequest
						: typeof GM !== "undefined" &&
								typeof GM.xmlHttpRequest !== "undefined"
							? GM.xmlHttpRequest
							: null;

				if (!postFunction) {
					console.error(
						"Neither GM_xmlhttpRequest nor GM.xmlHttpRequest are available",
					);
					clearTimeout(timeoutId);
					callback(null);
					return;
				}

				postFunction({
					method: "POST",
					url,
					data: typeof data === "string" ? data : JSON.stringify(data),
					headers: {
						"Content-Type": "application/json",
						Accept: "application/json",
					},
					timeout: TIMEOUT_MS,
					onload: (res) => {
						clearTimeout(timeoutId);
						try {
							if (res.status >= 200 && res.status < 300) {
								callback(JSON.parse(res.responseText));
							} else {
								console.warn(
									`POST request to ${url} failed with status ${res.status}`,
								);
								if (retryCount < MAX_RETRIES) {
									retryCount++;
									setTimeout(attemptPost, RETRY_DELAY_MS);
								} else {
									callback(null);
								}
							}
						} catch (e) {
							console.error(`Error parsing response from ${url}:`, e);
							callback(null);
						}
					},
					onerror: (error) => {
						clearTimeout(timeoutId);
						console.warn(`POST request to ${url} failed:`, error);
						if (retryCount < MAX_RETRIES) {
							retryCount++;
							setTimeout(attemptPost, RETRY_DELAY_MS);
						} else {
							callback(null);
						}
					},
					ontimeout: () => {
						clearTimeout(timeoutId);
						console.warn(`POST request to ${url} timed out natively`);
						if (retryCount < MAX_RETRIES) {
							retryCount++;
							setTimeout(attemptPost, RETRY_DELAY_MS);
						} else {
							callback(null);
						}
					},
				});
			}
		}

		attemptPost();
	}
})();
