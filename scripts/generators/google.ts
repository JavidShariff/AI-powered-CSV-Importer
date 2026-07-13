import { fakerEN_IN as faker } from "@faker-js/faker";
import {
    generateName,
    generateEmailForName,
    generateIndianMobile,
    generateCity,
} from "../utils/faker-helpers";

export function generateGoogleAdsLeads(count: number): {
    headers: string[];
    rows: Record<string, unknown>[];
} {
    const headers = [
        "Google Click ID (GCLID)",
        "Conversion Name",
        "Conversion Time",
        "Customer Name",
        "Customer Email",
        "Customer Phone",
        "Campaign Name",
        "Ad Group Name",
        "Location",
    ];
    const rows: Record<string, unknown>[] = [];

    for (let i = 0; i < count; i++) {
        const name = generateName();
        rows.push({
            "Google Click ID (GCLID)": `gclid_${faker.string.alphanumeric(24)}`,
            "Conversion Name": "Contact Form Submit",
            "Conversion Time": faker.date.recent({ days: 15 }).toISOString().replace("T", " ").substring(0, 19),
            "Customer Name": name,
            "Customer Email": generateEmailForName(name),
            "Customer Phone": `0${generateIndianMobile()}`, // Formats phone with a leading 0 sometimes
            "Campaign Name": faker.helpers.arrayElement([
                "Google_Search_CRM_Gateway",
                "Google_Display_B2B_SaaS",
                "Performance_Max_IN",
            ]),
            "Ad Group Name": faker.helpers.arrayElement([
                "Enterprise_Leads",
                "SMB_CSV_Importer",
                "Exact_Match_CRM",
            ]),
            Location: generateCity(),
        });
    }

    return { headers, rows };
}
