import { logger } from "./logger";

const RESOURCE_ID = "9ef84268-d588-465a-a308-a864a43d0070";
const BASE_URL = `https://api.data.gov.in/resource/${RESOURCE_ID}`;
const PAGE_SIZE = 1000;
const MAX_PAGES = 20;

export interface RawMandiRecord {
  state: string;
  district: string;
  market: string;
  commodity: string;
  variety: string;
  grade: string;
  arrival_date: string;
  min_price: string | number;
  max_price: string | number;
  modal_price: string | number;
}

interface DataGovInResponse {
  total: number;
  count: number;
  records: RawMandiRecord[];
}

/**
 * Fetches live daily mandi (market) price data from data.gov.in — India's
 * Open Government Data platform. Source: Ministry of Agriculture and Farmers
 * Welfare, "Current Daily Price of Various Commodities from Various Markets".
 * This endpoint only exposes today's snapshot (no historical range query),
 * so history accumulates naturally each time this is synced.
 */
export async function fetchLiveMandiRecords(): Promise<RawMandiRecord[]> {
  const apiKey = process.env.DATA_GOV_IN_API_KEY;
  if (!apiKey) {
    throw new Error("DATA_GOV_IN_API_KEY is not set");
  }

  const records: RawMandiRecord[] = [];
  let offset = 0;

  for (let page = 0; page < MAX_PAGES; page++) {
    const url = `${BASE_URL}?api-key=${apiKey}&format=json&limit=${PAGE_SIZE}&offset=${offset}`;

    let data: DataGovInResponse | undefined;
    for (let attempt = 0; attempt < 3 && !data; attempt++) {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`data.gov.in request failed: ${res.status} ${res.statusText}`);
      }
      const parsed = (await res.json()) as Partial<DataGovInResponse>;
      if (Array.isArray(parsed.records)) {
        data = parsed as DataGovInResponse;
      } else {
        logger.warn({ page, attempt, offset }, "data.gov.in returned no records array, retrying");
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      }
    }

    if (!data) {
      logger.warn({ page, offset }, "giving up on page after retries — stopping pagination early");
      break;
    }

    records.push(...data.records);

    logger.info(
      { page, fetched: data.records.length, total: data.total, offset },
      "fetched mandi price page from data.gov.in",
    );

    offset += PAGE_SIZE;
    if (offset >= data.total || data.records.length === 0) {
      break;
    }
  }

  return records;
}

/** Converts data.gov.in's DD/MM/YYYY date format to ISO YYYY-MM-DD. */
export function parseArrivalDate(arrivalDate: string): string {
  const [day, month, year] = arrivalDate.split("/");
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}
