import { ALLOWED_CRM_STATUS, ALLOWED_DATA_SOURCE, CANONICAL_FIELDS } from "../constants/schema";

/**
 * ============================================================
 *  Nexus CRM - CSV Extraction Prompt
 * ============================================================
 */

const CRM_STATUS_LIST = ALLOWED_CRM_STATUS.map((s) => `"${s}"`).join(", ");
const DATA_SOURCE_LIST = ALLOWED_DATA_SOURCE.map((s) => `"${s}"`).join(", ");
const FIELD_LIST = CANONICAL_FIELDS.join(", ");

const SYSTEM = `You are a senior CRM data-normalization engine. You convert
arbitrary CSV rows exported from any CRM, ad platform, or spreadsheet into a
strict canonical lead schema. You never invent data. You never guess. You
never explain. You only emit JSON.`;

const RULES = `
STRICT RULES:
1.  Output MUST be a JSON object with a single key "leads" whose value is a
    JSON array in the SAME ORDER as the input rows. Nothing else.
2.  Every array element MUST contain EXACTLY these keys (all strings):
    ${FIELD_LIST}.
3.  Use "" (empty string) for any field you cannot confidently derive from
    the input row. NEVER invent, guess, or fabricate values.
4.  "crm_status" MUST be one of ${CRM_STATUS_LIST} or "". Map free-text
    statuses semantically (e.g. "hot", "interested", "call back" ->
    "GOOD_LEAD_FOLLOW_UP"; "no answer", "unreachable" -> "DID_NOT_CONNECT";
    "junk", "spam", "dnc" -> "BAD_LEAD"; "closed won", "purchased",
    "converted" -> "SALE_DONE"). If unsure, use "".
5.  "data_source" MUST be one of ${DATA_SOURCE_LIST} or "". Map only when
    clearly named (case-insensitive substring match). Otherwise "".
6.  Phone normalization:
     - Detect country code from any leading '+CC', international prefix,
       or when the source column implies a locale. Store digits only in
       "country_code" (no '+'). Store the remaining national number as
       digits in "mobile_without_country_code".
     - If no country code is present, leave "country_code" as "" and put
       the raw digits in "mobile_without_country_code".
     - Strip spaces, dashes, parentheses, and dots.
7.  Multiple emails in one cell (comma / semicolon / whitespace separated):
    use the FIRST valid email in "email"; append the extras to "crm_note"
    prefixed with "Additional emails: ".
8.  Multiple phones in one cell: use the FIRST valid phone; append extras
    to "crm_note" prefixed with "Additional phones: ".
9.  If a row has NEITHER a valid email NOR a valid phone number after
    normalization, return null (JSON literal null) for that array element.
    The importer will skip nulls. Do not omit array positions.
10. Semantic header mapping - treat headers case-insensitively and consider
    common variants:
     - name: full_name, customer, client, contact, lead, person, prospect,
       first name + last name (concatenate with a space).
     - email: e-mail, mail, email_address, contact_email, customer_email.
     - phone: mobile, cell, telephone, contact, phone_number,
       customer_phone, lead_phone, whatsapp.
     - company: organization, business, account, employer.
     - lead_owner: assigned_to, owner, sales_rep, agent, account_manager.
     - created_at: date, created, created_on, timestamp, lead_created.
     - possession_time: possession, handover, ready_by, move_in.
     - description: notes, remarks, comments, message, enquiry, requirement.
     - crm_note: any additional freeform text that doesn't map elsewhere.
11. "created_at" and "possession_time" - keep the original value as-is if
    it is a reasonable date/datetime string. Do not re-format. If missing
    or unparseable, use "".
12. Extra unknown columns that carry useful text (source, campaign,
    utm_*, remarks that don't fit description) may be summarized into
    "crm_note" as "key: value" pairs joined by " | ". Do not fabricate.
13. Return ONLY a valid JSON array. Do not wrap the output inside \`\`\`json fences. Do not include explanations, comments, markdown, or additional text. The response must be directly parsable using JSON.parse().
14. Under no circumstances should you truncate output or omit commas. Return an empty array if no valid records are found.
`;

const OUTPUT_SCHEMA = `
OUTPUT SCHEMA (JSON, no prose):
{
  "leads": [
    {
      "created_at": "",
      "name": "",
      "email": "",
      "country_code": "",
      "mobile_without_country_code": "",
      "company": "",
      "city": "",
      "state": "",
      "country": "",
      "lead_owner": "",
      "crm_status": "",
      "crm_note": "",
      "data_source": "",
      "possession_time": "",
      "description": ""
    }
  ]
}
`;

const FEW_SHOT = `
====== EXAMPLE 1 - Facebook Leads export ======
INPUT ROWS:
[
  {
    "full_name": "Aditi Sharma",
    "email_address": "aditi@example.com",
    "phone_number": "+91 98765 43210",
    "campaign_name": "Meridian Tower Launch",
    "created_time": "2025-03-11T09:44:00+05:30",
    "city": "Bengaluru"
  }
]
OUTPUT:
{
  "leads": [
    {
      "created_at": "2025-03-11T09:44:00+05:30",
      "name": "Aditi Sharma",
      "email": "aditi@example.com",
      "country_code": "91",
      "mobile_without_country_code": "9876543210",
      "company": "",
      "city": "Bengaluru",
      "state": "",
      "country": "",
      "lead_owner": "",
      "crm_status": "",
      "crm_note": "campaign: Meridian Tower Launch",
      "data_source": "meridian_tower",
      "possession_time": "",
      "description": ""
    }
  ]
}

====== EXAMPLE 2 - Messy real-estate CRM export ======
INPUT ROWS:
[
  {
    "Customer": "Rahul Verma",
    "Mobile / Cell": "9812345678, 9800011122",
    "Emails": "rahul@a.com; rahul.v@b.com",
    "Status": "Hot Lead"
  }
]
OUTPUT:
{
  "leads": [
    {
      "created_at": "",
      "name": "Rahul Verma",
      "email": "rahul@a.com",
      "country_code": "",
      "mobile_without_country_code": "9812345678",
      "company": "",
      "city": "",
      "state": "",
      "country": "",
      "lead_owner": "",
      "crm_status": "GOOD_LEAD_FOLLOW_UP",
      "crm_note": "Additional emails: rahul.v@b.com | Additional phones: 9800011122",
      "data_source": "",
      "possession_time": "",
      "description": ""
    }
  ]
}
`;

const INVALID_EXAMPLES = `
====== INVALID OUTPUTS (DO NOT DO THIS) ======
BAD (markdown / prose):
  Here is the JSON:
  { ... }

BAD (fabricated fields):
  Input had no city -> "city": "Mumbai"
`;

export function buildExtractionPrompt(rows: Record<string, unknown>[]): string {
  const compactRows = rows.map((r) => {
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(r)) {
      if (v === null || v === undefined) continue;
      const s = String(v).trim();
      if (s === "") continue;
      out[String(k).trim()] = s;
    }
    return out;
  });

  return [
    SYSTEM,
    RULES,
    OUTPUT_SCHEMA,
    FEW_SHOT,
    INVALID_EXAMPLES,
    `====== NOW PROCESS THESE ${compactRows.length} ROWS ======`,
    "INPUT ROWS:",
    JSON.stringify(compactRows, null, 2),
    "OUTPUT (JSON only, no prose, no markdown):"
  ].join("\n\n");
}

export const PROMPT_METADATA = {
  version: "1.0.0",
  canonicalFields: CANONICAL_FIELDS,
  allowedCrmStatus: ALLOWED_CRM_STATUS,
  allowedDataSource: ALLOWED_DATA_SOURCE,
} as const;
