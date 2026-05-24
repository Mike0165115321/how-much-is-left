import { BankParser, ParsedTransaction } from './types';
import { cleanText, detectTransactionType, extractAmount, createBaseResult } from './base-parser';

export class KrungthaiParser implements BankParser {
  id = 'krungthai';
  name = 'Krungthai NEXT';

  detect(text: string): boolean {
    const textLower = text.toLowerCase();
    return (
      textLower.includes('krungthai') ||
      textLower.includes('ktb') ||
      textLower.includes('กรุงไทย') ||
      textLower.includes('next')
    );
  }

  parse(text: string): ParsedTransaction {
    const result = createBaseResult(text, 'krungthai');
    const cleaned = cleanText(text);

    // 1. Transaction Type
    result.type = detectTransactionType(cleaned);

    // 2. Amount
    result.amount = extractAmount(cleaned);

    // 3. Counterparty
    let counterparty = '';
    
    if (result.type === 'expense') {
      const payeeMatch = cleaned.match(/(?:โอนไปยัง บช\.|ไปยัง บช\.|โอนให้|ไปยัง|โอนเงินสำเร็จไปยัง):?\s*([^\n,.]+)/i);
      if (payeeMatch) {
        counterparty = payeeMatch[1].trim();
      }
    } else {
      const senderMatch = cleaned.match(/(?:ได้รับเงินโอนจำนวน.*?จาก|จาก บช\.|จาก)\s*([^\n,.]+)/i);
      if (senderMatch) {
        counterparty = senderMatch[1].trim();
      }
    }

    if (counterparty) {
      counterparty = counterparty.replace(/x-\d+/i, '').replace(/บช\..*$/i, '').trim();
    }

    result.counterparty = counterparty || (result.type === 'income' ? 'Krungthai Inflow' : 'Krungthai Outflow');

    // 4. Remaining Balance
    const balanceMatch = cleaned.match(/(?:คงเหลือ|ยอดเงินคงเหลือ):?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?)/i);
    if (balanceMatch) {
      result.remainingBalance = parseFloat(balanceMatch[1].replace(/,/g, ''));
    }

    // 5. Confidence Score Calculation
    let score = 0.5;
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
