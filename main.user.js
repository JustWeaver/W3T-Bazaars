    // ==UserScript==
    // @name         Bazaars in Item Market powered by TornPal BETA
    // @namespace    http://tampermonkey.net/
    // @version      2.41
    // @description  Displays bazaar listings with sorting controls via TornPal
    // @author       Weav3r
    // @match        https://www.torn.com/*
    // @grant        GM.xmlHttpRequest
    // @grant        GM.setValue
    // @grant        GM.getValue
    // @grant        GM.deleteValue
    // @grant        GM.listValues
    // @grant        unsafeWindow
    // @connect      tornpal.com
    // @run-at       document-end
    // ==/UserScript==

    (function () {
        'use strict';

        class StorageManager {
            static async get(key) {
                if (typeof GM_getValue !== 'undefined') {
                    return GM_getValue(key);
                } else if (typeof GM !== 'undefined' && typeof GM.getValue === 'function') {
                    return await GM.getValue(key);
                } else {
                    const value = localStorage.getItem('GMcompat_' + key);
                    return value !== null ? JSON.parse(value) : undefined;
                }
            }

            static async set(key, value) {
                if (typeof GM_setValue !== 'undefined') {
                    GM_setValue(key, value);
                } else if (typeof GM !== 'undefined' && typeof GM.setValue === 'function') {
                    await GM.setValue(key, value);
                } else {
                    localStorage.setItem('GMcompat_' + key, JSON.stringify(value));
                }
            }

            static async delete(key) {
                if (typeof GM_deleteValue !== 'undefined') {
                    GM_deleteValue(key);
                } else if (typeof GM !== 'undefined' && typeof GM.deleteValue === 'function') {
                    await GM.deleteValue(key);
                } else {
                    localStorage.removeItem('GMcompat_' + key);
                }
            }

            static async list() {
                if (typeof GM_listValues !== 'undefined') {
                    return GM_listValues();
                } else if (typeof GM !== 'undefined' && typeof GM.listValues === 'function') {
                    return await GM.listValues();
                } else {
                    const keys = [];
                    for (let i = 0; i < localStorage.length; i++) {
                        const key = localStorage.key(i);
                        if (key.startsWith('GMcompat_')) {
                            keys.push(key.substring(9));
                        }
                    }
                    return keys;
                }
            }

            static getSync(key, defaultValue) {
                if (typeof GM_getValue !== 'undefined') {
                    return GM_getValue(key, defaultValue);
                } else {
                    try {
                        const value = localStorage.getItem('GMcompat_' + key);
                        return value !== null ? JSON.parse(value) : defaultValue;
                    } catch (e) {
                        return defaultValue;
                    }
                }
            }
        }

        // Safely handle unsafeWindow, particularly for TornPDA
        const globalWindow = window;
        const safeWindow = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;
        let currentItemID = null;

        function findMarketElements() {
            const isMobile = window.innerWidth <= 784;
            let wrapper, nameEl;

            if (isMobile) {

                wrapper = document.querySelector('ul.sellerList___e4C9_, ul[class*="sellerList"]');

                // Simple name selector that just works todd howard meme
                nameEl = document.querySelector('.itemName___tuYnr, .title___ruNCT');
            } else {
                wrapper = document.querySelector('[class*="sellerListWrapper"]');
                if (wrapper) {
                    const itemTile = wrapper.previousElementSibling;
                    if (itemTile) {
                        nameEl = itemTile.querySelector('.name___ukdHN');
                    }
                }
            }

            return { wrapper, nameEl };
        }

        class CacheManager {
            static CACHE_DURATION_MS = 60000;
            static cachedItemsData = null;

            static getStoredItems() {
                if (this.cachedItemsData === null) {
                    try {
                        this.cachedItemsData = JSON.parse(StorageManager.getSync("tornItems", "{}"));
                    } catch (e) {
                        this.cachedItemsData = {};
                        console.error("Stored items got funky:", e);
                    }
                }
                return this.cachedItemsData;
            }

            static getCache(itemId) {
                try {
                    const key = "tornBazaarCache_" + itemId;
                    const cached = StorageManager.getSync(key);
                    if (cached) {
                        const payload = JSON.parse(cached);
                        if (Date.now() - payload.timestamp < this.CACHE_DURATION_MS) {
                            return payload.data;
                        } else {
                            // Cache expired, remove it
                            this.clearItemCache(itemId);
                        }
                    }
                } catch (e) {
                    console.error("Cache retrieval error:", e);
                }
                return null;
            }

            static setCache(itemId, data) {
                try {
                    const key = "tornBazaarCache_" + itemId;
                    StorageManager.set(key, JSON.stringify({
                        timestamp: Date.now(),
                        data,
                        itemId // Store itemId in cache for validation
                    })).catch(e => console.error(`Error caching data for item ${itemId}:`, e));
                } catch (e) {
                    console.error("Cache setting error:", e);
                }
            }

            static clearItemCache(itemId) {
                try {
                    const key = "tornBazaarCache_" + itemId;
                    StorageManager.delete(key);
                } catch (e) {
                    console.error("Cache clearing error:", e);
                }
            }

            static clearItemsCache() {
                this.cachedItemsData = null;
            }
        }

        // Use a try-catch to handle potential errors more gracefully
        try {
            const fetchProxy = new Proxy(safeWindow.fetch, {
                apply: function(target, thisArg, argumentsList) {
                    const [resource, init] = argumentsList;
                    const url = typeof resource === 'string' ? resource : resource.url;
                    const fetchPromise = target.apply(thisArg, argumentsList);

                    if (window.location.href.includes('page.php?sid=ItemMarket') &&
                        url && url.includes('page.php?sid=iMarket&step=getListing')) {

                        const id = init?.body instanceof FormData ? init.body.get('itemID') : null;

                        if (id) {
                            // Clear old data when switching items
                            if (currentItemID && currentItemID !== id) {
                                scriptSettings.allListings = [];
                                const oldContainer = document.querySelector(`.bazaar-info-container[data-itemid="${currentItemID}"]`);
                                if (oldContainer) {
                                    oldContainer.remove();
                                }
                            }

                            currentItemID = id;

                            const observer = new MutationObserver(() => {
                                const { wrapper, nameEl } = findMarketElements();
                                if (wrapper && !wrapper.querySelector('.bazaar-info-container')) {
                                    updateInfoContainer(wrapper, id, nameEl ? nameEl.textContent.trim() : `Item #${id}`);
                                    observer.disconnect();
                                }
                            });

                            const marketWrapper = document.querySelector('.marketWrapper___S5pRm, [class*="marketWrapper"]');
                            if (marketWrapper) {
                                observer.observe(marketWrapper, { childList: true, subtree: true });
                            }
                        }
                    }

                    return fetchPromise;
                }
            });

            safeWindow.fetch = fetchProxy;
        } catch (error) {
            console.warn("Failed to proxy fetch, some functionality might be limited:", error);
        }

        const CARD_WIDTH = 180;

        const scriptSettings = {
            sortKey: "price",
            sortOrder: "asc",
            apiKey: "",
            listingFee: parseFloat(StorageManager.getSync("bazaarListingFee", "0")),
            displayMode: "percentage",
            linkBehavior: StorageManager.getSync("bazaarLinkBehavior", "new_tab"),
            allListings: [],
            currentItemName: ""
        };

        class SettingsManager {
            static async load() {
                try {
                    const saved = await StorageManager.get("bazaarsSettings");
                    if (saved) {
                        const parsedSettings = JSON.parse(saved);
                        Object.assign(scriptSettings, parsedSettings);
                    }
                } catch (e) {
                    console.error("Settings load error:", e);
                }
            }

            static async save() {
                try {
                    await StorageManager.set("bazaarsSettings", JSON.stringify(scriptSettings));
                    await StorageManager.set("bazaarApiKey", scriptSettings.apiKey || "");
                    await StorageManager.set("bazaarDefaultSort", scriptSettings.sortKey || "price");
                    await StorageManager.set("bazaarDefaultOrder", scriptSettings.sortOrder || "asc");
                    await StorageManager.set("bazaarListingFee", scriptSettings.listingFee || 0);
                    await StorageManager.set("bazaarDefaultDisplayMode", scriptSettings.displayMode || "percentage");
                    await StorageManager.set("bazaarLinkBehavior", scriptSettings.linkBehavior || "new_tab");
                } catch (e) {
                    console.error("Settings save error:", e);
                }
            }

            static async update(newSettings) {
                if (newSettings) {
                    Object.assign(scriptSettings, newSettings);
                    await this.save();
                }
            }
        }

        SettingsManager.load();

        const style = document.createElement("style");
        style.textContent = `
            :root {
                --bazaar-tooltip-bg: #fff;
                --bazaar-tooltip-color: #333;
                --bazaar-tooltip-border: #ddd;
                --bazaar-tooltip-hr-color: #ddd;
                --bazaar-profit-pos: #006400;
                --bazaar-profit-neg: #8b0000;
                --bazaar-profit-neutral: #666666;
                --bazaar-muted-text: #666;
                --bazaar-error-text: #cc0000;
            }

            .dark-mode {
                --bazaar-tooltip-bg: #333;
                --bazaar-tooltip-color: #fff;
                --bazaar-tooltip-border: #555;
                --bazaar-tooltip-hr-color: #444;
                --bazaar-profit-pos: #7fff7f;
                --bazaar-profit-neg: #ff7f7f;
                --bazaar-profit-neutral: #cccccc;
                --bazaar-muted-text: #aaa;
                --bazaar-error-text: #ff9999;
            }

            .bazaar-market-value {
                color: var(--bazaar-muted-text);
            }

            .bazaar-error-message {
                color: var(--bazaar-error-text);
            }

            .bazaar-profit-tooltip {
                position: fixed;
                background: var(--bazaar-tooltip-bg);
                color: var(--bazaar-tooltip-color);
                border: 1px solid var(--bazaar-tooltip-border);
                padding: 10px 14px;
                border-radius: 5px;
                box-shadow: 0 3px 10px rgba(0,0,0,0.3);
                z-index: 99999;
                min-width: 200px;
                max-width: 280px;
                width: auto;
                pointer-events: none;
                transition: opacity 0.2s ease;
                font-size: 13px;
                line-height: 1.4;
            }

            @media (max-width: 768px) {
                .bazaar-profit-tooltip {
                    font-size: 12px;
                    max-width: 260px;
                    padding: 8px 12px;
                }
            }

            .bazaar-button {
                padding: 3px 6px;
                border: 1px solid #ccc;
                border-radius: 4px;
                background-color: #fff;
                color: #000;
                cursor: pointer;
                font-size: 12px;
                margin-left: 4px;
            }
            .dark-mode .bazaar-button {
                border: 1px solid #444;
                background-color: #1a1a1a;
                color: #fff;
            }
            .bazaar-modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0,0,0,0.7);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 99999;
            }
            .bazaar-info-container {
                font-size: 13px;
                border-radius: 4px;
                margin: 5px 0;
                padding: 10px;
                display: flex;
                flex-direction: column;
                gap: 8px;
                background-color: #f9f9f9;
                color: #000;
                border: 1px solid #ccc;
                box-sizing: border-box;
                width: 100%;
                overflow: hidden;
            }
            .dark-mode .bazaar-info-container {
                background-color: #2f2f2f;
                color: #ccc;
                border: 1px solid #444;
            }
            .bazaar-info-header {
                font-size: 16px;
                font-weight: bold;
                color: #000;
            }
            .dark-mode .bazaar-info-header {
                color: #fff;
            }
            .bazaar-sort-controls {
                display: flex;
                align-items: center;
                gap: 5px;
                font-size: 12px;
                padding: 5px;
                background-color: #eee;
                border-radius: 4px;
                border: 1px solid #ccc;
            }
            .dark-mode .bazaar-sort-controls {
                background-color: #333;
                border: 1px solid #444;
            }
            .bazaar-sort-select {
                padding: 3px 24px 3px 8px;
                border: 1px solid #ccc;
                border-radius: 4px;
                background: #fff url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAiIGhlaWdodD0iNiIgdmlld0JveD0iMCAwIDEwIDYiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTAgMGw1IDYgNS02eiIgZmlsbD0iIzY2NiIvPjwvc3ZnPg==") no-repeat right 8px center;
                background-size: 10px 6px;
                -webkit-appearance: none;
                -moz-appearance: none;
                appearance: none;
                cursor: pointer;
            }
            .bazaar-profit-tooltip {
                position: fixed;
                background: #fff;
                color: #333;
                border: 1px solid #ddd;
                padding: 8px 12px;
                border-radius: 4px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                z-index: 99999;
                min-width: 200px;
                max-width: 280px;
                width: auto;
                pointer-events: none;
                transition: opacity 0.2s ease;
            }
            .dark-mode .bazaar-profit-tooltip {
                background: #333;
                color: #fff;
                border: 1px solid #555;
            }
            .dark-mode .bazaar-sort-select {
                border: 1px solid #444;
                background-color: #1a1a1a;
                color: #fff;
                background-image: url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAiIGhlaWdodD0iNiIgdmlld0JveD0iMCAwIDEwIDYiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTAgMGw1IDYgNS02eiIgZmlsbD0iI2NjYyIvPjwvc3ZnPg==");
            }
            .bazaar-sort-select:focus {
                outline: none;
                border-color: #0078d7;
                box-shadow: 0 0 0 1px #0078d7;
            }
            .bazaar-min-qty {
                background-color: #fff;
                color: #000;
                font-size: 12px;
            }
            .dark-mode .bazaar-min-qty {
                border: 1px solid #444 !important;
                background-color: #1a1a1a;
                color: #fff;
            }
            .bazaar-min-qty:focus {
                outline: none;
                border-color: #0078d7 !important;
                box-shadow: 0 0 0 1px #0078d7;
            }
            .bazaar-scroll-container {
                position: relative;
                display: flex;
                align-items: stretch;
                width: 100%;
                box-sizing: border-box;
            }
            .bazaar-scroll-wrapper {
                flex: 1;
                overflow-x: auto;
                overflow-y: hidden;
                height: 100px;
                white-space: nowrap;
                padding-bottom: 3px;
                border-radius: 4px;
                border: 1px solid #ccc;
                margin: 0 auto;
                max-width: calc(100% - 30px);
                position: relative;
            }
            .dark-mode .bazaar-scroll-wrapper {
                border: 1px solid #444;
            }
            .bazaar-scroll-arrow {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 12px;
                flex-shrink: 0;
                flex-grow: 0;
                cursor: pointer;
                background-color: transparent;
                border: none;
                opacity: 0.5;
                transition: opacity 0.2s ease;
                margin: 0 1px;
                z-index: 2;
                position: relative;
            }
            .bazaar-scroll-arrow:hover {
                opacity: 0.9;
                background-color: transparent;
            }
            .dark-mode .bazaar-scroll-arrow {
                background-color: transparent;
                border: none;
            }
            .bazaar-scroll-arrow svg {
                width: 18px !important;
                height: 18px !important;
                color: #888;
            }
            .dark-mode .bazaar-scroll-arrow svg {
                color: #777;
            }
            .bazaar-scroll-arrow.left {
                padding-left: 10px;
                margin-left: -10px;
            }
            .bazaar-scroll-arrow.right {
                padding-right: 10px;
                margin-right: -10px;
            }
            .bazaar-scroll-wrapper::-webkit-scrollbar {
                height: 8px;
            }
            .bazaar-scroll-wrapper::-webkit-scrollbar-track {
                background: #f1f1f1;
            }
            .bazaar-scroll-wrapper::-webkit-scrollbar-thumb {
                background: #888;
                border-radius: 4px;
            }
            .bazaar-scroll-wrapper::-webkit-scrollbar-thumb:hover {
                background: #555;
            }
            .dark-mode .bazaar-scroll-wrapper::-webkit-scrollbar-track {
                background: #333;
            }
            .dark-mode .bazaar-scroll-wrapper::-webkit-scrollbar-thumb {
                background: #555;
            }
            .dark-mode .bazaar-scroll-wrapper::-webkit-scrollbar-thumb:hover {
                background: #777;
            }
            .bazaar-card-container {
                position: relative;
                height: 100%;
                display: flex;
                align-items: center;
            }
            .bazaar-listing-card {
                position: absolute;
                min-width: 140px;
                max-width: 200px;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                border-radius: 4px;
                padding: 8px;
                font-size: clamp(12px, 1vw, 14px);
                box-sizing: border-box;
                overflow: hidden;
                background-color: #fff;
                color: #000;
                border: 1px solid #ccc;
                top: 50%;
                transform: translateY(-50%);
                word-break: break-word;
                height: auto;
                transition: left 0.5s ease, opacity 0.5s ease, transform 0.5s ease;
            }
            .dark-mode .bazaar-listing-card {
                background-color: #1a1a1a;
                color: #fff;
                border: 1px solid #444;
            }
            .fade-in {
                opacity: 0;
                transform: translateY(-50%) scale(0.8);
            }
            .fade-out {
                opacity: 0;
                transform: translateY(-50%) scale(0.8);
            }
            .bazaar-listing-footnote {
                font-size: 11px;
                text-align: right;
                color: #555;
            }
            .dark-mode .bazaar-listing-footnote {
                color: #aaa;
            }
            .bazaar-footer-container {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-top: 5px;
                font-size: 10px;
            }
            .bazaar-powered-by span {
                color: #999;
            }
            .dark-mode .bazaar-powered-by span {
                color: #666;
            }
            .bazaar-powered-by a {
                text-decoration: underline;
                color: #555;
            }
            .dark-mode .bazaar-powered-by a {
                color: #aaa;
            }
            @keyframes popAndFlash {
                0%   { transform: scale(1); background-color: rgba(0,255,0,0.6); }
                50%  { transform: scale(1.05); }
                100% { transform: scale(1); background-color: inherit; }
            }
            .pop-flash {
                animation: popAndFlash 0.8s ease-in-out forwards;
            }
            .green-outline {
                border: 3px solid green !important;
            }
            .bazaar-settings-modal {
                background-color: #fff;
                border-radius: 8px;
                padding: 24px;
                width: 500px;
                max-width: 95vw;
                max-height: 90vh;
                overflow-y: auto;
                box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                position: relative;
                z-index: 100000;
                font-family: 'Arial', sans-serif;
            }
            .dark-mode .bazaar-settings-modal {
                background-color: #2a2a2a;
                color: #e0e0e0;
                border: 1px solid #444;
            }
            .bazaar-settings-title {
                font-size: 20px;
                font-weight: bold;
                margin-bottom: 20px;
                color: #333;
            }
            .dark-mode .bazaar-settings-title {
                color: #fff;
            }
            .bazaar-tabs {
                display: flex;
                border-bottom: 1px solid #ddd;
                margin-bottom: 20px;
                padding-bottom: 0;
                flex-wrap: wrap;
            }
            .dark-mode .bazaar-tabs {
                border-bottom: 1px solid #444;
            }
            .bazaar-tab {
                padding: 10px 16px;
                cursor: pointer;
                margin-right: 5px;
                margin-bottom: 5px;
                border: 1px solid transparent;
                border-bottom: none;
                border-radius: 4px 4px 0 0;
                font-weight: normal;
                background-color: #f5f5f5;
                color: #555;
                position: relative;
                bottom: -1px;
            }
            .dark-mode .bazaar-tab {
                background-color: #333;
                color: #ccc;
            }
            .bazaar-tab.active {
                background-color: #fff;
                color: #333;
                border-color: #ddd;
                font-weight: bold;
                padding-bottom: 11px;
            }
            .dark-mode .bazaar-tab.active {
                background-color: #2a2a2a;
                color: #fff;
                border-color: #444;
            }
            .bazaar-tab-content {
                display: none;
            }
            .bazaar-tab-content.active {
                display: block;
            }
            .bazaar-settings-group {
                margin-bottom: 20px;
            }
            .bazaar-settings-item {
                margin-bottom: 18px;
            }
            .bazaar-settings-item label {
                display: block;
                margin-bottom: 8px;
                font-weight: bold;
                font-size: 14px;
            }
            .bazaar-settings-item input[type="text"],
            .bazaar-settings-item select,
            .bazaar-number-input {
                width: 100%;
                padding: 8px 12px;
                border: 1px solid #ccc;
                border-radius: 4px;
                font-size: 14px;
                background-color: #fff;
                color: #333;
                max-width: 200px;
            }
            .dark-mode .bazaar-settings-item input[type="text"],
            .dark-mode .bazaar-settings-item select,
            .dark-mode .bazaar-number-input {
                border: 1px solid #444;
                background-color: #222;
                color: #e0e0e0;
            }
            .bazaar-settings-item select {
                max-width: 200px;
            }
            .bazaar-number-input {
                -moz-appearance: textfield;
                appearance: textfield;
                width: 60px !important;
            }
            .bazaar-number-input::-webkit-outer-spin-button,
            .bazaar-number-input::-webkit-inner-spin-button {
                -webkit-appearance: none;
                margin: 0;
            }
            .bazaar-api-note {
                font-size: 12px;
                margin-top: 6px;
                color: #666;
                line-height: 1.4;
            }
            .dark-mode .bazaar-api-note {
                color: #aaa;
            }
            .bazaar-script-item {
                margin-bottom: 16px;
                padding-bottom: 16px;
                border-bottom: 1px solid #eee;
            }
            .dark-mode .bazaar-script-item {
                border-bottom: 1px solid #333;
            }
            .bazaar-script-item:last-child {
                border-bottom: none;
            }
            .bazaar-script-name {
                font-weight: bold;
                font-size: 16px;
                margin-bottom: 5px;
            }
            .bazaar-script-desc {
                margin-bottom: 8px;
                line-height: 1.4;
                color: #555;
            }
            .dark-mode .bazaar-script-desc {
                color: #bbb;
            }
            .bazaar-script-link {
                display: inline-block;
                margin-top: 5px;
                color: #2196F3;
                text-decoration: none;
            }
            .bazaar-script-link:hover {
                text-decoration: underline;
            }
            .bazaar-changelog {
                margin-bottom: 20px;
            }
            .bazaar-changelog-version {
                font-weight: bold;
                margin-bottom: 8px;
                font-size: 15px;
            }
            .bazaar-changelog-date {
                font-style: italic;
                color: #666;
                font-size: 13px;
                margin-bottom: 5px;
            }
            .dark-mode .bazaar-changelog-date {
                color: #aaa;
            }
            .bazaar-changelog-list {
                margin-left: 20px;
                margin-bottom: 15px;
            }
            .bazaar-changelog-item {
                margin-bottom: 5px;
                line-height: 1.4;
            }
            .bazaar-credits {
                margin-top: 20px;
                padding-top: 15px;
                border-top: 1px solid #eee;
            }
            .dark-mode .bazaar-credits {
                border-top: 1px solid #444;
            }
            .bazaar-credits h3 {
                font-size: 16px;
                margin-bottom: 10px;
            }
            .bazaar-credits p {
                line-height: 1.4;
                margin-bottom: 8px;
            }
            .bazaar-provider {
                font-weight: bold;
            }
            .bazaar-settings-buttons {
                display: flex;
                justify-content: flex-end;
                gap: 12px;
                margin-top: 30px;
            }
            .bazaar-settings-save,
            .bazaar-settings-cancel {
                padding: 8px 16px;
                border: none;
                border-radius: 4px;
                font-size: 14px;
                cursor: pointer;
                font-weight: bold;
            }
            .bazaar-settings-save {
                background-color: #4CAF50;
                color: white;
            }
            .bazaar-settings-save:hover {
                background-color: #45a049;
            }
            .bazaar-settings-cancel {
                background-color: #f5f5f5;
                color: #333;
                border: 1px solid #ddd;
            }
            .dark-mode .bazaar-settings-cancel {
                background-color: #333;
                color: #e0e0e0;
                border: 1px solid #444;
            }
            .bazaar-settings-cancel:hover {
                background-color: #e9e9e9;
            }
            .dark-mode .bazaar-settings-cancel:hover {
                background-color: #444 !important;
                border-color: #555 !important;
            }
            .bazaar-settings-footer {
                margin-top: 20px;
                font-size: 12px;
                color: #777;
                text-align: center;
                padding-top: 15px;
                border-top: 1px solid #eee;
            }
            .dark-mode .bazaar-settings-footer {
                color: #999;
                border-top: 1px solid #444;
            }
            .bazaar-settings-footer a {
                color: #2196F3;
                text-decoration: none;
            }
            .bazaar-settings-footer a:hover {
                text-decoration: underline;
            }
            @media (max-width: 600px) {
                .bazaar-settings-modal {
                    padding: 16px;
                    width: 100%;
                    max-width: 100%;
                    border-radius: 0;
                    max-height: 100vh;
                }
                .bazaar-settings-title {
                    font-size: 18px;
                    margin-bottom: 16px;
                }
                .bazaar-tab {
                    padding: 8px 12px;
                    font-size: 14px;
                }
                .bazaar-settings-item label {
                    font-size: 13px;
                }
                .bazaar-settings-item input[type="text"],
                .bazaar-settings-item select,
                .bazaar-number-input {
                    padding: 6px 10px;
                    font-size: 13px;
                    max-width: 100%;
                }
                .bazaar-settings-item {
                    margin-bottom: 14px;
                }
                .bazaar-settings-save,
                .bazaar-settings-cancel {
                    padding: 6px 12px;
                    font-size: 13px;
                }
                .bazaar-api-note {
                    font-size: 11px;
                }
                .bazaar-settings-buttons {
                    margin-top: 20px;
                }
                .bazaar-settings-footer {
                    font-size: 11px;
                }
            }
        `;
        document.head.appendChild(style);

        class APIHandler {
            constructor() {
                this.MAX_RETRIES = 3;
                this.TIMEOUT_MS = 10000;
                this.RETRY_DELAY_MS = 2000;
                this.isPDA = false;
                this.initializePDA();
            }

            async initializePDA() {
                try {
                    if (window.flutter_inappwebview) {
                        const response = await window.flutter_inappwebview.callHandler('isTornPDA');
                        this.isPDA = response.isTornPDA;
                    }
                } catch (error) {
                    console.warn("Failed to check if running in Torn PDA:", error);
                }
            }

            getRfcVToken() {
                const cookieString = document.cookie;
                const cookieArray = cookieString.split('; ');

                for (const cookie of cookieArray) {
                    const [cookieName, cookieValue] = cookie.split('=');
                    if (cookieName === 'rfc_v') {
                        return cookieValue;
                    }
                }

                return null;
            }

            async makeRequest(options) {
                const { method, url, data, headers = {}, timeout = this.TIMEOUT_MS } = options;
                const defaultHeaders = {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                };
                const finalHeaders = { ...defaultHeaders, ...headers };
                const finalData = data ? (typeof data === 'string' ? data : JSON.stringify(data)) : undefined;

                const rfcVToken = this.getRfcVToken();
                if (rfcVToken) {
                    finalHeaders['Cookie'] = `rfc_v=${rfcVToken}`;
                }

                for (let attempt = 0; attempt <= this.MAX_RETRIES; attempt++) {
                    try {
                        let response;

                        if (this.isPDA) {
                            // Use PDA's native handlers
                            if (method === 'GET') {
                                response = await window.flutter_inappwebview.callHandler('PDA_httpGet', url, finalHeaders);
                            } else if (method === 'POST') {
                                response = await window.flutter_inappwebview.callHandler('PDA_httpPost', url, finalHeaders, finalData);
                            }
                        } else {
                            // Use GM.xmlHttpRequest
                            response = await new Promise((resolve, reject) => {
                                const timeoutId = setTimeout(() => reject(new Error('Request timed out')), timeout);

                                GM.xmlHttpRequest({
                                    method,
                                    url,
                                    data: finalData,
                                    headers: finalHeaders,
                                    timeout,
                                    onload: res => {
                                        clearTimeout(timeoutId);
                                        resolve(res);
                                    },
                                    onerror: error => {
                                        clearTimeout(timeoutId);
                                        reject(error);
                                    },
                                    ontimeout: () => {
                                        clearTimeout(timeoutId);
                                        reject(new Error('Request timed out'));
                                    }
                                });
                            });
                        }

                        if (response.status >= 200 && response.status < 300) {
                            return JSON.parse(response.responseText);
                        }
                        throw new Error(`Request failed with status ${response.status}`);
                    } catch (error) {
                        console.warn(`API request attempt ${attempt + 1} failed:`, error);
                        if (attempt === this.MAX_RETRIES) throw error;
                        await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY_MS));
                    }
                }
            }

            async get(url, headers = {}) {
                return this.makeRequest({ method: 'GET', url, headers });
            }

            async post(url, data, headers = {}) {
                return this.makeRequest({ method: 'POST', url, data, headers });
            }
        }

        const api = new APIHandler();

        async function fetchBazaarListings(itemId, callback) {
            try {
                const data = await api.get(`https://tornpal.com/api/v1/markets/clist/${itemId}?comment=wBazaarMarket`);
                const listings = data?.listings?.filter(l => l.source === "bazaar") || [];
                const processedListings = listings.map(listing => ({
                    ...listing,
                    displayPrice: listing.price.toLocaleString(),
                    relativeTime: getRelativeTime(listing.updated),
                    displayName: listing.player_name || `ID: ${listing.player_id}`
                }));

                callback(processedListings);
            } catch (error) {
                console.error(`Error fetching bazaar listings for item ${itemId}:`, error);
                callback(null);
            }
        }

        function getRelativeTime(ts) {
            const diffSec = Math.floor((Date.now() - ts * 1000) / 1000);
            const [unit, divisor] = diffSec < 60 ? ['s', 1] :
                                  diffSec < 3600 ? ['m', 60] :
                                  diffSec < 86400 ? ['h', 3600] :
                                  ['d', 86400];
            return `${Math.floor(diffSec / divisor)}${unit} ago`;
        }

        const svgTemplates = {
            rightArrow: `<svg viewBox="0 0 320 512"><path fill="currentColor" d="M310.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-192 192c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L242.7 256 73.4 86.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l192 192z"/></svg>`,
            leftArrow: `<svg viewBox="0 0 320 512"><path fill="currentColor" d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l192 192c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L77.3 256 246.6 86.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-192 192z"/></svg>`,
            warningIcon: `<path fill="currentColor" d="M256 32c14.2 0 27.3 7.5 34.5 19.8l216 368c7.3 12.4 7.3 27.7 .2 40.1S486.3 480 472 480H40c-14.3 0-27.6-7.7-34.7-20.1s-7-27.8 .2-40.1l216-368C228.7 39.5 241.8 32 256 32zm0 128c-13.3 0-24 10.7-24 24V296c0 13.3 10.7 24 24 24s24-10.7 24-24V184c0-13.3-10.7-24-24-24zm32 224a32 32 0 1 0 -64 0 32 32 0 1 0 64 0z"/>`,
            infoIcon: `<path fill="currentColor" d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM216 336h24V272H216c-13.3 0-24-10.7-24-24s10.7-24 24-24h48c13.3 0 24 10.7 24 24v88h8c13.3 0 24 10.7 24 24s-10.7 24-24 24zm40-208a32 32 0 1 1 0 64 32 32 0 1 1 0-64z"/>`
        };

        function createListingCard(listing, index) {
            const card = document.createElement('div');
            card.className = 'bazaar-listing-card';
            card.dataset.index = index;
            const listingKey = listing.player_id + '-' + listing.price + '-' + listing.quantity;
            card.dataset.listingKey = listingKey;
            card.dataset.quantity = listing.quantity;
            card.style.position = "absolute";
            card.style.left = (index * CARD_WIDTH) + "px";
            card.style.width = CARD_WIDTH + "px";

            let visitedColor = '#00aaff';
            try {
                const key = `visited_${listing.item_id}_${listing.player_id}`;
                const data = JSON.parse(StorageManager.get(key));
                if (data && data.lastClickedUpdated >= listing.updated) {
                    visitedColor = 'purple';
                }
            } catch (e) {}

            card.innerHTML = `
                <div>
                    <div style="display:flex; align-items:center; gap:5px; margin-bottom:6px; flex-wrap:wrap">
                        <a href="https://www.torn.com/bazaar.php?userId=${listing.player_id}&itemId=${listing.item_id}&highlight=1&price=${listing.price}#/"
                            data-visited-key="visited_${listing.item_id}_${listing.player_id}"
                            data-updated="${listing.updated}"
                            ${scriptSettings.linkBehavior === 'new_tab' ? 'target="_blank" rel="noopener noreferrer"' : ''}
                            style="font-weight:bold; color:${visitedColor}; text-decoration:underline;">
                            Player: ${listing.displayName}
                        </a>
                    </div>
                    <div>
                        <div style="margin-bottom:2px">
                            <strong>Price:</strong> <span style="word-break:break-all;">$${listing.displayPrice}</span>
                        </div>
                        <div style="display:flex; align-items:center">
                            <strong>Qty:</strong> <span style="margin-left:4px">${listing.quantity}</span>
                            <span style="margin-left:auto">${getPriceComparisonHtml(listing.price, listing.quantity)}</span>
                        </div>
                    </div>
                </div>
                <div style="margin-top:6px">
                    <div class="bazaar-listing-footnote">Updated: ${listing.relativeTime}</div>
                </div>
            `;

            const playerLink = card.querySelector('a');
            playerLink.addEventListener('click', (e) => {
                StorageManager.set(playerLink.dataset.visitedKey, JSON.stringify({ lastClickedUpdated: listing.updated }));
                playerLink.style.color = 'purple';
                const behavior = scriptSettings.linkBehavior || 'new_tab';
                if (behavior !== 'same_tab') {
                    e.preventDefault();
                    if (behavior === 'new_window') {
                        window.open(playerLink.href, '_blank', 'noopener,noreferrer,width=1200,height=800');
                    } else {
                        window.open(playerLink.href, '_blank', 'noopener,noreferrer');
                    }
                }
            });

            const priceComparison = card.querySelector('.bazaar-price-comparison');
            if (priceComparison) {
                const tooltip = document.createElement('div');
                tooltip.className = 'bazaar-profit-tooltip';
                tooltip.style.display = 'none';
                tooltip.style.opacity = '0';
                tooltip.innerHTML = priceComparison.getAttribute('data-tooltip');

                priceComparison.addEventListener('mouseenter', e => {
                    document.body.appendChild(tooltip);
                    tooltip.style.display = 'block';

                    tooltip.style.left = '0';
                    tooltip.style.top = '0';

                    const rect = e.target.getBoundingClientRect();
                    const tooltipRect = tooltip.getBoundingClientRect();

                    let left = rect.left;
                    let top = rect.bottom + 5;

                    if (left + tooltipRect.width > window.innerWidth) {
                        left = Math.max(5, window.innerWidth - tooltipRect.width - 5);
                    }

                    if (top + tooltipRect.height > window.innerHeight) {
                        top = Math.max(5, rect.top - tooltipRect.height - 5);
                    }

                    tooltip.style.left = left + 'px';
                    tooltip.style.top = top + 'px';

                    requestAnimationFrame(() => {
                        tooltip.style.opacity = '1';
                    });
                });

                priceComparison.addEventListener('mouseleave', () => {
                    tooltip.style.opacity = '0';
                    setTimeout(() => {
                        if (tooltip.parentNode) tooltip.parentNode.removeChild(tooltip);
                    }, 200);
                });
            }

            return card;
        }

        function getPriceComparisonHtml(listingPrice, quantity) {
            try {
                const stored = CacheManager.getStoredItems();
                const match = Object.values(stored).find(item =>
                    item.name && item.name.toLowerCase() === scriptSettings.currentItemName.toLowerCase());
                if (match?.market_value) {
                    const marketValue = Number(match.market_value);
                    const fee = scriptSettings.listingFee || 0;
                    const totalCost = listingPrice * quantity;
                    const potentialRevenue = marketValue * quantity;
                    const feeAmount = Math.ceil(potentialRevenue * (fee / 100));
                    const potentialProfit = potentialRevenue - totalCost - feeAmount;
                    const percentDiff = ((listingPrice / marketValue) - 1) * 100;

                    const absProfit = Math.abs(potentialProfit);
                    const abbrevValue = potentialProfit < 0 ? '-' : '';
                    const profitText = absProfit >= 1000000 ? '$' + (absProfit / 1000000).toFixed(1).replace(/\.0$/, '') + 'm' :
                                     absProfit >= 1000 ? '$' + (absProfit / 1000).toFixed(1).replace(/\.0$/, '') + 'k' :
                                     '$' + absProfit;

                    const color = potentialProfit > 0 ? 'var(--bazaar-profit-pos)' :
                                potentialProfit < 0 ? 'var(--bazaar-profit-neg)' :
                                'var(--bazaar-profit-neutral)';

                    const text = scriptSettings.displayMode === "percentage" ?
                        `(${potentialProfit > 0 ? '' : '+'}${percentDiff.toFixed(1)}%)` :
                        `(${abbrevValue}${profitText})`;

                    const tooltipContent = `
                        <div style="font-weight:bold; font-size:13px; margin-bottom:6px; text-align:center;">
                            ${potentialProfit >= 0 ? 'PROFIT' : 'LOSS'}: ${potentialProfit >= 0 ? '$' : '-$'}${Math.abs(potentialProfit).toLocaleString()}
                        </div>
                        <hr style="margin: 4px 0; border-color: var(--bazaar-tooltip-hr-color)">
                        <div>Total Cost: $${totalCost.toLocaleString()} (${quantity} item${quantity > 1 ? 's' : ''})</div>
                        ${fee > 0 ? `<div>Resale Fee: ${fee}% ($${feeAmount.toLocaleString()})</div>` : ''}
                        ${fee > 0 ? `<div style="margin-top:6px; font-weight:bold;">Min. Resell Price: $${Math.ceil(listingPrice / (1 - (fee / 100))).toLocaleString()}</div>` : ''}
                    `;

                    const span = document.createElement('span');
                    span.style.cssText = 'font-weight:bold; font-size:10px; padding:0 4px; border-radius:2px; color:' + color + '; cursor:help; white-space:nowrap;';
                    span.textContent = text;
                    span.className = 'bazaar-price-comparison';
                    span.setAttribute('data-tooltip', tooltipContent);
                    return span.outerHTML;
                }
            } catch (e) {
                console.error("Price comparison error:", e);
            }
            return '';
        }

        function renderVirtualCards(infoContainer) {
            const cardContainer = infoContainer.querySelector('.bazaar-card-container'),
                scrollWrapper = infoContainer.querySelector('.bazaar-scroll-wrapper');
            if (!cardContainer || !scrollWrapper || !infoContainer.isConnected) return;
            try {
                const minQtyInput = infoContainer.querySelector('.bazaar-min-qty');
                const minQty = minQtyInput && minQtyInput.value ? parseInt(minQtyInput.value, 10) : 0;
                if (!infoContainer.originalListings && scriptSettings.allListings && scriptSettings.allListings.length > 0) {
                    infoContainer.originalListings = [...scriptSettings.allListings];
                }
                if ((!scriptSettings.allListings || scriptSettings.allListings.length === 0) && infoContainer.originalListings) {
                    scriptSettings.allListings = [...infoContainer.originalListings];
                }
                const filteredListings = minQty > 0 ? scriptSettings.allListings.filter(listing => listing.quantity >= minQty) : scriptSettings.allListings;
                if (filteredListings.length === 0 && scriptSettings.allListings.length > 0) {
                    cardContainer.innerHTML = '';
                    const messageContainer = document.createElement('div');
                    messageContainer.style.cssText = 'display:flex; flex-direction:column; align-items:center; justify-content:center; padding:20px; text-align:center; width:100%; height:70px;';
                    const iconSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                    iconSvg.setAttribute("viewBox", "0 0 512 512");
                    iconSvg.setAttribute("width", "24");
                    iconSvg.setAttribute("height", "24");
                    iconSvg.style.marginBottom = "10px";
                    iconSvg.innerHTML = svgTemplates.infoIcon;
                    const textDiv = document.createElement('div');
                    textDiv.textContent = `No listings found with quantity ≥ ${minQty}. Try a lower value.`;
                    messageContainer.appendChild(iconSvg);
                    messageContainer.appendChild(textDiv);
                    cardContainer.appendChild(messageContainer);
                    const countElement = infoContainer.querySelector('.bazaar-listings-count');
                    if (countElement) {
                        countElement.textContent = `No listings match minimum quantity of ${minQty} (from ${scriptSettings.allListings.length} total listings)`;
                    }
                    return;
                }

                const totalWidth = filteredListings.length * CARD_WIDTH;
                if (cardContainer.style.width !== totalWidth + "px") {
                    cardContainer.style.width = totalWidth + "px";
                }

                const scrollLeft = scrollWrapper.scrollLeft;
                const containerWidth = scrollWrapper.clientWidth;

                const visibleCards = Math.ceil(containerWidth / CARD_WIDTH);
                const buffer = Math.max(5, Math.floor(visibleCards));

                let startIndex = Math.max(0, Math.floor(scrollLeft / CARD_WIDTH) - buffer);
                let endIndex = Math.min(filteredListings.length, Math.ceil((scrollLeft + containerWidth) / CARD_WIDTH) + buffer);

                const visibleCardMap = {};
                for (let i = startIndex; i < endIndex; i++) {
                    const listing = filteredListings[i];
                    const key = `${listing.player_id}-${listing.price}-${listing.quantity}`;
                    visibleCardMap[key] = i;
                }

                const cardsToRemove = [];

                const existingCards = cardContainer.querySelectorAll('.bazaar-listing-card');
                existingCards.forEach(card => {
                    const key = card.dataset.listingKey;
                    if (key in visibleCardMap) {
                        const newIndex = visibleCardMap[key];
                        const newLeft = newIndex * CARD_WIDTH;

                        if (parseFloat(card.style.left) !== newLeft) {
                            card.style.left = newLeft + "px";
                        }

                        delete visibleCardMap[key];
                    } else {
                        cardsToRemove.push(card);
                    }
                });

                cardsToRemove.forEach(card => {
                    card.classList.add('fade-out');
                    const removeCard = () => {
                        if (card.parentNode === cardContainer) {
                            cardContainer.removeChild(card);
                        }
                    };
                    card.addEventListener('transitionend', removeCard, { once: true });
                    setTimeout(removeCard, 500);
                });

                if (Object.keys(visibleCardMap).length > 0) {
                    const fragment = document.createDocumentFragment();
                    for (const key in visibleCardMap) {
                        const index = visibleCardMap[key];
                        const listing = filteredListings[index];
                        const newCard = createListingCard(listing, index);
                        newCard.classList.add('fade-in');
                        fragment.appendChild(newCard);
                    }

                    cardContainer.appendChild(fragment);

                    requestAnimationFrame(() => {
                        cardContainer.querySelectorAll('.fade-in').forEach(card => {
                            card.classList.remove('fade-in');
                        });
                    });
                }

                const totalQuantity = filteredListings.reduce((sum, listing) => sum + listing.quantity, 0);
                const countElement = infoContainer.querySelector('.bazaar-listings-count');
                if (countElement) {
                    if (minQty > 0 && filteredListings.length < scriptSettings.allListings.length) {
                        countElement.textContent = `Showing ${filteredListings.length} of ${scriptSettings.allListings.length} bazaars (${totalQuantity.toLocaleString()} items total, min qty: ${minQty})`;
                    } else {
                        countElement.textContent = `Showing bazaars ${startIndex + 1}-${endIndex} of ${filteredListings.length} (${totalQuantity.toLocaleString()} items total)`;
                    }
                }
            } catch (error) {
                console.error("Error rendering virtual cards:", error);
            }
        }

        function createInfoContainer(itemName, itemId) {
            const container = document.createElement('div');
            container.className = 'bazaar-info-container';
            container.dataset.itemid = itemId;
            scriptSettings.currentItemName = itemName;
            const header = document.createElement('div');
            header.className = 'bazaar-info-header';
            let marketValueText = "";
            try {
                const stored = CacheManager.getStoredItems();
                const match = Object.values(stored).find(item =>
                    item.name && item.name.toLowerCase() === itemName.toLowerCase());
                if (match && match.market_value) {
                    marketValueText = `Market Value: $${Number(match.market_value).toLocaleString()}`;
                }
            } catch (e) {
                console.error("Header market value error:", e);
            }
            header.textContent = `Bazaar Listings for ${itemName} (ID: ${itemId})`;
            if (marketValueText) {
                const span = document.createElement('span');
                span.style.marginLeft = '8px';
                span.style.fontSize = '14px';
                span.style.fontWeight = 'normal';
                span.className = 'bazaar-market-value';
                span.textContent = `• ${marketValueText}`;
                header.appendChild(span);
            }
            container.appendChild(header);
            scriptSettings.sortOrder = getSortOrderForKey(scriptSettings.sortKey);
            const sortControls = document.createElement('div');
            sortControls.className = 'bazaar-sort-controls';
            sortControls.innerHTML = `
                <span>Sort by:</span>
                <select class="bazaar-sort-select">
                    <option value="price" ${scriptSettings.sortKey === "price" ? "selected" : ""}>Price</option>
                    <option value="quantity" ${scriptSettings.sortKey === "quantity" ? "selected" : ""}>Quantity</option>
                    <option value="profit" ${scriptSettings.sortKey === "profit" ? "selected" : ""}>Profit</option>
                    <option value="updated" ${scriptSettings.sortKey === "updated" ? "selected" : ""}>Last Updated</option>
                </select>
                <button class="bazaar-button bazaar-order-toggle">
                    ${scriptSettings.sortOrder === "asc" ? "Asc" : "Desc"}
                </button>
                <button class="bazaar-button bazaar-display-toggle" title="Toggle between percentage difference and total profit">
                    ${scriptSettings.displayMode === "percentage" ? "%" : "$"}
                </button>
                <span style="margin-left: 8px;">Min Qty:</span>
                <input type="number" class="bazaar-min-qty" style="width: 60px; padding: 3px; border: 1px solid #ccc; border-radius: 4px;" min="0" placeholder="">
            `;
            container.appendChild(sortControls);
            const scrollContainer = document.createElement('div');
            scrollContainer.className = 'bazaar-scroll-container';
            function createScrollArrow(direction) {
                const arrow = document.createElement('div');
                arrow.className = `bazaar-scroll-arrow ${direction}`;
                arrow.innerHTML = svgTemplates[direction === 'left' ? 'leftArrow' : 'rightArrow'];
                let isScrolling = false,
                    scrollAnimationId = null,
                    startTime = 0,
                    isClickAction = false;
                const ACTION_THRESHOLD = 200;
                function smoothScroll() {
                    if (!isScrolling) return;
                    scrollWrapper.scrollLeft += (direction === 'left' ? -1.5 : 1.5);
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
                        scrollWrapper.scrollBy({ left: direction === 'left' ? -200 : 200, behavior: 'smooth' });
                    }
                    startTime = 0;
                }
                arrow.addEventListener('mousedown', startScrolling);
                arrow.addEventListener('mouseup', stopScrolling);
                arrow.addEventListener('mouseleave', stopScrolling);
                arrow.addEventListener('touchstart', startScrolling, { passive: false });
                arrow.addEventListener('touchend', stopScrolling);
                arrow.addEventListener('touchcancel', stopScrolling);
                return arrow;
            }
            scrollContainer.appendChild(createScrollArrow('left'));
            const scrollWrapper = document.createElement('div');
            scrollWrapper.className = 'bazaar-scroll-wrapper';
            const cardContainer = document.createElement('div');
            cardContainer.className = 'bazaar-card-container';
            scrollWrapper.appendChild(cardContainer);
            scrollContainer.appendChild(scrollWrapper);
            scrollContainer.appendChild(createScrollArrow('right'));
            scrollWrapper.addEventListener('scroll', () => {
                if (!scrollWrapper.isScrolling) {
                    scrollWrapper.isScrolling = true;
                    requestAnimationFrame(function checkScroll() {
                        renderVirtualCards(container);
                        if (scrollWrapper.lastKnownScrollLeft === scrollWrapper.scrollLeft) {
                            scrollWrapper.isScrolling = false;
                        } else {
                            scrollWrapper.lastKnownScrollLeft = scrollWrapper.scrollLeft;
                            requestAnimationFrame(checkScroll);
                        }
                    });
                }
            });
            container.appendChild(scrollContainer);
            const footerContainer = document.createElement('div');
            footerContainer.className = 'bazaar-footer-container';
            const listingsCount = document.createElement('div');
            listingsCount.className = 'bazaar-listings-count';
            listingsCount.textContent = 'Loading...';
            footerContainer.appendChild(listingsCount);
            const poweredBy = document.createElement('div');
            poweredBy.className = 'bazaar-powered-by';
            poweredBy.innerHTML = `
                <span>Powered by </span>
                <a href="https://tornpal.com/login?ref=1853324" target="_blank">TornPal</a>
            `;
            footerContainer.appendChild(poweredBy);
            container.appendChild(footerContainer);
            return container;
        }

        function sortListings(listings) {
            return listings.slice().sort((a, b) => {
                let diff;
                if (scriptSettings.sortKey === "profit") {
                    try {
                        const stored = CacheManager.getStoredItems();
                        const match = Object.values(stored).find(item =>
                            item.name && item.name.toLowerCase() === scriptSettings.currentItemName.toLowerCase());
                        if (match && match.market_value) {
                            const marketValue = Number(match.market_value),
                                fee = scriptSettings.listingFee || 0,
                                aProfit = (marketValue * a.quantity) - (a.price * a.quantity) - Math.ceil((marketValue * a.quantity) * (fee / 100)),
                                bProfit = (marketValue * b.quantity) - (b.price * b.quantity) - Math.ceil((marketValue * b.quantity) * (fee / 100));
                            diff = aProfit - bProfit;
                        } else {
                            diff = a.price - b.price;
                        }
                    } catch (e) {
                        console.error("Profit sort error:", e);
                        diff = a.price - b.price;
                    }
                } else {
                    diff = scriptSettings.sortKey === "price" ? a.price - b.price :
                        scriptSettings.sortKey === "quantity" ? a.quantity - b.quantity :
                        a.updated - b.updated;
                }
                return scriptSettings.sortOrder === "asc" ? diff : -diff;
            });
        }

        function updateInfoContainer(wrapper, itemId, itemName) {
            // Remove the data-has-bazaar-info attribute to allow updates
            wrapper.removeAttribute('data-has-bazaar-info');

            // Clear any existing listings
            scriptSettings.allListings = [];

            let infoContainer = document.querySelector(`.bazaar-info-container[data-itemid="${itemId}"]`);
            if (!infoContainer) {
                infoContainer = createInfoContainer(itemName, itemId);
                wrapper.insertBefore(infoContainer, wrapper.firstChild);
            } else if (!wrapper.contains(infoContainer)) {
                infoContainer = createInfoContainer(itemName, itemId);
                wrapper.insertBefore(infoContainer, wrapper.firstChild);
            } else {
                const header = infoContainer.querySelector('.bazaar-info-header');
                if (header) {
                    header.textContent = `Bazaar Listings for ${itemName} (ID: ${itemId})`;
                }
            }

            // Watch wrapper height
            if (wrapper.style.height) {
                watchWrapperHeight(wrapper, infoContainer);
            }

            // Set the item ID on the container
            infoContainer.dataset.itemid = itemId;

            // Mark that we've added the info container
            wrapper.setAttribute('data-has-bazaar-info', 'true');

            const cardContainer = infoContainer.querySelector('.bazaar-card-container');
            const countElement = infoContainer.querySelector('.bazaar-listings-count');
            const updateListingsCount = (text) => {
                if (countElement) {
                    countElement.textContent = text;
                }
            };
            const showEmptyState = (isError) => {
                if (cardContainer) {
                    cardContainer.innerHTML = '';
                    cardContainer.style.width = '';
                    const messageContainer = document.createElement('div');
                    messageContainer.style.cssText = 'display:flex; flex-direction:column; align-items:center; justify-content:center; padding:20px; text-align:center; width:100%; height:70px;';
                    const iconSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                    iconSvg.setAttribute("viewBox", "0 0 512 512");
                    iconSvg.setAttribute("width", "24");
                    iconSvg.setAttribute("height", "24");
                    iconSvg.style.marginBottom = "10px";
                    const textDiv = document.createElement('div');
                    if (isError) {
                        iconSvg.innerHTML = svgTemplates.warningIcon;
                        textDiv.textContent = "Unable to load bazaar listings. Please try again later.";
                        textDiv.className = 'bazaar-error-message';
                        textDiv.style.fontWeight = 'bold';
                    } else {
                        iconSvg.innerHTML = svgTemplates.infoIcon;
                        textDiv.textContent = "No bazaar listings available for this item.";
                    }
                    messageContainer.appendChild(iconSvg);
                    messageContainer.appendChild(textDiv);
                    cardContainer.appendChild(messageContainer);
                }
                updateListingsCount(isError ? 'API Error - Check back later' : 'No listings available');
            };
            if (cardContainer) {
                cardContainer.innerHTML = '<div style="padding:10px; text-align:center; width:100%;">Loading bazaar listings...</div>';
            }
            const cachedData = CacheManager.getCache(itemId);
            if (cachedData) {
                scriptSettings.allListings = sortListings(cachedData.listings);
                if (scriptSettings.allListings.length === 0) {
                    showEmptyState(false);
                } else {
                    renderVirtualCards(infoContainer);
                }
                return;
            }
            let listings = [], responses = 0, apiErrors = false;
            let requestTimeout = setTimeout(() => {
                console.warn('Bazaar listings request timed out');
                if (responses < 1) {
                    showEmptyState(true);
                    responses = 1;
                }
            }, 15000);
            function processResponse(newListings, error) {
                if (error) {
                    apiErrors = true;
                }
                if (Array.isArray(newListings)) {
                    listings = newListings;
                }
                responses++;
                if (responses === 1) {
                    clearTimeout(requestTimeout);

                    // Cache the processed listings
                    CacheManager.setCache(itemId, { listings });

                    if (listings.length === 0) {
                        showEmptyState(apiErrors);
                    } else {
                        // Sort listings and update UI in a single operation
                        scriptSettings.allListings = sortListings(listings);

                        // Use requestAnimationFrame for smoother rendering
                        requestAnimationFrame(() => {
                            renderVirtualCards(infoContainer);
                        });
                    }
                }
            }
            fetchBazaarListings(itemId, data => {
                processResponse(data, data === null);
            });
        }

        function watchWrapperHeight(wrapper, infoContainer) {
            new MutationObserver(() => updateHeight()).observe(wrapper, { attributes: true, attributeFilter: ["style"] });
            updateHeight();

            function updateHeight() {
                if (!wrapper.style.height.startsWith("calc")) {
                    wrapper.style.setProperty("--original-height", wrapper.style.height);
                }

                wrapper.style.height = `calc(var(--original-height) + ${infoContainer.scrollHeight}px)`;
            }
        }

        if (window.location.href.includes("bazaar.php")) {
            function scrollToTargetItem() {
                const params = new URLSearchParams(window.location.search);
                const targetItemId = params.get("itemId"), highlight = params.get("highlight"), priceParam = params.get("price");
                if (!targetItemId || highlight !== "1") return;
                function removeHighlightParam() {
                    params.delete("highlight");
                    history.replaceState({}, "", window.location.pathname + "?" + params.toString() + window.location.hash);
                }
                function showToast(message) {
                    const toast = document.createElement('div');
                    toast.textContent = message;
                    toast.style.cssText = 'position:fixed; bottom:20px; left:50%; transform:translateX(-50%); background-color:rgba(0,0,0,0.7); color:white; padding:10px 20px; border-radius:5px; z-index:100000; font-size:14px;';
                    document.body.appendChild(toast);
                    setTimeout(() => {
                        toast.remove();
                    }, 3000);
                }
                function findItemCard() {
                    const img = document.querySelector(`img[src*="/images/items/${targetItemId}/"]`);
                    if (!img) return null;

                    const card = img.closest('.item___GYCYJ');
                    if (!card) return null;

                    if (priceParam) {
                        const priceElement = card.querySelector('[class*=price_]');
                        if (priceElement) {
                            const priceText = priceElement.textContent.trim();
                            const cleanPrice = priceText.replace(/[$,]/g, '');
                            const urlPrice = parseInt(priceParam);
                            const currentPrice = parseInt(cleanPrice);

                            if (currentPrice !== urlPrice) {
                                const diff = currentPrice - urlPrice;
                                const direction = diff > 0 ? 'above' : 'below';
                                alert(`WARNING: Price is $${Math.abs(diff).toLocaleString()} ${direction} the API pricing!`);
                            }
                        }
                    }

                    return card;
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
                        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight) {
                            showToast("Item not found on this page.");
                            removeHighlightParam();
                            clearInterval(scrollInterval);
                        } else {
                            window.scrollBy({ top: 300, behavior: 'auto' });
                        }
                    }
                }, 50);
            }
            function waitForItems() {
                const container = document.querySelector('.ReactVirtualized__Grid__innerScrollContainer');
                if (container && container.childElementCount > 0) {
                    scrollToTargetItem();
                } else {
                    setTimeout(waitForItems, 500);
                }
            }
            waitForItems();
        }

        const eventHandlers = {
            handleClick: (event) => {
                const container = event.target.closest('.bazaar-info-container');
                if (container) {
                    if (event.target.matches('.bazaar-order-toggle')) {
                        scriptSettings.sortOrder = scriptSettings.sortOrder === "asc" ? "desc" : "asc";
                        event.target.textContent = scriptSettings.sortOrder === "asc" ? "Asc" : "Desc";
                        performSort(container);
                        return;
                    }

                    if (event.target.matches('.bazaar-display-toggle')) {
                        scriptSettings.displayMode = scriptSettings.displayMode === "percentage" ? "profit" : "percentage";
                        event.target.textContent = scriptSettings.displayMode === "percentage" ? "%" : "$";
                        SettingsManager.save().catch(e => console.error("Error saving settings:", e));

                        document.querySelectorAll('.bazaar-info-container').forEach(container => {
                            renderVirtualCards(container);
                            const cardContainer = container.querySelector('.bazaar-card-container');
                            if (cardContainer) {
                                const scrollWrapper = container.querySelector('.bazaar-scroll-wrapper');
                                const currentScroll = scrollWrapper ? scrollWrapper.scrollLeft : 0;

                                const itemId = container.dataset.itemid;
                                if (itemId && scriptSettings.allListings && scriptSettings.allListings.length > 0) {
                                    cardContainer.innerHTML = '';
                                    renderVirtualCards(container);

                                    if (scrollWrapper) {
                                        scrollWrapper.scrollLeft = currentScroll;
                                    }
                                }
                            }
                        });
                        return;
                    }
                }

                if (event.target.id === 'refresh-market-data' || event.target.closest('#refresh-market-data')) {
                    event.preventDefault();
                    const apiKeyInput = document.getElementById('bazaar-api-key');
                    const refreshStatus = document.getElementById('refresh-status');

                    if (!apiKeyInput || !apiKeyInput.value.trim()) {
                        if (refreshStatus) {
                            refreshStatus.style.display = 'block';
                            refreshStatus.textContent = 'Please enter an API key first.';
                            refreshStatus.style.color = '#cc0000';
                            setTimeout(() => {
                                refreshStatus.style.display = 'none';
                            }, 3000);
                        }
                        return;
                    }

                    scriptSettings.apiKey = apiKeyInput.value.trim();
                    fetchTornItems(true);
                }
            },

            handleInput: (event) => {
                const container = event.target.closest('.bazaar-info-container');
                if (!container) return;

                if (event.target.matches('.bazaar-min-qty')) {
                    clearTimeout(event.target.debounceTimer);
                    event.target.debounceTimer = setTimeout(() => {
                        const scrollWrapper = container.querySelector('.bazaar-scroll-wrapper');
                        if (scrollWrapper) {
                            scrollWrapper.scrollLeft = 0;
                        }
                        container.lastRenderScrollLeft = undefined;
                        if (!scriptSettings.allListings || scriptSettings.allListings.length === 0) {
                            const itemId = container.getAttribute('data-itemid');
                            if (itemId) {
                                const cachedData = CacheManager.getCache(itemId);
                                if (cachedData && cachedData.listings && cachedData.listings.length > 0) {
                                    scriptSettings.allListings = sortListings(cachedData.listings);
                                }
                            }
                        }
                        renderVirtualCards(container);
                    }, 300);
                }
            },

            handleChange: (event) => {
                const container = event.target.closest('.bazaar-info-container');
                if (!container) return;

                if (event.target.matches('.bazaar-sort-select')) {
                    const newSortKey = event.target.value;
                    if (newSortKey !== scriptSettings.sortKey) {
                        scriptSettings.sortKey = newSortKey;
                        scriptSettings.sortOrder = getSortOrderForKey(scriptSettings.sortKey);
                        const orderToggle = container.querySelector('.bazaar-order-toggle');
                        if (orderToggle) {
                            orderToggle.textContent = scriptSettings.sortOrder === "asc" ? "Asc" : "Desc";
                        }
                    } else {
                        scriptSettings.sortKey = newSortKey;
                    }
                    performSort(container);
                }
            }
        };

        document.body.addEventListener('click', eventHandlers.handleClick);
        document.body.addEventListener('input', eventHandlers.handleInput);
        document.body.addEventListener('change', eventHandlers.handleChange);

        function performSort(container) {
            scriptSettings.allListings = sortListings(scriptSettings.allListings);
            const cardContainer = container.querySelector('.bazaar-card-container');
            const scrollWrapper = container.querySelector('.bazaar-scroll-wrapper');
            if (cardContainer && scrollWrapper) {
                scrollWrapper.scrollLeft = 0;
                container.lastRenderScrollLeft = undefined;
                renderVirtualCards(container);
            }
        }

        function addSettingsMenuItem() {
            const menu = document.querySelector('.settings-menu');
            if (!menu || document.querySelector('.bazaar-settings-button')) return;

            const li = document.createElement('li');
            li.className = 'link bazaar-settings-button';
            const a = document.createElement('a');
            a.href = '#';
            const iconDiv = document.createElement('div');
            iconDiv.className = 'icon-wrapper';
            const svgIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svgIcon.setAttribute('class', 'default');
            svgIcon.setAttribute('fill', '#fff');
            svgIcon.setAttribute('stroke', 'transparent');
            svgIcon.setAttribute('stroke-width', '0');
            svgIcon.setAttribute('width', '16');
            svgIcon.setAttribute('height', '16');
            svgIcon.setAttribute('viewBox', '0 0 640 512');
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', 'M36.8 192l566.3 0c20.3 0 36.8-16.5 36.8-36.8c0-7.3-2.2-14.4-6.2-20.4L558.2 21.4C549.3 8 534.4 0 518.3 0L121.7 0c-16 0-31 8-39.9 21.4L6.2 134.7c-4 6.1-6.2 13.2-6.2 20.4C0 175.5 16.5 192 36.8 192zM64 224l0 160 0 80c0 26.5 21.5 48 48 48l224 0c26.5 0 48-21.5 48-48l0-80 0-160-64 0 0 160-192 0 0-160-64 0zm448 0l0 256c0 17.7 14.3 32 32 32s32-14.3 32-32l0-256-64 0z');
            const span = document.createElement('span');
            span.textContent = 'Bazaar Settings';
            svgIcon.appendChild(path);
            iconDiv.appendChild(svgIcon);
            a.appendChild(iconDiv);
            a.appendChild(span);
            li.appendChild(a);
            a.addEventListener('click', e => {
                e.preventDefault();
                document.body.click();
                openSettingsModal();
            });
            const logoutButton = menu.querySelector('li.logout');
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
                                <input type="text" id="bazaar-api-key" value="${scriptSettings.apiKey || ''}" placeholder="Enter your API key here" style="flex-grow: 1; max-width: none;">
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
                                <option value="price" ${scriptSettings.sortKey === 'price' ? 'selected' : ''}>Price</option>
                                <option value="quantity" ${scriptSettings.sortKey === 'quantity' ? 'selected' : ''}>Quantity</option>
                                <option value="profit" ${scriptSettings.sortKey === 'profit' ? 'selected' : ''}>Profit</option>
                                <option value="updated" ${scriptSettings.sortKey === 'updated' ? 'selected' : ''}>Last Updated</option>
                            </select>
                            <div class="bazaar-api-note">
                                Choose how listings are sorted: Price, Quantity, Profit, or Last Updated.
                            </div>
                        </div>
                        <div class="bazaar-settings-item">
                            <label for="bazaar-default-order">Default Order</label>
                            <select id="bazaar-default-order">
                                <option value="asc" ${scriptSettings.sortOrder === 'asc' ? 'selected' : ''}>Ascending</option>
                                <option value="desc" ${scriptSettings.sortOrder === 'desc' ? 'selected' : ''}>Descending</option>
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
                                <option value="percentage" ${scriptSettings.displayMode === 'percentage' ? 'selected' : ''}>Percentage Difference</option>
                                <option value="profit" ${scriptSettings.displayMode === 'profit' ? 'selected' : ''}>Potential Profit</option>
                            </select>
                            <div class="bazaar-api-note">
                                Choose whether to display price comparisons as a percentage or in dollars.
                            </div>
                        </div>
                        <div class="bazaar-settings-item">
                            <label for="bazaar-link-behavior">Bazaar Link Click Behavior</label>
                            <select id="bazaar-link-behavior">
                                <option value="new_tab" ${scriptSettings.linkBehavior === 'new_tab' ? 'selected' : ''}>Open in New Tab</option>
                                <option value="new_window" ${scriptSettings.linkBehavior === 'new_window' ? 'selected' : ''}>Open in New Window</option>
                                <option value="same_tab" ${scriptSettings.linkBehavior === 'same_tab' ? 'selected' : ''}>Open in Same Tab</option>
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
                    <p>This script uses data from <a href="https://tornpal.com" target="_blank">TornPal</a>.</p>
                    <p>Created by <a href="https://www.torn.com/profiles.php?XID=1853324" target="_blank">Weav3r [1853324]</a></p>
                </div>
            `;
            overlay.appendChild(modal);
            const tabs = modal.querySelectorAll('.bazaar-tab');
            tabs.forEach(tab => {
                tab.addEventListener('click', function () {
                    tabs.forEach(t => t.classList.remove('active'));
                    this.classList.add('active');
                    modal.querySelectorAll('.bazaar-tab-content').forEach(content => content.classList.remove('active'));
                    document.getElementById(`tab-${this.getAttribute('data-tab')}`).classList.add('active');
                });
            });
            modal.querySelector('.bazaar-settings-save').addEventListener('click', async () => {
                const oldLinkBehavior = scriptSettings.linkBehavior;

                scriptSettings.apiKey = modal.querySelector('#bazaar-api-key').value.trim();
                scriptSettings.sortKey = modal.querySelector('#bazaar-default-sort').value;
                scriptSettings.sortOrder = modal.querySelector('#bazaar-default-order').value;
                scriptSettings.listingFee = Math.round(parseFloat(modal.querySelector('#bazaar-listing-fee').value) || 0);
                scriptSettings.displayMode = modal.querySelector('#bazaar-default-display').value;
                scriptSettings.linkBehavior = modal.querySelector('#bazaar-link-behavior').value;

                if (scriptSettings.listingFee < 0) scriptSettings.listingFee = 0;
                if (scriptSettings.listingFee > 100) scriptSettings.listingFee = 100;

                await SettingsManager.save();

                document.querySelectorAll('.bazaar-info-container').forEach(container => {
                    const sortSelect = container.querySelector('.bazaar-sort-select');
                    if (sortSelect) sortSelect.value = scriptSettings.sortKey;
                    const orderToggle = container.querySelector('.bazaar-order-toggle');
                    if (orderToggle) orderToggle.textContent = scriptSettings.sortOrder === "asc" ? "Asc" : "Desc";
                    const displayToggle = container.querySelector('.bazaar-display-toggle');
                    if (displayToggle) displayToggle.textContent = scriptSettings.displayMode === "percentage" ? "%" : "$";
                    if (oldLinkBehavior !== scriptSettings.linkBehavior) {
                        const cardContainer = container.querySelector('.bazaar-card-container');
                        if (cardContainer) {
                            cardContainer.innerHTML = '';
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

                overlay.remove();
            });
            modal.querySelector('.bazaar-settings-cancel').addEventListener('click', () => {
                overlay.remove();
            });
            overlay.addEventListener('click', e => {
                if (e.target === overlay) overlay.remove();
            });
            document.body.appendChild(overlay);
        }

        async function fetchTornItems(forceRefresh = false) {
            const stored = StorageManager.getSync("tornItems"),
                lastUpdated = StorageManager.getSync("lastTornItemsUpdate", "0"),
                now = Date.now(),
                oneDayMs = 24 * 60 * 60 * 1000,
                lastUTC = new Date(parseInt(lastUpdated)).toISOString().split('T')[0],
                todayUTC = new Date().toISOString().split('T')[0],
                lastHour = Math.floor(parseInt(lastUpdated) / (60 * 60 * 1000)),
                currentHour = Math.floor(now / (60 * 60 * 1000));

            const needsRefresh = forceRefresh ||
                                lastUTC < todayUTC ||
                                (now - lastUpdated) >= oneDayMs ||
                                (lastHour < currentHour && (currentHour - lastHour) >= 1);

            if (scriptSettings.apiKey && (!stored || needsRefresh)) {
                const refreshStatus = document.getElementById('refresh-status');
                if (refreshStatus) {
                    refreshStatus.style.display = 'block';
                    refreshStatus.textContent = 'Fetching market values...';
                    refreshStatus.style.color = 'var(--bazaar-muted-text)';
                }

                try {
                    const data = await api.get(`https://api.torn.com/torn/?key=${scriptSettings.apiKey}&selections=items&comment=wBazaars`);

                    if (!data.items) {
                        throw new Error(data.error ? data.error.error : 'Failed to fetch market values');
                    }

                    CacheManager.clearItemsCache();

                    const filtered = {};
                    for (let [id, item] of Object.entries(data.items)) {
                        if (item.tradeable) {
                            filtered[id] = { name: item.name, market_value: item.market_value };
                        }
                    }

                    await StorageManager.set("tornItems", JSON.stringify(filtered));
                    await StorageManager.set("lastTornItemsUpdate", now.toString());

                    if (refreshStatus) {
                        refreshStatus.textContent = `Market values updated successfully! (${todayUTC})`;
                        refreshStatus.style.color = '#009900';
                        setTimeout(() => {
                            refreshStatus.style.display = 'none';
                        }, 3000);
                    }

                    document.querySelectorAll('.bazaar-info-container').forEach(container => {
                        if (container.isConnected) {
                            const cardContainer = container.querySelector('.bazaar-card-container');
                            if (cardContainer) {
                                cardContainer.innerHTML = '';
                                container.lastRenderScrollLeft = undefined;
                                renderVirtualCards(container);
                            }
                        }
                    });

                    return true;
                } catch (error) {
                    console.error("Error fetching Torn items:", error);
                    if (refreshStatus) {
                        refreshStatus.textContent = `Error: ${error.message || 'Failed to fetch market values'}`;
                        refreshStatus.style.color = '#cc0000';
                        setTimeout(() => {
                            refreshStatus.style.display = 'none';
                        }, 5000);
                    }
                    return false;
                }
            }
            return false;
        }

        addSettingsMenuItem();

        function getSortOrderForKey(key) {
            return key === "price" ? "asc" : "desc";
        }

        (async function initializeSettings() {
            await SettingsManager.load();
            addSettingsMenuItem();
            fetchTornItems();
        })();
    })();
