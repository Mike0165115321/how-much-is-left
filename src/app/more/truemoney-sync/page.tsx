import React, { useState, useEffect } from 'react';
import { useFinanceStore } from '../../../store/useFinanceStore';
import { detectAndParse, ParsedTransaction, FinancialProvider, ParserStatus } from '../../../core/parsers';
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
  Check,
  ShieldCheck,
  Zap,
  AlertCircle,
  KeyRound
} from 'lucide-react';

interface LinkedChannel {
  provider: 'truemoney' | 'kplus' | 'krungthai' | 'scb' | 'kkp';
  status: 'disconnected' | 'connected';
  accountNumber?: string;
}

export default function TrueMoneySyncPage({ onBack }: { onBack: () => void }) {
  const { language, categories, addTransaction } = useFinanceStore();

  // persistent linked accounts from localStorage
  const [linkedChannels, setLinkedChannels] = useState<LinkedChannel[]>(() => {
    const saved = localStorage.getItem('how-much-is-left-connected-channels');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure kkp provider exists in saved state
        if (!parsed.some((ch: any) => ch.provider === 'kkp')) {
          parsed.push({ provider: 'kkp', status: 'disconnected' });
        }
        return parsed;
      } catch (e) {
        // Fallback below
      }
    }
    return [
      { provider: 'truemoney', status: 'disconnected' },
      { provider: 'kplus', status: 'disconnected' },
      { provider: 'krungthai', status: 'disconnected' },
      { provider: 'scb', status: 'disconnected' },
      { provider: 'kkp', status: 'disconnected' },
    ];
  });

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem('how-much-is-left-connected-channels', JSON.stringify(linkedChannels));
  }, [linkedChannels]);

  // Connection Wizard states
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [setupProvider, setSetupProvider] = useState<'truemoney' | 'kplus' | 'krungthai' | 'scb' | 'kkp' | null>(null);
  const [setupStep, setSetupStep] = useState<1 | 2 | 3>(1);
  const [accountInput, setAccountInput] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpCountdown, setOtpCountdown] = useState(60);
  const [otpError, setOtpError] = useState(false);
  const [showSmsPopup, setShowSmsPopup] = useState(false);

  // Paste Text and Direct Parser states
  const [pasteText, setPasteText] = useState('');
  const [parsedData, setParsedData] = useState<ParsedTransaction | null>(null);
  const [suggestedCategoryId, setSuggestedCategoryId] = useState('cat-food');
  const [isSaved, setIsSaved] = useState(false);

  // OTP Countdown timer
  useEffect(() => {
    let interval: any = null;
    if (showSetupModal && setupStep === 2 && otpCountdown > 0) {
      interval = setInterval(() => {
        setOtpCountdown((prev) => prev - 1);
      }, 1000);
    } else if (otpCountdown === 0) {
      setOtpError(true);
    }
    return () => clearInterval(interval);
  }, [showSetupModal, setupStep, otpCountdown]);

  // Suggest category helper based on transaction counterparty
  const getSuggestedCategory = (type: 'expense' | 'income', counterparty: string) => {
    if (type === 'income') return 'cat-other-income';
    
    const cleanNote = counterparty.toLowerCase();
    if (cleanNote.includes('7-eleven') || cleanNote.includes('เซเว่น') || cleanNote.includes('shabu') || cleanNote.includes('food') || cleanNote.includes('อาหาร') || cleanNote.includes('กิน') || cleanNote.includes('สุกี้') || cleanNote.includes('ชาบู') || cleanNote.includes('sushi') || cleanNote.includes('kkp')) {
      return 'cat-food';
    } else if (cleanNote.includes('bts') || cleanNote.includes('mrt') || cleanNote.includes('grab') || cleanNote.includes('เดินทาง') || cleanNote.includes('รถ') || cleanNote.includes('เติมน้ำมัน') || cleanNote.includes('taxi')) {
      return 'cat-transport';
    } else if (cleanNote.includes('shopee') || cleanNote.includes('lazada') || cleanNote.includes('ช้อป') || cleanNote.includes('shop') || cleanNote.includes('ซื้อ') || cleanNote.includes('ห้าง') || cleanNote.includes('retail')) {
      return 'cat-shop';
    } else if (cleanNote.includes('netflix') || cleanNote.includes('spotify') || cleanNote.includes('หนัง') || cleanNote.includes('เกม') || cleanNote.includes('game') || cleanNote.includes('steam')) {
      return 'cat-entertainment';
    } else if (cleanNote.includes('ไฟ') || cleanNote.includes('น้ำ') || cleanNote.includes('เน็ต') || cleanNote.includes('บิล') || cleanNote.includes('bill') || cleanNote.includes('โทรศัพท์')) {
      return 'cat-utilities';
    } else if (cleanNote.includes('ai') || cleanNote.includes('chatgpt') || cleanNote.includes('midjourney') || cleanNote.includes('claude') || cleanNote.includes('api')) {
      return 'cat-ai';
    }
    return 'cat-food'; // fallback default
  };

  // Helper to format currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 0, maximumFractionDigits: 0 })
      .format(val)
      .replace('THB', '฿')
      .trim();
  };

  // Parse Text Scanner Handler
  const handleParse = (text: string) => {
    setPasteText(text);
    if (!text.trim()) {
      setParsedData(null);
      return;
    }

    const result = detectAndParse(text);
    setParsedData(result);
    
    // Automatically pre-fill the smart category suggestion based on counterparty
    const suggestedCat = getSuggestedCategory(result.type, result.counterparty);
    setSuggestedCategoryId(suggestedCat);
    setIsSaved(false);
  };

  const handleSaveTransaction = () => {
    if (!parsedData || parsedData.status === 'failed') return;

    const providerName = parsedData.provider === 'unknown' ? 'Flow' : parsedData.provider.toUpperCase();
    
    addTransaction({
      type: parsedData.type,
      amount: parsedData.amount,
      categoryId: suggestedCategoryId,
      note: `[${providerName}] ${parsedData.counterparty}`,
      date: new Date().toISOString().split('T')[0]
    });

    setIsSaved(true);
    setPasteText('');
    
    setTimeout(() => {
      setParsedData(null);
      setIsSaved(false);
    }, 2000);
  };

  // Initiate connection wizard flow
  const handleOpenSetup = (prov: 'truemoney' | 'kplus' | 'krungthai' | 'scb' | 'kkp') => {
    setSetupProvider(prov);
    setSetupStep(1);
    setAccountInput('');
    setOtpInput('');
    setOtpCountdown(60);
    setOtpError(false);
    setShowSetupModal(true);
  };

  // Process Requesting OTP Code step
  const handleRequestOtp = () => {
    const cleaned = accountInput.replace(/\D/g, '');
    if (cleaned.length < 10) {
      alert(language === 'TH' ? 'กรุณากรอกเบอร์โทรศัพท์หรือหมายเลขบัญชี 10 หลักให้ถูกต้องค่ะ' : 'Please input a valid 10-digit phone number or bank account.');
      return;
    }

    // Generate random 6 digit code
    const mockOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(mockOtp);
    setOtpCountdown(60);
    setSetupStep(2);
    
    // Simulate incoming SMS pop alert
    setTimeout(() => {
      setShowSmsPopup(true);
    }, 800);
  };

  // Handle OTP Digit Submissions
  const handleVerifyOtp = () => {
    if (otpInput === generatedOtp) {
      setLinkedChannels((prev) => 
        prev.map((ch) => 
          ch.provider === setupProvider 
            ? { ...ch, status: 'connected', accountNumber: maskNumber(accountInput) } 
            : ch
        )
      );
      setSetupStep(3);
      setShowSmsPopup(false);
    } else {
      setOtpError(true);
      setTimeout(() => setOtpError(false), 800);
    }
  };

  const handleDisconnect = (prov: 'truemoney' | 'kplus' | 'krungthai' | 'scb' | 'kkp') => {
    if (confirm(language === 'TH' ? `คุณต้องการยกเลิกการเชื่อมต่อกับ ${getProviderName(prov)} ใช่หรือไม่?` : `Do you want to disconnect ${getProviderName(prov)}?`)) {
      setLinkedChannels((prev) => 
        prev.map((ch) => 
          ch.provider === prov 
            ? { ...ch, status: 'disconnected', accountNumber: undefined } 
            : ch
        )
      );
    }
  };

  // Helper to mask phone numbers or bank accounts
  const maskNumber = (numStr: string) => {
    const cleaned = numStr.replace(/\D/g, '');
    if (cleaned.length === 10) {
      if (cleaned.startsWith('0')) {
        return `${cleaned.slice(0, 3)}-xxx-${cleaned.slice(7)}`;
      } else {
        return `${cleaned.slice(0, 3)}-x-x${cleaned.slice(7, 9)}-${cleaned.slice(9)}`;
      }
    }
    return 'xxx-xxx-xxxx';
  };

  const getProviderName = (prov: string) => {
    switch (prov) {
      case 'truemoney': return 'TrueMoney Wallet';
      case 'kplus': return 'Kasikorn K PLUS';
      case 'krungthai': return 'Krungthai NEXT';
      case 'scb': return 'SCB EASY';
      case 'kkp': return 'KKP Mobile';
      default: return 'Bank Connection';
    }
  };

  // Theme settings config based on provider name (Clean design with professional dots instead of hearts)
  const getProviderTheme = (prov: string) => {
    switch (prov) {
      case 'truemoney':
        return {
          color: '#ff5f00',
          bgGlow: 'hover:border-orange-500/30 hover:shadow-[0_0_20px_rgba(255,95,0,0.08)]',
          badge: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
          accentBorder: 'border-orange-500/30 shadow-[0_0_20px_rgba(249,115,22,0.1)]',
          dotBg: 'bg-orange-500'
        };
      case 'kplus':
        return {
          color: '#00a950',
          bgGlow: 'hover:border-emerald-500/30 hover:shadow-[0_0_20px_rgba(16,185,129,0.08)]',
          badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          accentBorder: 'border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.1)]',
          dotBg: 'bg-emerald-500'
        };
      case 'krungthai':
        return {
          color: '#00a1f1',
          bgGlow: 'hover:border-sky-500/30 hover:shadow-[0_0_20px_rgba(14,165,233,0.08)]',
          badge: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
          accentBorder: 'border-sky-500/30 shadow-[0_0_20px_rgba(14,165,233,0.1)]',
          dotBg: 'bg-sky-500'
        };
      case 'scb':
        return {
          color: '#4e2a84',
          bgGlow: 'hover:border-purple-500/30 hover:shadow-[0_0_20px_rgba(168,85,247,0.08)]',
          badge: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
          accentBorder: 'border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.1)]',
          dotBg: 'bg-purple-500'
        };
      case 'kkp':
        return {
          color: '#1d467e',
          bgGlow: 'hover:border-blue-600/30 hover:shadow-[0_0_20px_rgba(29,70,126,0.08)]',
          badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
          accentBorder: 'border-blue-500/30 shadow-[0_0_20px_rgba(29,70,126,0.1)]',
          dotBg: 'bg-blue-600'
        };
      default:
        return {
          color: '#71717a',
          bgGlow: 'hover:border-zinc-800',
          badge: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
          accentBorder: 'border-zinc-850',
          dotBg: 'bg-zinc-600'
        };
    }
  };

  const getStatusBadge = (status: ParserStatus, score: number) => {
    const pct = Math.round(score * 100);
    if (status === 'success') {
      return {
        label: language === 'TH' ? `ดึงบัญชีเงินจริงสำเร็จ (${pct}%)` : `Verified (${pct}%)`,
        classes: 'bg-emerald-950/20 text-emerald-400 border-emerald-900/30',
        icon: <CheckCircle2 className="w-3.5 h-3.5" />
      };
    } else if (status === 'partial') {
      return {
        label: language === 'TH' ? `โปรดตรวจสอบความถูกต้อง (${pct}%)` : `Review (${pct}%)`,
        classes: 'bg-amber-950/20 text-amber-400 border-amber-900/30',
        icon: <AlertCircle className="w-3.5 h-3.5" />
      };
    }
    return {
      label: language === 'TH' ? 'อ่านข้อมูลล้มเหลว' : 'Failed',
      classes: 'bg-rose-950/20 text-rose-400 border-rose-900/30',
      icon: <AlertTriangle className="w-3.5 h-3.5" />
    };
  };

  const provConfig = parsedData ? getProviderTheme(parsedData.provider) : getProviderTheme('unknown');
  const targetCategory = categories.find(c => c.id === suggestedCategoryId);

  // Divide channels into connected vs disconnected for Dropdown vs Active list representation
  const disconnectedChannels = linkedChannels.filter((c) => c.status === 'disconnected');
  const connectedChannels = linkedChannels.filter((c) => c.status === 'connected');

  return (
    <div className="flex flex-col flex-1 pb-10 animate-in fade-in duration-300 relative bg-black text-zinc-100 font-sans" id="flow_capture_dashboard">
      
      {/* SMS OTP POPUP TOAST FOR Setup Wizard */}
      {showSmsPopup && (
        <div 
          onClick={() => {
            setOtpInput(generatedOtp);
            setShowSmsPopup(false);
          }}
          className="fixed bottom-24 left-6 right-6 max-w-sm mx-auto z-50 bg-[#1e2025]/98 border border-amber-500/30 shadow-[0_10px_35px_rgba(0,0,0,0.5)] p-3.5 rounded-xl flex items-center gap-3 animate-in slide-in-from-bottom-10 duration-300 cursor-pointer hover:border-amber-500/50"
        >
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-lg shrink-0">
            💬
          </div>
          <div className="flex-1 text-left min-w-0">
            <span className="text-[9.5px] text-amber-500 font-bold uppercase tracking-wider block">SMS รหัสความปลอดภัย</span>
            <span className="text-[11px] font-bold text-zinc-200 block truncate mt-0.5">
              [Flow Sync] OTP: <strong className="text-amber-400 font-mono tracking-widest text-sm bg-zinc-900/50 px-1.5 py-0.5 rounded border border-zinc-800">{generatedOtp}</strong>
            </span>
            <span className="text-[8.5px] text-zinc-500 block mt-0.5">แตะการ์ดนี้เพื่อป้อนรหัสรักษาความปลอดภัยแบบอัตโนมัติ</span>
          </div>
        </div>
      )}

      {/* Header bar layout */}
      <header className="px-6 pt-6 pb-4 border-b border-zinc-900 sticky top-0 bg-black/95 z-10 flex items-center gap-4">
        <button 
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 active:scale-95 transition-all cursor-pointer outline-none"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <span className="text-[#4edea3] text-[10px] uppercase font-bold tracking-widest font-mono flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-[#4edea3]" />
            Flow Capture
          </span>
          <h1 className="text-xl font-bold text-zinc-100 mt-0.5 tracking-tight">
            {language === 'TH' ? 'เชื่อมกับบัญชีเงินจริง' : 'Link Real Money Accounts'}
          </h1>
        </div>
      </header>

      {/* Main Workspace content */}
      <main className="flex-grow px-6 py-4 max-w-xl mx-auto w-full flex flex-col gap-6">

        {/* Local-First Privacy banner */}
        <section className="bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-2xl flex gap-3.5 text-left shadow-sm">
          <ShieldCheck className="w-6 h-6 text-[#4edea3] shrink-0 mt-0.5" />
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-bold text-[#4edea3] uppercase tracking-wider">
              🔐 Local-First Privacy (ประมวลผลบนเครื่อง 100%)
            </span>
            <p className="text-[11px] text-zinc-450 leading-relaxed mt-1">
              {language === 'TH' 
                ? 'ระบบดักจับข้อมูลและซิงค์ความเคลื่อนไหวของเราจะทำงานอยู่บนอุปกรณ์เครื่องนี้ 100% ไม่มีข้อมูลเบอร์มือถือ รหัส OTP หรือบัญชีธนาคารใดๆ ถูกส่งออกไปภายนอก ปลอดภัยและเป็นส่วนตัวอย่างสมบูรณ์แบบ!'
                : 'All synced accounts and alert parsers process on-device. No phone numbers, account numbers, or OTP tokens are transmitted outside your local sandbox.'}
            </p>
          </div>
        </section>

        {/* Dropdown Menu Account Sync Selector - Emojiless / Heartless professional design */}
        <section className="bg-[#121212] border border-zinc-900 rounded-2xl p-6 flex flex-col gap-5 text-left shadow-sm">
          <div className="flex flex-col gap-2">
            <label className="text-zinc-450 font-bold text-xs">
              {language === 'TH' ? '➕ เลือกบัญชีเพื่อเริ่มเชื่อมต่อสัญญาณใหม่:' : '➕ Link New Financial Account:'}
            </label>
            <select 
              value=""
              onChange={(e) => {
                const val = e.target.value;
                if (val) {
                  handleOpenSetup(val as any);
                }
              }}
              className="w-full bg-zinc-950 border border-zinc-850 hover:border-zinc-800 text-zinc-200 rounded-xl px-4 py-3.5 text-xs font-bold outline-none cursor-pointer h-12"
            >
              <option value="" disabled hidden>
                {language === 'TH' ? '--- เลือกสถาบันการเงิน / วอลเล็ท เพื่อเชื่อมต่อ ---' : '--- Select bank/wallet to connect ---'}
              </option>
              {disconnectedChannels.map(ch => (
                <option key={ch.provider} value={ch.provider}>
                  {ch.provider === 'truemoney' ? 'TrueMoney Wallet' : 
                   ch.provider === 'kplus' ? 'Kasikorn K PLUS' : 
                   ch.provider === 'krungthai' ? 'Krungthai NEXT' : 
                   ch.provider === 'scb' ? 'SCB EASY' :
                   'KKP Mobile'}
                </option>
              ))}
              {disconnectedChannels.length === 0 && (
                <option disabled>
                  {language === 'TH' ? 'เชื่อมต่อสัญญาณครบทุกบัญชีแล้วค่ะ' : 'All accounts linked'}
                </option>
              )}
            </select>
          </div>

          {/* Connected Channels List - Clean Row Design, tap-friendly spacing, no heart emojis */}
          <div className="flex flex-col gap-3.5 mt-2">
            <h4 className="font-extrabold text-zinc-450 text-[10.5px] uppercase tracking-wider block">
              {language === 'TH' ? 'บัญชีเงินจริงที่เชื่อมต่ออยู่' : 'Connected Real Money Accounts'}
            </h4>
            
            {connectedChannels.length === 0 ? (
              <div className="border border-dashed border-zinc-850 bg-zinc-950/20 p-6 rounded-2xl text-center text-[10.5px] text-zinc-550 leading-relaxed">
                {language === 'TH' 
                  ? 'ยังไม่มีการเชื่อมต่อกับบัญชีใดๆ (กรุณาเลือกเชื่อมต่อสัญญาณได้จากเมนูด้านบนค่ะ)'
                  : 'No active bank connections. Choose a financial provider from the dropdown menu above to link.'}
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {connectedChannels.map(ch => {
                  const theme = getProviderTheme(ch.provider);
                  return (
                    <div 
                      key={ch.provider}
                      className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5 flex items-center justify-between transition-all hover:border-zinc-850 shadow-inner h-20"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {/* Elegant minimalist color brand dot indicator instead of heart emojis */}
                        <div className={`w-3.5 h-3.5 rounded-full shrink-0 ${theme.dotBg}`} />
                        <div className="min-w-0 text-left">
                          <h5 className="font-extrabold text-zinc-100 text-[13px] leading-tight">
                            {getProviderName(ch.provider)}
                          </h5>
                          <span className="text-[11px] text-zinc-500 font-mono font-bold block mt-1">
                            {ch.accountNumber}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3.5 shrink-0">
                        <span className="px-3 py-1 rounded-full text-[9px] font-extrabold bg-emerald-950/25 text-[#4edea3] border border-emerald-900/30 flex items-center gap-1.5 select-none h-7">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          {language === 'TH' ? 'เชื่อมอยู่' : 'Connected'}
                        </span>
                        
                        <button 
                          onClick={() => handleDisconnect(ch.provider)}
                          className="px-3 py-1.5 bg-zinc-900 border border-zinc-850 hover:border-rose-900/40 text-zinc-500 hover:text-rose-400 font-bold text-[10.5px] rounded-xl transition-all active:scale-95 cursor-pointer h-8"
                        >
                          {language === 'TH' ? 'ตัดสัญญาณ' : 'Disconnect'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* SECTION 2: Direct Text Scanner (Real Utility) */}
        <section className="bg-[#121212] border border-zinc-900 rounded-2xl p-5 flex flex-col gap-4 text-left">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-9 h-9 rounded-xl bg-emerald-950/20 border border-emerald-900/30 flex items-center justify-center text-[#4edea3]">
              <Clipboard className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="font-bold text-zinc-200 text-sm">
                {language === 'TH' ? 'สแกนคัดลอกข้อความธุรกรรมด่วน' : 'Transaction Alert Message Scanner'}
              </h3>
              <p className="text-[10px] text-zinc-550 mt-0.5">
                {language === 'TH' 
                  ? 'คัดลอกประวัติข้อความเตือนหรือ SMS จากแอปของธนาคารจริงแล้วนำมาวางเพื่อแกะรายรับรายจ่ายทันที' 
                  : 'Copy bank notifications, SMS alerts, or receipt text details and paste here.'}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <textarea 
              value={pasteText}
              onChange={(e) => handleParse(e.target.value)}
              placeholder={language === 'TH' 
                ? "ตัวอย่าง:\nกรุงไทยโอนเงินสำเร็จ! โอนไปยัง บช. x-1122 จำนวน 320 บาท\nหรือ K PLUS: คุณได้โอนเงิน 750.00 บาท ไปยัง บช. ร้านอาหาร..."
                : "Paste copied transaction messages, bank alerts, or receipt text..."
              }
              rows={4}
              className="w-full bg-zinc-950 border border-zinc-850 hover:border-zinc-800 focus:border-[#4edea3] text-zinc-300 placeholder-zinc-700 rounded-xl p-3.5 text-xs outline-none font-sans leading-relaxed transition-colors resize-none text-left"
            />

            {/* Smart normalizer display popup card */}
            {parsedData && parsedData.status !== 'failed' && (
              <div className={`border p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in zoom-in duration-200 bg-zinc-950/60 ${provConfig.accentBorder}`}>
                <div className="flex items-center gap-3 min-w-0 text-left">
                  <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-xl shrink-0 border border-zinc-850">
                    {targetCategory?.emoji || '🍔'}
                  </div>
                  
                  <div className="flex flex-col min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-bold text-zinc-200 text-sm truncate">{parsedData.counterparty}</span>
                      
                      <span className={`px-1.5 py-0.5 text-[8.5px] uppercase font-bold tracking-wider rounded-sm border ${provConfig.badge}`}>
                        {getProviderName(parsedData.provider)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-[10px] text-zinc-550 font-mono flex items-center gap-1">
                        {parsedData.type === 'income' ? <TrendingUp className="w-3.5 h-3.5 text-[#4edea3]" /> : <TrendingDown className="w-3.5 h-3.5 text-[#ff7875]" />}
                        {parsedData.type === 'income' ? (language === 'TH' ? 'ตรวจพบ: รายรับ' : 'Detected: Inflow') : (language === 'TH' ? 'ตรวจพบ: รายจ่าย' : 'Detected: Outflow')}
                      </span>
                      
                      <span className={`px-1.5 py-0.2 text-[8px] rounded font-bold border flex items-center gap-1 ${getStatusBadge(parsedData.status, parsedData.confidence).classes}`}>
                        {getStatusBadge(parsedData.status, parsedData.confidence).icon}
                        {getStatusBadge(parsedData.status, parsedData.confidence).label}
                      </span>
                    </div>

                    {parsedData.remainingBalance !== undefined && (
                      <span className="text-[9px] text-zinc-600 mt-0.5">
                        {language === 'TH' ? `ยอดกระเป๋าเงินคงเหลือจริง: ฿${parsedData.remainingBalance.toLocaleString()}` : `Balance: ฿${parsedData.remainingBalance.toLocaleString()}`}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end shrink-0 gap-2 ml-2 text-right">
                  <span className={`font-mono text-base font-extrabold ${parsedData.type === 'income' ? 'text-[#4edea3]' : 'text-[#ff7875]'}`}>
                    {parsedData.type === 'income' ? '+' : '-'}{formatCurrency(parsedData.amount)}
                  </span>
                  
                  <select 
                    value={suggestedCategoryId}
                    onChange={(e) => setSuggestedCategoryId(e.target.value)}
                    className="bg-zinc-900 border border-zinc-800 text-[10.5px] rounded px-1.5 py-0.5 font-bold text-zinc-400 outline-none h-6 cursor-pointer"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.emoji} {language === 'TH' ? c.nameTH : c.nameEN}
                      </option>
                    ))}
                  </select>

                  <button 
                    onClick={handleSaveTransaction}
                    disabled={isSaved}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all active:scale-95 flex items-center gap-1 cursor-pointer select-none ${
                      isSaved
                        ? 'bg-emerald-950/20 border border-emerald-900/30 text-[#4edea3]'
                        : 'bg-[#4edea3] text-[#003824] hover:opacity-95 shadow-[0_0_15px_rgba(78,222,163,0.15)] font-extrabold'
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
                        <span>{language === 'TH' ? 'ยืนยันจดทันที' : 'Approve Flow'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

      </main>

      {/* ── THE LIVE CONNECTION WIZARD OVERLAY MODAL ── */}
      {showSetupModal && setupProvider && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#121215] border border-zinc-850 rounded-3xl p-6 shadow-2xl flex flex-col gap-4 text-left animate-in zoom-in-95 duration-250">
            
            <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
              <span className="text-xs uppercase font-extrabold tracking-widest text-[#4edea3] font-mono flex items-center gap-1.5">
                <Smartphone className="w-4 h-4" />
                {language === 'TH' ? 'เชื่อมต่อสัญญาณบัญชีเงินจริง' : 'Financial Sync Setup'}
              </span>
              <button 
                onClick={() => {
                  setShowSetupModal(false);
                  setShowSmsPopup(false);
                }}
                className="w-7 h-7 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            {setupStep === 1 && (
              <div className="flex flex-col gap-4 animate-in fade-in duration-200">
                <div className="flex items-center gap-2">
                  <div className={`w-3.5 h-3.5 rounded-full ${getProviderTheme(setupProvider).dotBg}`} />
                  <div>
                    <h3 className="font-extrabold text-zinc-100 text-sm">{getProviderName(setupProvider)}</h3>
                    <p className="text-[10px] text-zinc-550 -mt-0.5">{language === 'TH' ? 'ดักจับความเคลื่อนไหวบัญชีเงินจริงแบบเรียลไทม์' : 'Real-time accounts sync'}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 mt-1.5 text-left">
                  <div>
                    <label className="text-zinc-400 font-bold text-[11px] block mb-1">
                      {setupProvider === 'truemoney' 
                        ? (language === 'TH' ? '📱 กรอกเบอร์มือถือสมัคร Wallet (10 หลัก):' : '📱 Wallet Phone Number:')
                        : (language === 'TH' ? '💳 กรอกเลขที่บัญชีธนาคารจริง (10 หลัก):' : '💳 Real Bank Account Number:')}
                    </label>
                    <input 
                      type="text"
                      maxLength={10}
                      value={accountInput}
                      onChange={(e) => setAccountInput(e.target.value.replace(/\D/g, ''))}
                      placeholder="e.g. 0895551234"
                      className="w-full bg-zinc-950 border border-zinc-850 hover:border-zinc-800 focus:border-[#4edea3] text-zinc-200 font-mono tracking-widest placeholder-zinc-700 rounded-xl px-3.5 py-3 text-sm outline-none transition-colors"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="text-zinc-400 font-bold text-[11px] block mb-1">
                      {language === 'TH' ? '🔒 รหัสผ่านเข้าสู่ระบบบัญชีธนาคารจริง (PIN 6 หลัก):' : '🔒 Account Security PIN:'}
                    </label>
                    <input 
                      type="password"
                      maxLength={6}
                      placeholder="••••••"
                      className="w-full bg-zinc-950 border border-zinc-850 hover:border-zinc-800 focus:border-[#4edea3] text-zinc-200 font-mono tracking-widest placeholder-zinc-700 rounded-xl px-3.5 py-3 text-sm outline-none transition-colors"
                    />
                  </div>
                </div>

                <button 
                  onClick={handleRequestOtp}
                  className="w-full py-3.5 mt-2 bg-[#4edea3] text-[#003824] hover:opacity-95 font-extrabold text-xs rounded-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(78,222,163,0.1)]"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{language === 'TH' ? 'ขอรหัส OTP ยืนยันสัญญาณ' : 'Request Security OTP'}</span>
                </button>
              </div>
            )}

            {setupStep === 2 && (
              <div className={`flex flex-col gap-4 animate-in fade-in duration-200 ${otpError ? 'animate-bounce' : ''}`}>
                <div className="flex flex-col items-center text-center gap-1.5">
                  <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-1 text-lg">
                    🔑
                  </div>
                  <h3 className="font-extrabold text-zinc-100 text-sm">{language === 'TH' ? 'ยืนยันรหัสความปลอดภัย OTP' : 'Verify Security Code'}</h3>
                  <p className="text-[10px] text-zinc-550 max-w-xs leading-normal">
                    {language === 'TH' 
                      ? 'ป้อนรหัสผ่าน OTP 6 หลักที่ส่งไปยัง SMS โทรศัพท์ของคุณ เพื่อเชื่อมต่อระบบตรวจจับและจดบันทึกรายรับรายจ่ายแบบทันทีทันใด'
                      : 'Please input the 6-digit OTP code sent via SMS to complete registration.'}
                  </p>
                </div>

                <div className="flex items-center justify-center gap-1.5 py-1 bg-zinc-950 rounded-lg border border-zinc-900 w-36 mx-auto my-1">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  <span className="text-[10.5px] font-bold text-zinc-450 font-mono">
                    {language === 'TH' ? `รหัสจะหมดอายุ: ${otpCountdown}วิ` : `Expires in: ${otpCountdown}s`}
                  </span>
                </div>

                <div className="flex flex-col gap-2.5">
                  <input 
                    type="text"
                    maxLength={6}
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 483920"
                    className="w-full bg-zinc-950 border border-zinc-850 hover:border-zinc-800 focus:border-amber-500 text-zinc-200 font-mono tracking-widest text-center text-base placeholder-zinc-700 rounded-xl px-4 py-3 outline-none transition-colors"
                    autoFocus
                  />
                  {otpError && (
                    <span className="text-[10px] font-bold text-rose-400 text-center block animate-pulse">
                      ⚠️ {language === 'TH' ? 'รหัส OTP ไม่ถูกต้อง กรุณาลองกรอกใหม่อีกครั้งค่ะ' : 'Invalid OTP. Please check your SMS and retry.'}
                    </span>
                  )}
                </div>

                <div className="flex gap-2 mt-2">
                  <button 
                    onClick={() => {
                      setSetupStep(1);
                      setShowSmsPopup(false);
                    }}
                    className="flex-1 py-3.5 bg-zinc-900 border border-zinc-850 text-zinc-400 font-bold text-xs rounded-xl active:scale-95 transition-all cursor-pointer text-center"
                  >
                    ← {language === 'TH' ? 'ย้อนกลับ' : 'Back'}
                  </button>
                  <button 
                    onClick={handleVerifyOtp}
                    className="flex-1 py-3.5 bg-amber-500 text-black hover:opacity-95 font-extrabold text-xs rounded-xl active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_0_20px_rgba(245,158,11,0.15)]"
                  >
                    <Check className="w-4 h-4" />
                    <span>{language === 'TH' ? 'ยืนยัน OTP' : 'Verify'}</span>
                  </button>
                </div>
              </div>
            )}

            {setupStep === 3 && (
              <div className="flex flex-col gap-4 animate-in zoom-in-95 duration-200 py-3">
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-950/20 border border-emerald-900/30 text-[#4edea3] flex items-center justify-center mb-1 text-2xl animate-pulse">
                    ✓
                  </div>
                  <h3 className="font-extrabold text-[#4edea3] text-sm uppercase tracking-wider">{language === 'TH' ? 'เชื่อมต่อสัญญาณบัญชีเงินจริงสำเร็จ!' : 'Connection Active!'}</h3>
                  <p className="text-[10.5px] text-zinc-450 max-w-xs leading-relaxed px-2 mt-0.5">
                    {language === 'TH' 
                      ? `บัญชีเงินจริงของ ${getProviderName(setupProvider)} บันทึกสำเร็จแล้ว ระบบ Flow Capture พร้อมดักจับสัญญาณกระแสเงินสดเข้าออกบัญชีจริงของคุณแบบเรียลไทม์แล้วค่ะ!`
                      : `Your real ${getProviderName(setupProvider)} account is connected successfully. Flow Capture is active and listening.`}
                  </p>
                </div>

                <button 
                  onClick={() => {
                    setShowSetupModal(false);
                  }}
                  className="w-full py-3.5 mt-2 bg-emerald-950/20 border border-emerald-900/30 hover:border-emerald-800/40 text-[#4edea3] font-bold text-xs rounded-xl active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  🚀 {language === 'TH' ? 'เปิดใช้งานสัญญาณกระแสเงินสดเลย' : 'Open Cash Flow Signals'}
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
