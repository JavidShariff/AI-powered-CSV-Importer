import { fakerEN_IN as faker } from "@faker-js/faker";
import {
    generateName,
    generateEmailForName,
    generateIndianMobile,
} from "../utils/faker-helpers";

export function generateInvalidRecords(count: number): {
    headers: string[];
    rows: Record<string, unknown>[];
} {
    const headers = ["Name", "Email", "Mobile Phone", "Company", "Remarks"];
    const rows: Record<string, unknown>[] = [];

    for (let i = 0; i < count; i++) {
        const name = generateName();
        const scenario = i % 5;

        if (scenario === 0) {
            rows.push({
                Name: name,
                Email: "",
                "Mobile Phone": "",
                Company: faker.company.name(),
                Remarks: "Invalid row: No email or phone",
            });
        } else if (scenario === 1) {
            rows.push({
                Name: name,
                Email: `${name.toLowerCase().replace(/\s/g, "")}@not-an-email-domain`,
                "Mobile Phone": generateIndianMobile(),
                Company: faker.company.name(),
                Remarks: "Invalid email domain structure",
            });
        } else if (scenario === 2) {
            rows.push({
                Name: name,
                Email: generateEmailForName(name),
                "Mobile Phone": "987-ABCD-12",
                Company: faker.company.name(),
                Remarks: "Invalid characters in phone number",
            });
        } else if (scenario === 3) {
            rows.push({
                Name: "",
                Email: generateEmailForName(name),
                "Mobile Phone": generateIndianMobile(),
                Company: faker.company.name(),
                Remarks: "Missing name field",
            });
        } else {
            rows.push({
                Name: name,
                Email: "invalid_email@example",
                "Mobile Phone": "invalid_phone_123",
                Company: "",
                Remarks: "All contact info is malformed",
            });
        }
    }

    return { headers, rows };
}

export function generateEdgeCases(count: number): {
    headers: string[];
    rows: Record<string, unknown>[];
} {
    const headers = [
        "Name",
        "Email",
        "Mobile Phone",
        "Long Description",
        "Quotes and Seperators",
        "Unicode Emojis",
    ];
    const rows: Record<string, unknown>[] = [];

    for (let i = 0; i < count; i++) {
        const name = generateName();
        rows.push({
            Name: i === 0 ? "राजेश कुमार (Rajesh Hindi)" : name,
            Email: generateEmailForName(name),
            "Mobile Phone": generateIndianMobile(),
            "Long Description": faker.lorem.paragraphs(3),
            "Quotes and Seperators": `This has a "quote", and a comma, and a\nnew line in it.`,
            "Unicode Emojis": "🎉🔥 🚀 Corporate Leads Collection! ✅ 🌟 👍",
        });
    }

    return { headers, rows };
}
