import logger from "./logger";

/**
 * Enum representing time units in milliseconds
 * Used for configuring expiration times in storage
 */
export enum Time {
	/** 1 second in milliseconds */
	Seconds = 1_000,
	/** 1 minute in milliseconds */
	Minutes = Seconds * 60,
	/** 1 hour in milliseconds */
	Hours = Minutes * 60,
	/** 1 day in milliseconds */
	Days = Hours * 24,
	/** 1 week in milliseconds */
	Weeks = Days * 7,
	/** 1 year in milliseconds (365 days) */
	Years = Days * 365,
}

/**
 * Storage class for managing localStorage with prefixed keys and expiration support
 */
export class Storage {
	/** Prefix added to all storage keys */
	private prefix;

	/**
	 * Creates a new Storage instance
	 * @param prefix - String prefix to prepend to all storage keys
	 */
	constructor(prefix: string) {
		this.prefix = prefix;
	}

	/**
	 * Stores a value in localStorage with optional expiration
	 * @param key - The storage key
	 * @param value - The value to store
	 * @param expireConfig - Optional configuration for value expiration
	 * @param expireConfig.amount - Number of time units until expiration
	 * @param expireConfig.unit - Time unit to use for expiration
	 */
	public set<T>(
		key: string,
		value: T,
		expireConfig?: {
			amount: number;
			unit: keyof typeof Time;
		},
	): void {
		try {
			const item = {
				value,
				expiration: expireConfig
					? Date.now() +
						expireConfig.amount * (Time[expireConfig.unit] || Time.Minutes)
					: null,
			};
			localStorage.setItem(this.prefix + key, JSON.stringify(item));
		} catch (error) {
			logger.error(`Error storing item '${key}':`, error);
		}
	}

	/**
	 * Retrieves a value from localStorage
	 * Handles expiration checking and removal of expired items
	 * @param key - The storage key
	 * @returns The stored value, or null if not found or expired
	 */
	public get<T>(key: string): T | null {
		try {
			const itemStr = localStorage.getItem(this.prefix + key);
			if (!itemStr) {
				logger.debug(`Key '${key}' couldn't be found.`);

				return null;
			}

			const item = JSON.parse(itemStr).catch(null);

			if (!item) {
				logger.warn(`Key '${key}' has invalid JSON in it.`);

				this.remove(key);

				return null;
			}

			if (item.expiration && Date.now() > item.expiration) {
				this.remove(key);

				logger.debug(`Key ${key} has expired.`);

				return null;
			}

			return item.value as T;
		} catch (error) {
			logger.error(`Error retrieving item '${key}':`, error);
			return null;
		}
	}

	/**
	 * Removes a value from localStorage
	 * @param key - The storage key to remove
	 */
	public remove(key: string): void {
		try {
			localStorage.removeItem(this.prefix + key);
		} catch (error) {
			logger.error(`Error removing item [${key}]:`, error);
		}
	}

	/**
	 * Checks if a key exists in localStorage and is not expired
	 * @param key - The storage key to check
	 * @returns True if the key exists and is not expired, false otherwise
	 */
	public has(key: string): boolean {
		return this.get(key) !== null;
	}

	/**
	 * Clears all items with the current prefix from localStorage
	 */
	public clearAll(): void {
		try {
			// biome-ignore lint/complexity/noForEach: Local Storage is weird :p
			Object.keys(localStorage)
				.filter((key) => key.startsWith(this.prefix))
				.forEach((key) => localStorage.removeItem(key));
		} catch (error) {
			logger.error("Error clearing storage:", error);
		}
	}
}

export default new Storage("mavri.");
