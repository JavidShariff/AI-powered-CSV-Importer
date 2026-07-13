import { fakerEN_IN as faker } from "@faker-js/faker";
import {
    generateName,
    generateEmailForName,
    generateIndianMobile,
    generateCity,
    generateState,
} from "../utils/faker-helpers";

export function generateRealEstateLeads(count: number): {
    headers: string[];
    rows: Record<string, unknown>[];
} {
    const headers = [
        "Interested Property",
        "Budget (INR)",
        "Lead Name",
        "Email ID",
        "Contact Number",
        "City",
        "State",
        "Possession Target Time",
        "Remarks",
        "Created Date",
    ];
    const rows: Record<string, unknown>[] = [];

    const properties = [
        "Meridian Towers - 3BHK",
        "Eden Park Villas",
        "Sarjapur Plots - Phase II",
        "Varaha Swamy Residency",
    ];

    for (let i = 0; i < count; i++) {
        const name = generateName();
        const budget = faker.helpers.arrayElement([
            "75 Lakhs - 1.2 Crore",
            "1.5 Crore - 2 Crore",
            "50 Lakhs - 75 Lakhs",
            "2 Crore+",
        ]);

        rows.push({
            "Interested Property": faker.helpers.arrayElement(properties),
            "Budget (INR)": budget,
            "Lead Name": name,
            "Email ID": generateEmailForName(name),
            "Contact Number": generateIndianMobile(),
            City: generateCity(),
            State: generateState(),
            "Possession Target Time": faker.helpers.arrayElement([
                "Immediate",
                "Within 6 months",
                "1-2 Years",
                "Ready to Move",
            ]),
            Remarks: faker.helpers.arrayElement([
                "Client looking for immediate site inspection",
                "Wants loan facility details",
                "Interested in corner plots",
                "Negotiating price",
                "Requires floor plan via WhatsApp",
            ]),
            "Created Date": faker.date.recent({ days: 30 }).toISOString().split("T")[0],
        });
    }

    return { headers, rows };
}
