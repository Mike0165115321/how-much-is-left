import { BankParser, ParsedTransaction } from './types';
import { cleanText, detectTransactionType, extractAmount, createBaseResult } from './base-parser';

export class KPlusParser implements BankParser {
  id = 'kplus';
  name = 'Kasikorn K PLUS';

  detect(text: string): boolean {
    const textLower = text.toLowerCase();
    return (
      textLower.includes('k plus') ||
      textLower.includes('kplus') ||
      textLower.includes('กสิกร') ||
      textLower.includes('kbank') ||
      textLower.includes('kasikorn')
    );
  }

  parse(text: string): ParsedTransaction {
    const result = createBaseResult(text, 'kplus');
    const cleaned = cleanText(text);

    // 1. Transaction Type
    result.type = detectTransactionType(cleaned);

    // 2. Amount
    result.amount = extractAmount(cleaned);

    // 3. Counterparty
    let counterparty = '';
    
    if (result.type === 'expense') {
      // Outflow payee search
      const payeeMatch = cleaned.match(/(?:ไปยัง บช\.|ให้ บช\.|โอนให้|ไปยัง|ให้)\s*([^\n,.]+)/i);
      if (payeeMatch) {
        counterparty = payeeMatch[1].trim();
      }
    } else {
      // Inflow sender search
      const senderMatch = cleaned.match(/(?:จาก บช\.|จาก)\s*([^\n,.]+)/i);
      if (senderMatch) {
        counterparty = senderMatch[1].trim();
      }
    }

    // Strip out generic text like card/account details x-1234 or numbers in names
    if (counterparty) {
      counterparty = counterparty.replace(/x-\d+/i, '').replace(/บช\..*$/i, '').trim();
    }

    result.counterparty = counterparty || (result.type === 'income' ? 'KBank Inflow' : 'KBank Outflow');

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
