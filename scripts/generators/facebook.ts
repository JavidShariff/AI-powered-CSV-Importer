import { fakerEN_IN as faker } from "@faker-js/faker";
import {
    generateName,
    generateEmailForName,
    generateIndianMobile,
    generateCity,
} from "../utils/faker-helpers";

export function generateFacebookLeads(count: number): {
    headers: string[];
    rows: Record<string, unknown>[];
} {
    const headers = [
        "Ad ID",
        "Ad Name",
        "Campaign Name",
        "Full Name",
        "Email",
        "Phone Number",
        "City",
        "Date Created",
    ];
    const rows: Record<string, unknown>[] = [];

    for (let i = 0; i < count; i++) {
        const name = generateName();
        rows.push({
            "Ad ID": `ad_${faker.string.numeric(12)}`,
            "Ad Name": faker.helpers.arrayElement([
                "FB_Lead_Form_Generic",
                "FB_Retargeting_Leads_IN",
                "Facebook_Form_Q3_Core",
            ]),
            "Campaign Name": faker.helpers.arrayElement([
                "Campaign_Brand_Awareness",
                "Lead_Gen_Bangalore_2026",
                "Festive_Season_Offers",
            ]),
            "Full Name": name,
            Email: generateEmailForName(name),
            "Phone Number": `+91${generateIndianMobile()}`,
            City: generateCity(),
            "Date Created": faker.date.recent({ days: 30 }).toISOString().split("T")[0],
        });
    }

    return { headers, rows };
}
