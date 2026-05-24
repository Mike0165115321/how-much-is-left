import { BankParser, ParsedTransaction } from './types';
import { TrueMoneyParser } from './truemoney-parser';
import { KPlusParser } from './kplus-parser';
import { KrungthaiParser } from './krungthai-parser';
import { SCBParser } from './scb-parser';
import { KKPParser } from './kkp-parser';
import { cleanText, detectTransactionType, extractAmount, createBaseResult } from './base-parser';

// Registry of all active parsing strategies
const parsers: BankParser[] = [
  new TrueMoneyParser(),
  new KPlusParser(),
  new KrungthaiParser(),
  new SCBParser(),
  new KKPParser()
];

/**
 * Fallback parser for generic, unbranded, or unsupported bank texts
 */
function fallbackParse(text: string): ParsedTransaction {
  const result = createBaseResult(text, 'unknown');
  const cleaned = cleanText(text);

  // Still attempt to extract basic amount and type
  result.type = detectTransactionType(cleaned);
  result.amount = extractAmount(cleaned);
  result.counterparty = result.type === 'income' ? 'Generic Inflow' : 'Generic Outflow';
  
  // Lower confidence because we couldn't match a specific provider
  let score = 0.2;
  if (result.amount > 0) score += 0.2;
  result.confidence = score;

  if (result.amount > 0) {
    result.status = 'partial'; // Can pre-fill amount, but user must confirm details
  } else {
    result.status = 'failed';
  }

  return result;
}

/**
 * High-level unified parsing API using the Strategy Pattern
 */
export function detectAndParse(text: string): ParsedTransaction {
  if (!text || !text.trim()) {
    return {
      provider: 'unknown',
      status: 'failed',
      type: 'expense',
      amount: 0,
      counterparty: '',
      confidence: 0,
      rawText: ''
    };
  }

  // Iterate over strategies to find a match
  for (const parser of parsers) {
    if (parser.detect(text)) {
      return parser.parse(text);
    }
  }

  // Fallback if no strategy detects its provider
  return fallbackParse(text);
}

export * from './types';
