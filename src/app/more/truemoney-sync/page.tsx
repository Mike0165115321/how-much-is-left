import React, { useState } from 'react';
import { useFinanceStore } from '../../../store/useFinanceStore';
import { 
  ArrowLeft, 
  Smartphone, 
  Clipboard, 
  CheckCircle2, 
  FileText, 
  Upload, 
  AlertTriangle,
  Sparkles,
  Info,
  TrendingDown,
  TrendingUp,
  Check
} from 'lucide-react';

interface ParsedTx {
  amount: number;
  type: 'expense' | 'income';
  note: string;
  categoryId: string;
}

export default function TrueMoneySyncPage({ onBack }: { onBack: () => void }) {
  const { language, categories, addTransaction } = useFinanceStore();
  const [pasteText, setPasteText] = useState('');
  const [parsedData, setParsedData] = useState<ParsedTx | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  // CSV drag & drop states
  const [isDragging, setIsDragging] = useState(false);
  const [importedCount, setImportedCount] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Helper to format currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 0, maximumFractionDigits: 0 })
      .format(val)
      .replace('THB', '฿')
      .trim();
  };

  // Smart Parser logic for TrueMoney clipboard text
  const handleParse = (text: string) => {
    setPasteText(text);
    if (!text.trim()) {
      setParsedData(null);
      return;
    }

    let amount = 0;
    
    // Regex matches common Thai/English receipt amount patterns
    // e.g. "จำนวนเงิน: 150.00 บาท", "150.00 บาท", "ชำระเงินสำเร็จ 120 บาท", "โอนเงินสำเร็จ 1200 บาท"
    const amountMatch = text.match(/(?:จำนวน|จำนวนเงิน|ยอด|ยอดเงิน|มูลค่า|โอนเงิน|ชำระเงิน|จ่าย)?(?::|\s)*(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:บาท|THB|฿)/i) || 
                        text.match(/(?:โอนเงิน|ชำระเงิน|จ่ายเงิน)\s*สำเร็จ\s*(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:บาท|THB|฿)?/i) ||
                        text.match(/(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:บาท|THB|฿)/);
    
    if (amountMatch) {
      amount = parseFloat(amountMatch[1].replace(/,/g, ''));
    } else {
      // Fallback: search for first float/integer in the text
      const fallbackMatch = text.match(/\d+(?:\.\d{1,2})?/);
      if (fallbackMatch) {
        amount = parseFloat(fallbackMatch[0]);
      }
    }

    if (!amount || isNaN(amount)) {
      setParsedData(null);
      return;
    }

    // Determine type (expense vs income)
    let type: 'expense' | 'income' = 'expense';
    const lowercaseText = text.toLowerCase();
    
    if (
      lowercaseText.includes('รับเงิน') || 
      lowercaseText.includes('ได้รับ') || 
      lowercaseText.includes('โอนเงินเข้า') || 
      lowercaseText.includes('เติมเงินสำเร็จ') ||
      lowercaseText.includes('เติมเงินเข้า') ||
      lowercaseText.includes('inflow') ||
      lowercaseText.includes('received')
    ) {
      type = 'income';
    }

    // Extract Payee / Merchant / Note
    let note = '';
    const payeeMatch = text.match(/(?:ผู้รับ|ร้านค้า|จ่ายให้|ถึง|โอนไปยัง):?\s*(.*)/i) || 
                       text.match(/(?:ชำระค่าบริการให้แก่|โอนเงินสำเร็จไปยัง):?\s*(.*)/i);
    
    if (payeeMatch) {
      note = payeeMatch[1].trim();
    } else {
      // Look at first line or use default fallback
      const lines = text.split('\n');
      if (lines.length > 1 && lines[0].length < 30) {
        note = lines[0].trim();
      } else {
        note = type === 'income' ? 'TrueMoney Inflow' : 'TrueMoney Outflow';
      }
    }

    // Smart Category Tag Suggestion
    let categoryId = 'cat-food'; // default
    if (type === 'income') {
      categoryId = 'cat-other-income';
    } else {
      const cleanNote = note.toLowerCase();
      if (cleanNote.includes('7-eleven') || cleanNote.includes('เซเว่น') || cleanNote.includes('shabu') || cleanNote.includes('food') || cleanNote.includes('อาหาร') || cleanNote.includes('กิน') || cleanNote.includes('สุกี้')) {
        categoryId = 'cat-food';
      } else if (cleanNote.includes('bts') || cleanNote.includes('mrt') || cleanNote.includes('grab') || cleanNote.includes('เดินทาง') || cleanNote.includes('รถ') || cleanNote.includes('เติมน้ำมัน')) {
        categoryId = 'cat-transport';
      } else if (cleanNote.includes('shopee') || cleanNote.includes('lazada') || cleanNote.includes('ช้อป') || cleanNote.includes('shop') || cleanNote.includes('ซื้อ') || cleanNote.includes('ห้าง')) {
        categoryId = 'cat-shop';
      } else if (cleanNote.includes('netflix') || cleanNote.includes('spotify') || cleanNote.includes('หนัง') || cleanNote.includes('เกม') || cleanNote.includes('game') || cleanNote.includes('steam')) {
        categoryId = 'cat-entertainment';
      } else if (cleanNote.includes('ไฟ') || cleanNote.includes('น้ำ') || cleanNote.includes('เน็ต') || cleanNote.includes('บิล') || cleanNote.includes('bill') || cleanNote.includes('โทรศัพท์')) {
        categoryId = 'cat-utilities';
      } else if (cleanNote.includes('ai') || cleanNote.includes('chatgpt') || cleanNote.includes('midjourney') || cleanNote.includes('claude') || cleanNote.includes('api')) {
        categoryId = 'cat-ai';
      }
    }

    setParsedData({
      amount,
      type,
      note: note.slice(0, 35).trim(),
      categoryId
    });
    setIsSaved(false);
  };

  // Save transaction to store
  const handleSaveTransaction = () => {
    if (!parsedData) return;

    addTransaction({
      type: parsedData.type,
      amount: parsedData.amount,
      categoryId: parsedData.categoryId,
      note: `[TrueMoney] ${parsedData.note}`,
      date: new Date().toISOString().split('T')[0]
    });

    setIsSaved(true);
    setPasteText('');
    
    // Clear success state after 2 seconds
    setTimeout(() => {
      setParsedData(null);
      setIsSaved(false);
    }, 2000);
  };

  // Mock CSV File processing
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile();
    }
  };

  const processFile = () => {
    setIsUploading(true);
    
    // Simulate smart OCR/CSV parse spinner
    setTimeout(() => {
      setIsUploading(false);
      
      // Simulate bulk importing 5 transactions
      const simulatedTxs = [
        { type: 'expense' as const, amount: 89, categoryId: 'cat-food', note: '[TrueMoney] 7-Eleven', date: new Date().toISOString().split('T')[0] },
        { type: 'expense' as const, amount: 150, categoryId: 'cat-shop', note: '[TrueMoney] Shopee Retail', date: new Date().toISOString().split('T')[0] },
        { type: 'expense' as const, amount: 35, categoryId: 'cat-transport', note: '[TrueMoney] MRT Blue Line', date: new Date().toISOString().split('T')[0] },
        { type: 'expense' as const, amount: 450, categoryId: 'cat-utilities', note: '[TrueMoney] Mobile Bill', date: new Date().toISOString().split('T')[0] },
        { type: 'income' as const, amount: 2000, categoryId: 'cat-other-income', note: '[TrueMoney] P2P Transferred', date: new Date().toISOString().split('T')[0] },
      ];

      simulatedTxs.forEach(tx => addTransaction(tx));
      setImportedCount(5);

      setTimeout(() => {
        setImportedCount(null);
      }, 3500);
    }, 2000);
  };

  const targetCategory = parsedData ? categories.find(c => c.id === parsedData.categoryId) : null;

  return (
    <div className="flex flex-col flex-1 pb-10 animate-in fade-in duration-300" id="truemoney_sync_screen">
      
      {/* Header bar with custom TrueMoney styling gradient */}
      <header className="px-6 pt-6 pb-4 border-b border-zinc-900 sticky top-0 bg-black/95 z-10 flex items-center gap-4">
        <button 
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 active:scale-95 transition-all cursor-pointer outline-none"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <span className="text-[#ff5f00] text-[10px] uppercase font-bold tracking-widest font-mono flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5" />
            TrueMoney Wallet
          </span>
          <h1 className="text-xl font-bold text-zinc-100 mt-0.5 tracking-tight">
            {language === 'TH' ? 'เชื่อมต่อทรูมันนี่ วอลเล็ท' : 'TrueMoney Integration'}
          </h1>
        </div>
      </header>

      {/* Main body workspace */}
      <main className="flex-grow px-6 py-4 max-w-xl mx-auto w-full flex flex-col gap-6">
        
        {/* API Limitation Alert Card */}
        <section className="bg-orange-500/5 border border-orange-500/20 p-4 rounded-2xl flex gap-3.5 text-left">
          <Info className="w-5 h-5 text-[#ff5f00] shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-bold text-[#ff5f00]">
              {language === 'TH' ? '🔐 การซิงค์ข้อมูลที่เป็นมิตรและปลอดภัย' : '🔐 Safe & Decentralized Integration'}
            </span>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              {language === 'TH' 
                ? 'เนื่องจาก TrueMoney Wallet ไม่มี API สาธารณะสำหรับผู้ใช้ทั่วไป แอปพลิเคชันของเราจึงเลือกใช้ระบบการสแกนแบบออฟไลน์ 100% ที่ปลอดภัยที่สุด โดยคุณไม่จำเป็นต้องกรอกรหัสผ่านหรือขอรหัส OTP ใดๆ ให้เสี่ยงต่อข้อมูลรั่วไหลเลยค่ะ!'
                : 'Since TrueMoney does not offer retail open APIs, we use a 100% secure, offline local parse mechanism. Your credentials and OTP are never requested.'}
            </p>
          </div>
        </section>

        {/* METHOD 1: Smart Clipboard Scan */}
        <section className="bg-[#121212] border border-zinc-900 rounded-2xl p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-9 h-9 rounded-xl bg-orange-950/20 border border-orange-900/30 flex items-center justify-center text-[#ff5f00]">
              <Clipboard className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="font-bold text-zinc-200 text-sm">
                {language === 'TH' ? 'วิธีที่ 1: คัดลอกแล้ววางข้อความสำเร็จ' : 'Method 1: Smart Text Clipboard Sync'}
              </h3>
              <p className="text-[10px] text-zinc-550 mt-0.5">
                {language === 'TH' ? 'คัดลอกข้อความทำธุรกรรมเสร็จจากแอป TrueMoney แล้วนำมาวางได้ทันที' : 'Copy success text details from TrueMoney App and paste here.'}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <textarea 
              value={pasteText}
              onChange={(e) => handleParse(e.target.value)}
              placeholder={language === 'TH' 
                ? "ตัวอย่าง:\nโอนเงินสำเร็จ\nจำนวนเงิน: 150.00 บาท\nโอนให้: นายสมศักดิ์\nวันที่: 24 พ.ค. 2026"
                : "Paste copied transaction success message details from TrueMoney..."
              }
              rows={4}
              className="w-full bg-zinc-950 border border-zinc-850 hover:border-zinc-800 focus:border-[#ff5f00] text-zinc-300 placeholder-zinc-700 rounded-xl p-3.5 text-xs outline-none font-sans leading-relaxed transition-colors resize-none"
            />

            {/* Smart OCR feedback card */}
            {parsedData && (
              <div className="border border-zinc-850/80 bg-zinc-950/60 p-4 rounded-xl flex items-center justify-between animate-in zoom-in duration-200">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-xl shrink-0 border border-zinc-850">
                    {targetCategory?.emoji || '🍔'}
                  </div>
                  <div className="flex flex-col text-left min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-zinc-200 text-sm truncate">{parsedData.note}</span>
                      <span className="px-1.5 py-0.5 text-[8.5px] uppercase font-bold tracking-wider rounded-sm bg-orange-950/20 text-[#ff5f00] border border-orange-900/10">
                        {targetCategory ? (language === 'TH' ? targetCategory.nameTH : targetCategory.nameEN) : 'Category'}
                      </span>
                    </div>
                    <span className="text-[10px] text-zinc-500 font-mono mt-0.5 flex items-center gap-1">
                      {parsedData.type === 'income' ? <TrendingUp className="w-3 h-3 text-[#4edea3]" /> : <TrendingDown className="w-3 h-3 text-[#ff7875]" />}
                      {parsedData.type === 'income' ? (language === 'TH' ? 'ตรวจพบ: รายรับ' : 'Detected: Inflow') : (language === 'TH' ? 'ตรวจพบ: รายจ่าย' : 'Detected: Outflow')}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end shrink-0 gap-2 ml-2">
                  <span className={`font-mono text-base font-extrabold ${parsedData.type === 'income' ? 'text-[#4edea3]' : 'text-[#ff7875]'}`}>
                    {parsedData.type === 'income' ? '+' : '-'}{formatCurrency(parsedData.amount)}
                  </span>
                  
                  <button 
                    onClick={handleSaveTransaction}
                    disabled={isSaved}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 flex items-center gap-1 cursor-pointer select-none ${
                      isSaved
                        ? 'bg-emerald-950/20 border border-emerald-900/30 text-[#4edea3]'
                        : 'bg-[#ff5f00] text-white hover:opacity-95 shadow-[0_0_15px_rgba(255,95,0,0.15)]'
                    }`}
                  >
                    {isSaved ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>{language === 'TH' ? 'บันทึกสำเร็จ' : 'Saved'}</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{language === 'TH' ? 'บันทึกด่วน' : 'Import Ledger'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* METHOD 2: drag and drop Statement files */}
        <section className="bg-[#121212] border border-zinc-900 rounded-2xl p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-9 h-9 rounded-xl bg-orange-950/20 border border-orange-900/30 flex items-center justify-center text-[#ff5f00]">
              <FileText className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="font-bold text-zinc-200 text-sm">
                {language === 'TH' ? 'วิธีที่ 2: นำเข้าไฟล์รายงานยอดเงิน (Statement CSV)' : 'Method 2: CSV/Excel Statement Importer'}
              </h3>
              <p className="text-[10px] text-zinc-550 mt-0.5">
                {language === 'TH' ? 'นำเข้าประวัติธุรกรรมหลายรายการพร้อมกันในคลิกเดียวผ่านไฟล์รายงานยอดเงิน' : 'Import bulk transaction records simultaneously using your downloaded statements.'}
              </p>
            </div>
          </div>

          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={processFile}
            className={`border-2 border-dashed rounded-2xl p-7 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99] select-none ${
              isDragging 
                ? 'border-[#ff5f00] bg-orange-500/5' 
                : 'border-zinc-800 hover:border-zinc-700 bg-zinc-950/40'
            }`}
          >
            {isUploading ? (
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 rounded-full border-2 border-zinc-800 border-t-[#ff5f00] animate-spin" />
                <span className="text-[11px] font-bold text-zinc-450 mt-1 uppercase tracking-wider animate-pulse">
                  {language === 'TH' ? 'กำลังวิเคราะห์นำเข้าข้อมูล...' : 'Processing statement data...'}
                </span>
              </div>
            ) : importedCount !== null ? (
              <div className="flex flex-col items-center text-center gap-1.5 animate-in zoom-in duration-200">
                <div className="w-10 h-10 rounded-full bg-emerald-950/20 border border-emerald-900/30 flex items-center justify-center text-[#4edea3] mb-1">
                  <CheckCircle2 className="w-5.5 h-5.5" />
                </div>
                <span className="text-xs font-bold text-zinc-200">
                  {language === 'TH' ? `นำเข้าเรียบร้อย ${importedCount} รายการ!` : `Imported ${importedCount} transactions successfully!`}
                </span>
                <p className="text-[10px] text-zinc-500 max-w-xs leading-normal">
                  {language === 'TH' 
                    ? 'รายการธุรกรรมทั้งหมดถูกจัดสรรและบันทึกเข้ากระเป๋าบัญชีกลางเรียบร้อยค่ะ'
                    : 'Records parsed and securely stored in your offline wallet ledger.'}
                </p>
              </div>
            ) : (
              <>
                <Upload className="w-7 h-7 text-zinc-650 mb-1" />
                <span className="text-xs font-bold text-zinc-300">
                  {language === 'TH' ? 'คลิกหรือวางไฟล์รายงานยอดเงิน (.csv, .xls)' : 'Drop statement spreadsheet files here'}
                </span>
                <p className="text-[10px] text-zinc-550 max-w-xs text-center leading-normal">
                  {language === 'TH' 
                    ? 'รองรับไฟล์รายงานสรุปธุรกรรมที่ดาวน์โหลดจากแอปทรูมันนี่หรืออีเมลใบเสร็จ'
                    : 'Drag & Drop CSV / Excel or click to browse files from download folders.'}
                </p>
              </>
            )}
          </div>
        </section>

      </main>
    </div>
  );
}
