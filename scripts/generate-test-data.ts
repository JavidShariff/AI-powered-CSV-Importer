console.log("=== NEW VERSION OF SCRIPT ===");

import path from "path";
import fs from "fs";
import { writeCSV } from "./utils/csv-writer";
import { generateFacebookLeads } from "./generators/facebook";
import { generateGoogleAdsLeads } from "./generators/google";
import { generateRealEstateLeads } from "./generators/real-estate";
import { generateMarketingAgencyLeads } from "./generators/marketing";
import { generateManualExcelLeads } from "./generators/excel";
import {
    generateRandomCrm,
    generateMultipleEmails,
    generateMultiplePhones,
} from "./generators/crm";
import { generateInvalidRecords, generateEdgeCases } from "./generators/edges";

import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_DIR = path.join(__dirname, "..", "test-data");

function ensureOutputDir() {
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
        console.log(`Created output directory at: ${OUTPUT_DIR}`);
    }
}

function run() {
    console.log("Starting test data generation...");
    const started = Date.now();
    ensureOutputDir();

    const datasets = [
        {
            filename: "facebook-leads.csv",
            generate: () => generateFacebookLeads(15),
        },
        {
            filename: "google-ads.csv",
            generate: () => generateGoogleAdsLeads(15),
        },
        {
            filename: "real-estate.csv",
            generate: () => generateRealEstateLeads(12),
        },
        {
            filename: "marketing-agency.csv",
            generate: () => generateMarketingAgencyLeads(15),
        },
        {
            filename: "manual-excel.csv",
            generate: () => generateManualExcelLeads(10),
        },
        {
            filename: "random-columns.csv",
            generate: () => generateRandomCrm(20),
        },
        {
            filename: "multiple-emails.csv",
            generate: () => generateMultipleEmails(15),
        },
        {
            filename: "multiple-phones.csv",
            generate: () => generateMultiplePhones(15),
        },
        {
            filename: "invalid-records.csv",
            generate: () => generateInvalidRecords(20),
        },
        {
            filename: "edge-cases.csv",
            generate: () => generateEdgeCases(10),
        },
        {
            filename: "large-500.csv",
            generate: () => generateRandomCrm(500),
        },
        {
            filename: "large-5000.csv",
            generate: () => generateRandomCrm(5000),
        },
    ];

    for (const ds of datasets) {
        const filePath = path.join(OUTPUT_DIR, ds.filename);
        const { headers, rows } = ds.generate();
        console.log(`Generating ${ds.filename} with ${rows.length} rows...`);
        writeCSV(filePath, headers, rows);
    }

    const duration = ((Date.now() - started) / 1000).toFixed(1);
    console.log(`\nSuccess! All 12 mock datasets generated in ${duration}s.`);
    console.log(`Path: ${OUTPUT_DIR}`);
}

run();
