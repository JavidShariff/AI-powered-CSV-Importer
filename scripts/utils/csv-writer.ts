import fs from "fs";
import path from "path";

/**
 * Escapes a single field for RFC 4180 CSV compliance.
 */
export function escapeCSVField(val: unknown): string {
    if (val === null || val === undefined) return "";
    const str = String(val);
    if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

/**
 * Utility to write a structured list of rows to a CSV file.
 * Creates directories if they do not exist.
 */
export function writeCSV(
    filePath: string,
    headers: string[],
    rows: Record<string, unknown>[],
): void {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    const headerLine = headers.map(escapeCSVField).join(",");
    const rowLines = rows.map((row) =>
        headers.map((h) => escapeCSVField(row[h])).join(","),
    );

    const content = [headerLine, ...rowLines].join("\n") + "\n";
    fs.writeFileSync(filePath, content, "utf8");
}
