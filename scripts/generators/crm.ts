import { fakerEN_IN as faker } from "@faker-js/faker";
import {
    generateName,
    generateEmailForName,
    generateIndianMobile,
    generateCity,
    generateCompany,
    shuffleArray,
} from "../utils/faker-helpers";

export function generateRandomCrm(count: number): {
    headers: string[];
    rows: Record<string, unknown>[];
} {
    const baseHeaders = [
        "created_at",
        "name",
        "email",
        "country_code",
        "mobile_without_country_code",
        "company",
        "city",
        "state",
        "country",
        "lead_owner",
        "crm_status",
        "crm_note",
        "data_source",
        "possession_time",
        "description",
    ];
    const headers = shuffleArray(baseHeaders);
    const rows: Record<string, unknown>[] = [];

    for (let i = 0; i < count; i++) {
        const name = generateName();
        rows.push({
            created_at: faker.date.recent({ days: 90 }).toISOString(),
            name: name,
            email: generateEmailForName(name),
            country_code: "91",
            mobile_without_country_code: generateIndianMobile(),
            company: generateCompany(),
            city: generateCity(),
            state: faker.location.state(),
            country: "India",
            lead_owner: faker.person.firstName(),
            crm_status: faker.helpers.arrayElement([
                "GOOD_LEAD_FOLLOW_UP",
                "DID_NOT_CONNECT",
                "BAD_LEAD",
                "SALE_DONE",
                "",
            ]),
            crm_note: faker.lorem.sentence(),
            data_source: faker.helpers.arrayElement([
                "leads_on_demand",
                "meridian_tower",
                "eden_park",
                "varah_swamy",
                "sarjapur_plots",
                "",
            ]),
            possession_time: faker.helpers.arrayElement(["1 month", "Immediate", ""]),
            description: faker.company.catchPhrase(),
        });
    }

    return { headers, rows };
}

export function generateMultipleEmails(count: number): {
    headers: string[];
    rows: Record<string, unknown>[];
} {
    const headers = [
        "Name",
        "Primary Email",
        "Secondary Email",
        "Work Email",
        "Mobile Number",
    ];
    const rows: Record<string, unknown>[] = [];

    for (let i = 0; i < count; i++) {
        const name = generateName();
        rows.push({
            Name: name,
            "Primary Email": generateEmailForName(name, "gmail.com"),
            "Secondary Email": generateEmailForName(name, "yahoo.com"),
            "Work Email": generateEmailForName(name, "company.com"),
            "Mobile Number": generateIndianMobile(),
        });
    }

    return { headers, rows };
}

export function generateMultiplePhones(count: number): {
    headers: string[];
    rows: Record<string, unknown>[];
} {
    const headers = [
        "Client Name",
        "Email",
        "Mobile Phone",
        "Work Contact",
        "Home Landline",
        "Alt Number",
    ];
    const rows: Record<string, unknown>[] = [];

    for (let i = 0; i < count; i++) {
        const name = generateName();
        rows.push({
            "Client Name": name,
            Email: generateEmailForName(name),
            "Mobile Phone": generateIndianMobile(),
            "Work Contact": generateIndianMobile(),
            "Home Landline": `080${faker.string.numeric(7)}`,
            "Alt Number": generateIndianMobile(),
        });
    }

    return { headers, rows };
}
