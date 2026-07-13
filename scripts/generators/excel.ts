import { fakerEN_IN as faker } from "@faker-js/faker";
import {
    generateName,
    generateEmailForName,
    generateIndianMobile,
} from "../utils/faker-helpers";

export function generateManualExcelLeads(count: number): {
    headers: string[];
    rows: Record<string, unknown>[];
} {
    const headers = [
        "   Full Name   ",
        "   Email Address ",
        " Contact Number  ",
        "  Notes  ",
        " Date Added ",
    ];
    const rows: Record<string, unknown>[] = [];

    for (let i = 0; i < count; i++) {
        const name = generateName();
        const randomName = faker.helpers.arrayElement([
            name,
            name.toLowerCase(),
            name.toUpperCase(),
        ]);

        rows.push({
            "   Full Name   ": `  ${randomName} `,
            "   Email Address ": `  ${generateEmailForName(name)}`,
            " Contact Number  ": ` ${generateIndianMobile()} `,
            "  Notes  ": faker.helpers.arrayElement([
                "interested",
                "will talk later",
                "CALL BACK!",
                "",
            ]),
            " Date Added ": faker.date.recent({ days: 10 }).toLocaleDateString("en-IN"),
        });
    }

    return { headers, rows };
}
