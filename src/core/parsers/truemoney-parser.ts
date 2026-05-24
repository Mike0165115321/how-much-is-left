import { BankParser, ParsedTransaction } from './types';
import { cleanText, detectTransactionType, extractAmount, createBaseResult } from './base-parser';

export class TrueMoneyParser implements BankParser {
  id = 'truemoney';
  name = 'TrueMoney Wallet';

  detect(text: string): boolean {
    const textLower = text.toLowerCase();
    return (
      textLower.includes('truemoney') ||
      textLower.includes('ทรูมันนี่') ||
      textLower.includes('วอลเล็ท') ||
      textLower.includes('wallet')
    );
  }

  parse(text: string): ParsedTransaction {
    const result = createBaseResult(text, 'truemoney');
    const cleaned = cleanText(text);
    const cleanedLower = cleaned.toLowerCase();

    // 1. Transaction Type
    result.type = detectTransactionType(cleaned);

    // 2. Amount
    result.amount = extractAmount(cleaned);

    // 3. Counterparty (Payee / Merchant / Sender)
    let counterparty = '';
    const counterpartyMatch = cleaned.match(/(?:ผู้รับ|ร้านค้า|จ่ายให้|ถึง|โอนให้|โอนไปยัง|ไปยัง บช\.|รับเงินจาก|จาก|โอนเงินสำเร็จไปยัง):?\s*([^\n]+)/i);
    
    if (counterpartyMatch) {
      counterparty = counterpartyMatch[1].trim();
      // Clean up x-1234 or numbers in names if present
      counterparty = counterparty.replace(/บัญชี\s*x-\d+/i, '').trim();
    }

    result.counterparty = counterparty || (result.type === 'income' ? 'TrueMoney Inflow' : 'TrueMoney Outflow');

    // 4. Remaining Balance
    const balanceMatch = cleaned.match(/(?:คงเหลือ|ยอดเงินคงเหลือ|คงเหลือหลังทำรายการ):?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?)/i);
    if (balanceMatch) {
      result.remainingBalance = parseFloat(balanceMatch[1].replace(/,/g, ''));
    }

    // 5. Confidence Score Calculation
    let score = 0.5; // Base score for correct provider detection
    if (result.amount > 0) score += 0.25;
    if (counterparty) score += 0.15;
    if (result.remainingBalance !== undefined) score += 0.1;

    result.confidence = Math.min(1.0, score);

    // 6. UI Status mapping
    if (result.amount > 0 && counterparty) {
      result.status = 'success';
    } else if (result.amount > 0) {
      result.status = 'partial';
    } else {
      result.status = 'failed';
    }

    return result;
  }
}
