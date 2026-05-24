export type FinancialProvider = 'truemoney' | 'kplus' | 'krungthai' | 'scb' | 'kkp' | 'unknown';
export type ParserStatus = 'success' | 'partial' | 'failed';

export interface ParsedTransaction {
  provider: FinancialProvider;
  status: ParserStatus;
  type: 'expense' | 'income';
  amount: number;
  counterparty: string;       // Payee name, merchant, or sender
  timestamp?: string;         // Time of transaction (e.g. HH:MM or raw date)
  remainingBalance?: number;  // Detected pocket balance after transaction
  confidence: number;         // Confidence score (0.0 to 1.0)
  rawText: string;            // The original clipboard text
}

export interface BankParser {
  id: string;
  name: string;
  detect(text: string): boolean;
  parse(text: string): ParsedTransaction;
}
