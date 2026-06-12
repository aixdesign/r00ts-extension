import * as browser from "webextension-polyfill";
import { ClueType, Clue } from "./types";

function extractValueAkamaiBC(str: string, key: string) {
    const match = str.match(new RegExp(`(?:^\\[|,)${key}=([^,\\]]+)`));
    return match ? match[1] : null;
}

const VERCEL_LOCATIONS: { [key: string]: { region: string, city: string, country: string, countryCode: string } } = {
    "arn1": { "region": "eu-north-1", "city": "Stockholm", "country": "Sweden", "countryCode": "SE" },
    "bom1": { "region": "ap-south-1", "city": "Mumbai", "country": "India", "countryCode": "IN" },
    "cdg1": { "region": "eu-west-3", "city": "Paris", "country": "France", "countryCode": "FR" },
    "cle1": { "region": "us-east-2", "city": "Cleveland", "country": "USA", "countryCode": "US" },
    "cpt1": { "region": "af-south-1", "city": "Cape Town", "country": "South Africa", "countryCode": "ZA" },
    "dub1": { "region": "eu-west-1", "city": "Dublin", "country": "Ireland", "countryCode": "IE" },
    "dxb1": { "region": "me-central-1", "city": "Dubai", "country": "United Arab Emirates", "countryCode": "AE" },
    "fra1": { "region": "eu-central-1", "city": "Frankfurt", "country": "Germany", "countryCode": "DE" },
    "gru1": { "region": "sa-east-1", "city": "São Paulo", "country": "Brazil", "countryCode": "BR" },
    "hkg1": { "region": "ap-east-1", "city": "Hong Kong", "country": "Hong Kong", "countryCode": "HK" },
    "hnd1": { "region": "ap-northeast-1", "city": "Tokyo", "country": "Japan", "countryCode": "JP" },
    "iad1": { "region": "us-east-1", "city": "Washington, D.C.", "country": "USA", "countryCode": "US" },
    "icn1": { "region": "ap-northeast-2", "city": "Seoul", "country": "South Korea", "countryCode": "KR" },
    "kix1": { "region": "ap-northeast-3", "city": "Osaka", "country": "Japan", "countryCode": "JP" },
    "lhr1": { "region": "eu-west-2", "city": "London", "country": "United Kingdom", "countryCode": "GB" },
    "pdx1": { "region": "us-west-2", "city": "Portland", "country": "USA", "countryCode": "US" },
    "sfo1": { "region": "us-west-1", "city": "San Francisco", "country": "USA", "countryCode": "US" },
    "sin1": { "region": "ap-southeast-1", "city": "Singapore", "country": "Singapore", "countryCode": "SG" },
    "syd1": { "region": "ap-southeast-2", "city": "Sydney", "country": "Australia", "countryCode": "AU" },
    "yul1": { "region": "ca-central-1", "city": "Montréal", "country": "Canada", "countryCode": "CA" }
};

export function parseCDNHeaders(responseHeaders: browser.WebRequest.HttpHeaders | undefined): Clue | undefined {
    if (!responseHeaders)
        return;

    for (const header of responseHeaders) {
        if (!header.value)
            continue;

        if (header.name.toLowerCase() === 'cf-ray') {
            // Cloudfare location
            const IATACode = header.value.slice(-3).toUpperCase();
            if (IATACode) {
                return {
                    type: ClueType.CLOUDFARE,
                    name: header.name,
                    code: IATACode
                };
            }
        } else if (header.name.toLowerCase() === 'x-amz-of-pop') {
            // Amazon CloudFront
            const IATACode = header.value.slice(0, 3).toUpperCase();
            if (IATACode) {
                return {
                    type: ClueType.AMAZON_CLOUDFRONT,
                    name: header.name,
                    code: IATACode
                };
            }
        } else if (header.name.toLowerCase() === 'x-vercel-id') {
            // Vercel
            const regionCode = header.value.slice(0, 4);
            if (regionCode && VERCEL_LOCATIONS[regionCode]) {
                const { city, countryCode } = VERCEL_LOCATIONS[regionCode];
                return {
                    type: ClueType.VERCEL,
                    name: header.name,
                    city,
                    countryCode
                };
            }
        } else if (header.name.toLowerCase() === 'akamai-request-bc') {
            // Akamai CDN breadcrumbs
            const location = extractValueAkamaiBC(header.value, 'n');
            if (!location)
                continue;

            const codes = location.split('_');
            console.log(`Akamai location: ${codes}`);
            if (codes.length != 3)
                continue;

            const [countryCode, regionCode, city] = codes;

            return {
                type: ClueType.AKAMAI,
                name: header.name,
                countryCode,
                regionCode,
                city
            };

        }
    }


}
