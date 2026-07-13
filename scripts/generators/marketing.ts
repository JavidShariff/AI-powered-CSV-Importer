import { fakerEN_IN as faker } from "@faker-js/faker";
import {
    generateName,
    generateEmailForName,
    generateIndianMobile,
    generateCity,
    generateCompany,
} from "../utils/faker-helpers";

export function generateMarketingAgencyLeads(count: number): {
    headers: string[];
    rows: Record<string, unknown>[];
} {
    const headers = [
        "Client Name",
        "Campaign Title",
        "Lead Name",
        "Email Address",
        "Phone",
        "Location",
        "Status",
        "Agent Note",
        "Acquisition Date",
    ];
    const rows: Record<string, unknown>[] = [];

    for (let i = 0; i < count; i++) {
        const name = generateName();
        rows.push({
            "Client Name": generateCompany(),
            "Campaign Title": faker.helpers.arrayElement([
                "Q1 SEO Audit",
                "B2B SaaS Growth Pack",
                "Local SEO Optimization",
                "Lead Gen India",
            ]),
            "Lead Name": name,
            "Email Address": generateEmailForName(name),
            Phone: generateIndianMobile(),
            Location: generateCity(),
            Status: faker.helpers.arrayElement([
                "GOOD_LEAD_FOLLOW_UP",
                "DID_NOT_CONNECT",
                "SALE_DONE",
                "",
            ]),
            "Agent Note": faker.helpers.arrayElement([
                "Interested, called back",
                "No response",
                "Deal closed",
                "Request price list",
                "",
            ]),
            "Acquisition Date": faker.date.recent({ days: 60 }).toISOString().split("T")[0],
        });
    }

    return { headers, rows };
}
