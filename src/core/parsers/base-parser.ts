import { ParsedTransaction, FinancialProvider } from './types';

/**
 * Standard text cleaning helper to remove double spacing and standardize line endings
 */
export function cleanText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Shared Transaction Direction Detection Layer (Detects Inflow vs Outflow)
 */
export function detectTransactionType(text: string): 'expense' | 'income' {
  const textLower = text.toLowerCase();
  
  // High confidence keywords indicating money going in
  const incomeKeywords = [
    'รับเงิน',
    'ได้รับ',
    'เงินเข้า',
    'ได้รับเงินโอน',
    'โอนเงินเข้า',
    'เติมเงินสำเร็จ',
    'เติมเงินเข้า',
    'inflow',
    'received',
    'deposited',
    'deposit'
  ];

  for (const keyword of incomeKeywords) {
    if (textLower.includes(keyword)) {
      return 'income';
    }
  }

  // Fallback to expense (most common for finance tracking)
  return 'expense';
}

/**
 * Robust, maintainable amount extractor
 * Looks for common Thai receipt decimal and whole-number patterns.
 */
export function extractAmount(text: string): number {
  // Replace standard space formatting first
  const clean = text.replace(/,/g, '');
  
  // Regex 1: Matches number preceding "บาท", "thb", or "฿"
  // E.g., "150.00 บาท", "2000 THB"
  const thbMatch = clean.match(/(\d+(?:\.\d{1,2})?)\s*(?:บาท|thb|฿)/i);
  if (thbMatch) {
    const val = parseFloat(thbMatch[1]);
    if (!isNaN(val) && val > 0) return val;
  }

  // Regex 2: Matches number succeeding transaction/charge action verbs
  // E.g., "โอนเงินสำเร็จ 500", "ชำระเงิน 120"
  const actionMatch = clean.match(/(?:จำนวน|จำนวนเงิน|ยอด|ยอดเงิน|มูลค่า|โอนเงิน|ชำระเงิน|จ่ายเงิน|สำเร็จ)\s*(\d+(?:\.\d{1,2})?)/i);
  if (actionMatch) {
    const val = parseFloat(actionMatch[1]);
    if (!isNaN(val) && val > 0) return val;
  }

  // Regex 3: Fallback - grab first valid float/integer in the text block
  const fallbackMatch = clean.match(/\d+(?:\.\d{1,2})?/);
  if (fallbackMatch) {
    const val = parseFloat(fallbackMatch[0]);
    if (!isNaN(val) && val > 0) return val;
  }

  return 0;
}

/**
 * Pre-constructs a base normalized transaction record with defaults
 */
export function createBaseResult(rawText: string, provider: FinancialProvider): ParsedTransaction {
  return {
    provider,
    status: 'failed',
    type: 'expense',
    amount: 0,
    counterparty: '',
    confidence: 0,
    rawText
  };
}
