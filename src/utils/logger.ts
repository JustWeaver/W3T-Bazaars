/**
 * Defines the available logging levels in ascending order of severity
 */
export enum LogLevel {
	/** For detailed troubleshooting information */
	DEBUG = 0,
	/** For general information about application flow */
	INFO = 1,
	/** For potentially harmful situations */
	WARN = 2,
	/** For errors that might still allow the application to continue */
	ERROR = 3,
	/** Disables all logging */
	NONE = 4,
}

/**
 * Logger class providing various logging methods with level filtering and formatting
 */
export class Logger {
	/** Prefix string to prepend to all log messages */
	private prefix: string;

	/** Current log level threshold */
	private level: LogLevel;

	/** Color scheme for different log types */
	private colors = {
		debug: "#7f8c8d", // gray
		info: "#3498db", // blue
		warn: "#f39c12", // orange
		error: "#e74c3c", // red
	};

	/**
	 * Creates a new Logger instance
	 * @param prefix - Optional prefix to identify the source of log messages
	 * @param level - Minimum log level to display, defaults to INFO
	 */
	constructor(prefix = "", level: LogLevel = LogLevel.INFO) {
		this.prefix = prefix;
		this.level = level;
	}

	/**
	 * Changes the current logging level
	 * @param level - New log level to set
	 */
	public setLevel(level: LogLevel): void {
		this.level = level;
	}

	/**
	 * Logs a debug message
	 * Only displays if the current log level is DEBUG or lower
	 * @param args - Arguments to log
	 */
	public debug(...args: unknown[]): void {
		if (this.level <= LogLevel.DEBUG) {
			console.debug(
				`%c${this.formatPrefix("DEBUG")}`,
				`color: ${this.colors.debug}; font-weight: bold`,
				...args,
			);
		}
	}

	/**
	 * Logs an informational message
	 * Only displays if the current log level is INFO or lower
	 * @param args - Arguments to log
	 */
	public info(...args: unknown[]): void {
		if (this.level <= LogLevel.INFO) {
			console.info(
				`%c${this.formatPrefix("INFO")}`,
				`color: ${this.colors.info}; font-weight: bold`,
				...args,
			);
		}
	}

	/**
	 * Logs a warning message
	 * Only displays if the current log level is WARN or lower
	 * @param args - Arguments to log
	 */
	public warn(...args: unknown[]): void {
		if (this.level <= LogLevel.WARN) {
			console.warn(
				`%c${this.formatPrefix("WARN")}`,
				`color: ${this.colors.warn}; font-weight: bold`,
				...args,
			);
		}
	}

	/**
	 * Logs an error message
	 * Only displays if the current log level is ERROR or lower
	 * @param args - Arguments to log
	 */
	public error(...args: unknown[]): void {
		if (this.level <= LogLevel.ERROR) {
			console.error(
				`%c${this.formatPrefix("ERROR")}`,
				`color: ${this.colors.error}; font-weight: bold`,
				...args,
			);
		}
	}

	/**
	 * Creates a collapsible group in the console for related log messages
	 * @param label - Label for the group
	 * @param collapsed - Whether the group should be initially collapsed
	 */
	public group(label: string, collapsed = false): void {
		if (this.level < LogLevel.NONE) {
			if (collapsed) {
				console.groupCollapsed(this.formatPrefix(""), label);
			} else {
				console.group(this.formatPrefix(""), label);
			}
		}
	}

	/**
	 * Ends the current log group
	 */
	public groupEnd(): void {
		if (this.level < LogLevel.NONE) {
			console.groupEnd();
		}
	}

	/**
	 * Creates a child logger with a sub-prefix
	 * @param subPrefix - Additional prefix for the child logger
	 * @returns A new logger instance with combined prefix and the same log level
	 */
	public child(subPrefix: string): Logger {
		const childPrefix = this.prefix ? `${this.prefix}:${subPrefix}` : subPrefix;

		return new Logger(childPrefix, this.level);
	}

	/**
	 * Formats the prefix for log messages
	 * @param level - Log level name to include in prefix
	 * @returns Formatted prefix string
	 * @private
	 */
	private formatPrefix(level: string): string {
		// const timestamp = new Date().toISOString();
		// return level
		// 	? `[${timestamp}]${prefix}[${level}]`
		// 	: `[${timestamp}]${prefix}`;

		const prefix = this.prefix ? `[${this.prefix}]` : "";

		return level ? `[${prefix}] - [${level}]: ` : `[${prefix}]: `;
	}
}

export default new Logger("W3T");
