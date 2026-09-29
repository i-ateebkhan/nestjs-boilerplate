import { Injectable } from '@nestjs/common';
import { v7 as uuidv7 } from 'uuid';

@Injectable()
export class CommonService {
	/**
	 * a method to handle promise safely
	 * @param pms Promise you want to resolve safely
	 * @returns a tuple with first value to be error if promise fails else null, second value to be resolved promise or null
	 */
	public async promise<T>(pms: Promise<T>): Promise<readonly [Error | null, T | null]> {
		try {
			return [null, await pms] as const;
		} catch (error) {
			return [error as Error, null] as const;
		}
	}

	/**
	 * Checks if an object is empty (has no own properties)
	 * @param obj The object to check
	 * @returns true if the object is empty, false otherwise
	 */
	public isEmptyObject(obj: Record<string | number | symbol, unknown>): boolean {
		return Object.keys(obj).length === 0;
	}

	/**
	 * helper method to remove keys from an object
	 * @param obj An object from which you need keys removed
	 * @param keys keys you want to remove from object
	 * @returns new object with keys removed
	 */
	public omit<T, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
		const result = { ...obj };
		keys.forEach((key) => {
			delete result[key];
		});
		return result;
	}

	/**
	 * Generates UUID v7
	 * @returns a string of uuid v7
	 */
	public get uuid(): string {
		return uuidv7();
	}

	/**
	 * method to halt system for ms
	 * @param ms time to sleep in seconds
	 * @returns promise resolve after ms
	 */
	public sleep(ms = 1000): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
}
