import { fakerEN_IN as faker } from "@faker-js/faker";

/**
 * Generates an Indian name.
 */
export function generateName(): string {
    return faker.person.fullName();
}

/**
 * Generates an Indian state.
 */
export function generateState(): string {
    return faker.location.state();
}

/**
 * Generates a city in India (fakerEN_IN provides Indian cities).
 */
export function generateCity(): string {
    return faker.location.city();
}

/**
 * Generates an Indian-themed company name.
 */
export function generateCompany(): string {
    return faker.company.name();
}

/**
 * Generates a mobile number conforming to Indian conventions (10-digit starting with 6/7/8/9).
 */
export function generateIndianMobile(): string {
    const prefix = faker.helpers.arrayElement(["6", "7", "8", "9"]);
    const rest = faker.string.numeric(9);
    return `${prefix}${rest}`;
}

/**
 * Generates a realistic email corresponding to a name.
 */
export function generateEmailForName(name: string, domain?: string): string {
    const cleanName = name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, ".")
        .replace(/\.+/g, ".");
    const chosenDomain = domain || faker.helpers.arrayElement(["gmail.com", "yahoo.com", "outlook.com", "hotmail.com"]);
    return `${cleanName}@${chosenDomain}`;
}

/**
 * Shuffles arrays to randomize column ordering.
 */
export function shuffleArray<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j]!, arr[i]!];
    }
    return arr;
}
