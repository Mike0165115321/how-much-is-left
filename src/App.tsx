import React, { useState } from 'react';
import { useFinanceStore } from './store/useFinanceStore';
import { 
  LayoutGrid, 
  Receipt, 
  BarChart3, 
  X, 
  Edit2, 
  RefreshCw
} from 'lucide-react';

// Import our modular screen files
import Dashboard from './app/page';
import TransactionsPage from './app/transactions/page';
import ReportsPage from './app/reports/page';
import LumpSumsPage from './app/more/lump-sums/page';
import GoalsPage from './app/more/goals/page';
import CategoriesPage from './app/more/categories/page';
import SplashScreen from './components/SplashScreen';
import IOSInstallPrompt from './components/IOSInstallPrompt';

export default function App() {
  const { 
    language, 
    setLanguage, 
    netBalance, 
    transactions, 
    categories, 
    addTransaction,
    resetToDefault,
    goals,
    contributeToGoal,
    enableAmbient,
    setEnableAmbient
  } = useFinanceStore();

  // Navigation Routing States
  // 'dashboard' | 'transactions' | 'reports' | 'more' | 'lump-sums' | 'goals' | 'categories' | 'settings'
  const [currentScreen, setCurrentScreen] = useState<string>('dashboard');

  // Splash screen state
  const [forceSplash, setForceSplash] = useState<boolean>(false);

  // Auto goal allocation states
  const [isAllocating, setIsAllocating] = useState<boolean>(false);
  const [allocatedGoalId, setAllocatedGoalId] = useState<string>('');
  const [allocationPortion, setAllocationPortion] = useState<number>(100);

  // Universal Custom Add Transaction Numpad Modal Overlay States
  const [showAddTxModal, setShowAddTxModal] = useState<boolean>(false);
  const [txModalType, setTxModalType] = useState<'expense' | 'income'>('expense');
  const [txModalAmount, setTxModalAmount] = useState<string>('0');
  const [txModalCategory, setTxModalCategory] = useState<string>('');
  const [txModalNote, setTxModalNote] = useState<string>('');

  // Dynamically derive category suggestions based on actual transactions frequency
  const categorySuggestions = React.useMemo(() => {
    // Get unique categories used in transactions for this type
    const usedCats = transactions
      .filter(tx => tx.type === txModalType)
      .map(tx => {
        const found = categories.find(c => c.id === tx.categoryId);
        return found ? (language === 'TH' ? found.nameTH : found.nameEN) : tx.categoryId;
      })
      .filter(Boolean);

    // Count frequencies
    const freq: { [key: string]: number } = {};
    usedCats.forEach(c => { freq[c] = (freq[c] || 0) + 1; });

    // Sort by frequency descending
    const sortedUsed = Object.keys(freq).sort((a, b) => freq[b] - freq[a]);

    // Starter/default sets for cold starts
    const defaultExpenses = language === 'TH' 
      ? ['อาหาร', 'เดินทาง', 'ช้อปปิ้ง', 'ค่าน้ำค่าไฟ', 'บันเทิง', 'ของใช้']
      : ['Food', 'Transport', 'Shopping', 'Utilities', 'Entertainment', 'General'];
    const defaultIncomes = language === 'TH'
      ? ['เงินเดือน', 'เงินพิเศษ', 'ธุรกิจ', 'โปรเจกต์', 'ลงทุน']
      : ['Salary', 'Bonus', 'Business', 'Project', 'Investment'];

    const starter = txModalType === 'income' ? defaultIncomes : defaultExpenses;

    // Combine and deduplicate
    const combined = Array.from(new Set([...sortedUsed, ...starter]));
    return combined.slice(0, 8); // Display top 8 suggestions
  }, [transactions, txModalType, language, categories]);

  // Handle Bottom Navigation tab changes
  const handleTabChange = (tab: string) => {
    setCurrentScreen(tab);
  };

  // Helper to trigger and initialize the Add Transaction keyboard
  const openAddTransaction = (initialType: 'expense' | 'income') => {
    setTxModalType(initialType);
    setTxModalAmount('0');
    // Set first matching category as default starting state
    const defaultCat = initialType === 'income' 
      ? (language === 'TH' ? 'เงินเดือน' : 'Salary') 
      : (language === 'TH' ? 'อาหาร' : 'Food');
    setTxModalCategory(defaultCat);
    setTxModalNote('');
    
    // Initialize goal allocation states
    setIsAllocating(false);
    if (goals.length > 0) {
      setAllocatedGoalId(goals[0].id);
    } else {
      setAllocatedGoalId('');
    }
    setAllocationPortion(100);

    setShowAddTxModal(true);
  };

  // Numpad input key trigger sequence
  const handleNumpadPress = (val: string) => {
    if (val === '.') {
      // Prevent double decimal separators
      if (txModalAmount.includes('.')) return;
      setTxModalAmount(prev => prev + '.');
    } else {
      setTxModalAmount(prev => {
        if (prev === '0') return val;
        // visual cap length to avoid clipping
        if (prev.length >= 8) return prev;
        return prev + val;
      });
    }
  };

  // Delete typed backspace
  const handleNumpadDelete = () => {
    setTxModalAmount(prev => {
      if (prev.length <= 1) return '0';
      return prev.slice(0, -1);
    });
  };

  // Keyboard support: Handle real-time amount typing inside the modal
  const handleModalAmountChange = (val: string) => {
    const cleanVal = val.replace(/[^0-9.]/g, '');
    const parts = cleanVal.split('.');
    if (parts.length > 2) return;
    
    let finalVal = parts[0];
    if (parts.length === 2) {
      finalVal = `${finalVal}.${parts[1].slice(0, 2)}`;
    }
    
    if (finalVal === '') {
      setTxModalAmount('0');
    } else {
      setTxModalAmount(finalVal);
    }
  };

  // Format currency helper for select option text
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 0, maximumFractionDigits: 0 })
      .format(val)
      .replace('THB', '฿')
      .trim();
  };

    // Save transaction to Zustand persistent store
  const handleSaveTransaction = () => {
    const finalAmount = parseFloat(txModalAmount);
    if (isNaN(finalAmount) || finalAmount <= 0) {
      alert(language === 'TH' ? 'กรุณาระบุจำนวนเงินมากกว่า 0 ค่ะ' : 'Please input a valid amount greater than ฿0');
      return;
    }

    // Capture date dynamically as ISO string (Local YYYY-MM-DD format)
    const localDateStr = new Date().toISOString().split('T')[0];

    // Log the base Income/Expense transaction
    addTransaction({
      type: txModalType,
      amount: finalAmount,
      categoryId: txModalCategory.trim() || (language === 'TH' ? 'อื่นๆ' : 'Other'),
      note: txModalNote.trim(),
      date: localDateStr
    });

    // Auto goal allocation if enabled for Income
    if (txModalType === 'income' && isAllocating && allocatedGoalId) {
      const contributionAmt = (finalAmount * allocationPortion) / 100;
      if (contributionAmt > 0) {
        contributeToGoal(allocatedGoalId, contributionAmt);
      }
    }

    // Close and reset modal elements
    setShowAddTxModal(false);
  };

  // Custom Settings Screen
  const renderSettingsScreen = () => {
    return (
      <div className="flex flex-col flex-1 pb-10 px-6 py-8 animate-in fade-in duration-300" id="settings_screen">
        <header className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => setCurrentScreen('dashboard')}
            className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 active:scale-95 transition-all cursor-pointer font-bold outline-none"
          >
            ←
          </button>
          <div>
            <span className="text-zinc-500 text-[10px] uppercase tracking-widest font-mono">
              {language === 'TH' ? 'ตั้งค่าแอปพลิเคชัน' : 'App Configuration'}
            </span>
            <h1 className="text-2xl font-bold text-zinc-100 mt-1 tracking-tight">
              {language === 'TH' ? 'การตั้งค่า' : 'Settings'}
            </h1>
          </div>
        </header>

        <main className="flex flex-col gap-6 flex-grow">
          {/* Card 1: Language preference */}
          <div className="bg-[#121212] border border-zinc-900 rounded-2xl p-5 flex flex-col gap-3 shadow-sm hover:border-zinc-850 transition-all">
            <h3 className="font-bold text-zinc-200 text-sm flex items-center gap-2">
              🌐 {language === 'TH' ? 'ภาษาหลัก / Language' : 'Preferred Language'}
            </h3>
            <p className="text-xs text-zinc-500 leading-normal">
              {language === 'TH' ? 'เลือกแสดงผลข้อมูลแอปพลิเคชันเป็นภาษาไทยหรือภาษาอังกฤษ' : 'Choose application default layout display text languages.'}
            </p>
            <div className="flex gap-2.5 bg-zinc-950 p-[3px] rounded-xl border border-zinc-900 mt-1">
              <button 
                onClick={() => setLanguage('TH')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  language === 'TH' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                ภาษาไทย (TH)
              </button>
              <button 
                onClick={() => setLanguage('EN')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  language === 'EN' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                English (EN)
              </button>
            </div>
          </div>

          {/* Card 2: Micro-interactions & Intro (SPLASH SCREEN DEMO!) */}
          <div className="bg-[#121212] border border-zinc-900 rounded-2xl p-5 flex flex-col gap-3 shadow-sm hover:border-zinc-850 transition-all">
            <h3 className="font-bold text-zinc-200 text-sm flex items-center gap-2">
              ✨ {language === 'TH' ? 'อนิเมชั่นและเอฟเฟกต์' : 'Visuals & Motion'}
            </h3>
            <p className="text-xs text-zinc-500 leading-normal">
              {language === 'TH' ? 'สัมผัสความพรีเมียมของระบบแอนิเมชันเปิดตัวแอปพลิเคชันเวอร์ชันเต็มรูปแบบ' : 'Experience high fidelity transitions and premium introductory welcome flows.'}
            </p>
            <button 
              onClick={() => {
                setForceSplash(true);
                setCurrentScreen('dashboard');
              }}
              className="mt-1 w-full py-3 bg-[#4edea3]/10 border border-[#4edea3]/25 hover:border-[#4edea3]/45 text-[#4edea3] hover:bg-[#4edea3]/15 font-bold rounded-xl text-xs transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wide"
            >
              🎬 {language === 'TH' ? 'เล่นอนิเมชั่นต้อนรับอีกครั้ง' : 'Replay Intro Welcome'}
            </button>

            {/* Ambient Toggle Switch */}
            <div className="flex items-center justify-between border-t border-zinc-900/60 pt-4 mt-2 select-none" id="ambient_effects_toggle_row">
              <div className="flex flex-col gap-0.5 text-left">
                <span className="text-xs font-bold text-zinc-300">
                  {language === 'TH' ? '🌌 แสงไฟพื้นหลังเคลื่อนไหว' : '🌌 Ambient Backdrop Motion'}
                </span>
                <span className="text-[10.5px] text-zinc-550 leading-tight max-w-[280px]">
                  {language === 'TH' ? 'เปิดเอฟเฟกต์สีฟุ้งเคลื่อนไหวด้านหลัง (ปิดเพื่อประหยัดแบตเตอรี่และสลับหน้าเร็วขึ้น)' : 'Show fluid glowing animations behind pages (disable for battery savings & maximum speed)'}
                </span>
              </div>
              <button
                type="button"
                id="ambient_toggle_switch_btn"
                onClick={() => setEnableAmbient(!enableAmbient)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
                  enableAmbient ? 'bg-[#4edea3]' : 'bg-zinc-800'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-black shadow ring-0 transition duration-200 ease-in-out ${
                    enableAmbient ? 'translate-x-5 bg-zinc-950' : 'translate-x-0 bg-zinc-400'
                  }`}
                />
              </button>
            </div>
          </div>

        </main>
      </div>
    );
  };

  // Render proper screen by routing key
  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'dashboard':
        return (
          <Dashboard 
            onNavigate={(scName) => setCurrentScreen(scName)}
            onOpenAddTransaction={openAddTransaction}
          />
        );
      case 'transactions':
        return <TransactionsPage />;
      case 'reports':
        return <ReportsPage />;
      case 'lump-sums':
        return <LumpSumsPage />;
      case 'goals':
        return <GoalsPage />;
      case 'categories':
        return <CategoriesPage />;
      case 'settings':
        return renderSettingsScreen();

      default:
        return <div className="text-zinc-500 p-10 text-center">404 - Screen Not Found</div>;
    }
  };

  const getModalAmountFormatted = () => {
    if (txModalAmount === '0') return '0';
    const parts = txModalAmount.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join('.');
  };

  return (
    <div className="min-h-screen text-zinc-100 flex flex-col relative max-w-xl mx-auto border-x border-zinc-950/60 shadow-2xl bg-black overflow-hidden">
      <SplashScreen forcePlay={forceSplash} onComplete={() => setForceSplash(false)} />
      <IOSInstallPrompt />
      
      {/* 🌌 living ambient floating backdrops */}
      {enableAmbient && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0" id="ambient_background_blobs">
          <div className="absolute top-[15%] left-[-25%] w-[320px] h-[320px] rounded-full bg-emerald-500/6 blur-[85px] ambient-blob-1" />
          <div className="absolute bottom-[20%] right-[-25%] w-[380px] h-[380px] rounded-full bg-purple-500/4 blur-[95px] ambient-blob-2" />
          <div className="absolute top-[55%] right-[-15%] w-[260px] h-[260px] rounded-full bg-blue-500/4 blur-[80px] ambient-blob-1" style={{ animationDelay: '-6s' }} />
        </div>
      )}
      
      {/* Screen view target mounts */}
      <div className="flex-1 flex flex-col pb-26 overflow-x-hidden z-10 relative pt-safe">
        <div key={currentScreen} className="flex-1 flex flex-col animate-screen-mount">
          {renderCurrentScreen()}
        </div>
      </div>

      {/* Bottom high-contrast Navigation Bar representing universal triggers */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-xl mx-auto bg-black border-t border-zinc-900/80 px-6 min-h-20 flex justify-around items-center z-40 pb-safe shadow-[0_-10px_35px_rgba(0,0,0,0.85)]">
        
        {/* Tab 1: Dashboard */}
        <button 
          id="tab_dashboard_btn"
          onClick={() => handleTabChange('dashboard')}
          className={`flex flex-col items-center justify-center flex-1 h-full select-none outline-none group cursor-pointer ${
            currentScreen === 'dashboard' ? 'text-[#4edea3]' : 'text-zinc-550 hover:text-zinc-300'
          }`}
        >
          <LayoutGrid className="w-6 h-6 transition-transform group-active:scale-90" />
          <span className="text-[10px] font-bold tracking-tight mt-1">
            {language === 'TH' ? 'แดชบอร์ด' : 'Dashboard'}
          </span>
        </button>

        {/* Tab 2: Transaction History */}
        <button 
          id="tab_transactions_btn"
          onClick={() => handleTabChange('transactions')}
          className={`flex flex-col items-center justify-center flex-1 h-full select-none outline-none group cursor-pointer ${
            currentScreen === 'transactions' ? 'text-[#4edea3]' : 'text-zinc-550 hover:text-zinc-300'
          }`}
        >
          <Receipt className="w-6 h-6 transition-transform group-active:scale-90" />
          <span className="text-[10px] font-bold tracking-tight mt-1">
            {language === 'TH' ? 'รายการ' : 'Transactions'}
          </span>
        </button>

        {/* Tab 3: Reports & charts */}
        <button 
          id="tab_reports_btn"
          onClick={() => handleTabChange('reports')}
          className={`flex flex-col items-center justify-center flex-1 h-full select-none outline-none group cursor-pointer ${
            currentScreen === 'reports' ? 'text-[#4edea3]' : 'text-zinc-550 hover:text-zinc-300'
          }`}
        >
          <BarChart3 className="w-6 h-6 transition-transform group-active:scale-90" />
          <span className="text-[10px] font-bold tracking-tight mt-1">
            {language === 'TH' ? 'วิเคราะห์' : 'Reports'}
          </span>
        </button>
      </nav>

      {showAddTxModal && (
        <div 
          id="add_tx_modal_overlay"
          className="fixed inset-0 bg-black z-50 flex flex-col max-w-xl mx-auto border-x border-zinc-950 shadow-2xl"
        >
          {/* ── STICKY TOP: close + toggle + amount ── */}
          <div className="shrink-0 px-5 pt-4 pb-3 border-b border-zinc-900 bg-black">
            {/* Row 1: close + toggle */}
            <div className="flex justify-between items-center mb-3">
              <button 
                id="close_tx_modal_btn"
                onClick={() => setShowAddTxModal(false)}
                className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 hover:border-zinc-700 flex items-center justify-center active:scale-95 transition-all cursor-pointer"
              >
                <X className="w-5 h-5 text-zinc-400" />
              </button>

              <div className="bg-zinc-900 p-[3px] rounded-full flex border border-zinc-850 shadow-inner">
                <button 
                  type="button"
                  onClick={() => { setTxModalType('expense'); setTxModalCategory(language === 'TH' ? 'อาหาร' : 'Food'); }}
                  className={`px-6 py-2 rounded-full text-[13px] font-bold transition-all w-28 uppercase ${
                    txModalType === 'expense' ? 'bg-zinc-800 text-[#ff7875] shadow' : 'text-zinc-450 hover:text-zinc-300'
                  }`}
                >
                  {language === 'TH' ? 'รายจ่าย' : 'Expense'}
                </button>
                <button 
                  type="button"
                  onClick={() => { setTxModalType('income'); setTxModalCategory(language === 'TH' ? 'เงินเดือน' : 'Salary'); }}
                  className={`px-6 py-2 rounded-full text-[13px] font-bold transition-all w-28 uppercase ${
                    txModalType === 'income' ? 'bg-zinc-800 text-[#4edea3] shadow' : 'text-zinc-450 hover:text-zinc-300'
                  }`}
                >
                  {language === 'TH' ? 'รายได้' : 'Income'}
                </button>
              </div>

              <div className="w-10 h-10" />
            </div>

            {/* Row 2: Amount — always visible */}
            <div className="flex items-center justify-center font-mono tracking-wider bg-[#121212]/40 border border-zinc-900 rounded-2xl py-2.5 px-4 shadow-inner">
              <span className={`text-2xl font-extrabold mr-1.5 select-none ${
                txModalType === 'expense' ? 'text-[#ff7875]/60' : 'text-[#4edea3]/60'
              }`}>฿</span>
              <input 
                id="tx_modal_amount_input"
                type="text"
                inputMode="decimal"
                value={txModalAmount === '0' ? '' : getModalAmountFormatted()}
                onChange={(e) => handleModalAmountChange(e.target.value)}
                placeholder="0"
                className={`bg-transparent border-none text-4xl font-extrabold tracking-tight text-center outline-none focus:ring-0 w-full min-w-0 ${
                  txModalType === 'expense'
                    ? 'text-[#ff7875] placeholder-[#ff7875]/30'
                    : 'text-[#4edea3] placeholder-[#4edea3]/30'
                }`}
                autoFocus
              />
            </div>
          </div>

          {/* ── SCROLLABLE MIDDLE: category + note + goal ── */}
          <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
            {/* Category Text Input & Auto Suggestions */}
            <div className="flex flex-col gap-1.5 text-left">
              <span className="text-[12.5px] font-bold text-zinc-400 block mb-1 px-1">
                {txModalType === 'income'
                  ? (language === 'TH' ? 'แหล่งที่มาของรายรับ (หมวดหมู่)' : 'Income Category / Source')
                  : (language === 'TH' ? 'ประเภทของรายจ่าย (หมวดหมู่)' : 'Expense Category')}
              </span>
              <div className="relative flex items-center bg-[#121212] border border-zinc-900 hover:border-zinc-850 rounded-xl px-4 py-3.5 transition-all">
                <span className="absolute left-4 text-zinc-555 text-lg pointer-events-none select-none">🏷️</span>
                <input 
                  id="tx_modal_category_input"
                  type="text"
                  value={txModalCategory}
                  onChange={(e) => setTxModalCategory(e.target.value)}
                  placeholder={
                    txModalType === 'income'
                      ? (language === 'TH' ? 'ระบุแหล่งที่มา... (เช่น เงินเดือน, ขายของ)' : 'Enter source... (e.g. Salary, Business)')
                      : (language === 'TH' ? 'ระบุประเภทรายจ่าย... (เช่น อาหาร, ค่าน้ำ, ค่าซ่อมรถ)' : 'Enter category... (e.g. Food, Taxi, Repair)')
                  }
                  className="w-full bg-transparent border-none text-zinc-100 placeholder-zinc-750 outline-none pl-7 text-sm focus:ring-0"
                />
                {txModalCategory && (
                  <button 
                    type="button"
                    onClick={() => setTxModalCategory('')}
                    className="text-zinc-500 hover:text-zinc-300 transition-colors p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Suggestions Grid */}
              <div className="mt-2.5">
                <span className="text-[11px] font-bold text-zinc-550 block mb-2 px-1">
                  {language === 'TH' ? '💡 แนะนำตามที่คุณพิมพ์บ่อย:' : '💡 Frequently Used Suggestions:'}
                </span>
                <div className="grid grid-cols-4 gap-2 px-1">
                  {categorySuggestions.map((sug) => {
                    const isActive = txModalCategory.trim() === sug;
                    return (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => setTxModalCategory(sug)}
                        className={`h-9 px-1 rounded-xl border text-[11.5px] font-bold transition-all duration-150 active:scale-95 cursor-pointer truncate text-center ${
                          isActive
                            ? txModalType === 'income'
                              ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.1)]'
                              : 'bg-rose-950/30 border-rose-500/40 text-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.1)]'
                            : 'bg-zinc-950/40 border-zinc-900/60 text-zinc-500 hover:text-zinc-300 hover:border-zinc-800'
                        }`}
                      >
                        {sug}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Note Input */}
            <div className="flex flex-col gap-1 text-left">
              <span className="text-[12.5px] font-bold text-zinc-400 block mb-1.5 px-1">
                {language === 'TH' ? 'บันทึกช่วยจำ (โน้ตย่อ)' : 'Note / Description'}
              </span>
              <div className="relative flex items-center bg-[#121212] border border-zinc-900 hover:border-zinc-850 rounded-xl px-4 py-3.5">
                <Edit2 className="w-4 h-4 text-zinc-555 absolute left-4 pointer-events-none" />
                <input 
                  id="tx_modal_note_input"
                  type="text"
                  value={txModalNote}
                  onChange={(e) => setTxModalNote(e.target.value)}
                  placeholder={language === 'TH' ? 'ระบุโน้ตช่วยจำ... (เช่น ทานซูชิ, เงินเดือนออก)' : 'What was this transaction for?'}
                  className="w-full bg-transparent border-none text-zinc-100 placeholder-zinc-750 outline-none pl-7 text-sm focus:ring-0"
                />
              </div>
            </div>

            {/* Goal Allocation (income only) */}
            {txModalType === 'income' && goals.length > 0 && (
              <div className="bg-[#121212] border border-zinc-900 rounded-2xl p-4 flex flex-col gap-3 text-left">
                <div className="flex justify-between items-center select-none">
                  <span className="text-[12.5px] font-bold text-zinc-350 flex items-center gap-1.5 select-none">
                    🎯 {language === 'TH' ? 'โอนออมเงินเข้าเป้าหมายโดยตรง?' : 'Allocate to Savings Goal?'}
                  </span>
                  <button 
                    type="button"
                    onClick={() => setIsAllocating(!isAllocating)}
                    className={`px-3 py-1 rounded-full text-[11px] font-extrabold transition-all border cursor-pointer ${
                      isAllocating 
                        ? 'bg-[#4edea3]/10 text-[#4edea3] border-[#4edea3]/30' 
                        : 'bg-zinc-950 border-zinc-850 text-zinc-555'
                    }`}
                  >
                    {isAllocating ? (language === 'TH' ? 'เปิดใช้งาน' : 'Enabled') : (language === 'TH' ? 'ปิดอยู่' : 'Disabled')}
                  </button>
                </div>

                {isAllocating && (
                  <div className="flex flex-col gap-3 animate-in fade-in duration-200">
                    <div className="flex flex-col gap-1">
                      <span className="text-[11.5px] font-bold text-zinc-400 block mb-1.5 text-left">
                        {language === 'TH' ? 'เลือกกองเป้าหมายการออม' : 'Select Goal Pocket'}
                      </span>
                      <select 
                        value={allocatedGoalId}
                        onChange={(e) => setAllocatedGoalId(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-850 rounded-lg py-2 px-3 text-xs text-zinc-200 outline-none focus:border-[#4edea3] font-mono color-scheme-dark h-9"
                      >
                        {goals.map(g => (
                          <option key={g.id} value={g.id}>
                            {g.title} ({language === 'TH' ? 'ขาดอีก' : 'Left:'} {formatCurrency(Math.max(0, g.targetAmount - g.currentAmount))})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setAllocationPortion(100)}
                        className={`flex-1 py-1.5 text-xs font-extrabold rounded-lg border transition-all cursor-pointer ${
                          allocationPortion === 100
                            ? 'bg-zinc-900 border-[#4edea3]/40 text-[#4edea3]'
                            : 'bg-zinc-950 border-zinc-850 text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        {language === 'TH' ? 'โอนทั้งหมด (100%)' : 'All (100%)'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setAllocationPortion(50)}
                        className={`flex-1 py-1.5 text-xs font-extrabold rounded-lg border transition-all cursor-pointer font-mono ${
                          allocationPortion === 50
                            ? 'bg-zinc-900 border-[#4edea3]/40 text-[#4edea3]'
                            : 'bg-zinc-950 border-zinc-850 text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        {language === 'TH' ? 'แบ่งครึ่งหนึ่ง (50%)' : 'Half (50%)'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── FIXED BOTTOM: numpad + save ── */}
          <div className="shrink-0 px-5 pt-3 pb-5 border-t border-zinc-900 bg-black flex flex-col gap-2.5">
            {/* Numpad */}
            <div className="grid grid-cols-3 gap-2 select-none">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                <button
                  key={num}
                  onClick={() => handleNumpadPress(num)}
                  className="h-12 font-mono font-bold text-center text-2xl text-zinc-100 flex items-center justify-center rounded-2xl bg-zinc-950 hover:bg-zinc-900 active:bg-zinc-800 active:scale-95 border border-transparent transition-all cursor-pointer"
                >
                  {num}
                </button>
              ))}
              <button
                onClick={() => handleNumpadPress('.')}
                className="h-12 font-mono font-bold text-center text-3xl text-zinc-100 flex items-center justify-center rounded-2xl bg-zinc-950 hover:bg-zinc-900 active:bg-zinc-800 active:scale-95 transition-all cursor-pointer"
              >
                .
              </button>
              <button
                onClick={() => handleNumpadPress('0')}
                className="h-12 font-mono font-bold text-center text-2xl text-zinc-100 flex items-center justify-center rounded-2xl bg-zinc-950 hover:bg-zinc-900 active:bg-zinc-800 active:scale-95 transition-all cursor-pointer"
              >
                0
              </button>
              <button
                id="numpad_delete_btn"
                onClick={handleNumpadDelete}
                className="h-12 text-[#ff7875] flex items-center justify-center rounded-2xl bg-zinc-950 hover:bg-zinc-900 active:bg-zinc-800 active:scale-95 transition-all cursor-pointer"
              >
                <span className="text-sm font-bold font-mono tracking-wider uppercase">⌫ Delete</span>
              </button>
            </div>

            {/* Save button */}
            <button 
              id="save_transaction_action"
              onClick={handleSaveTransaction}
              className={`w-full font-bold py-4 rounded-xl flex justify-center items-center active:scale-[0.98] transition-all duration-150 cursor-pointer text-md tracking-wide uppercase font-semibold ${
                txModalType === 'expense'
                  ? 'bg-[#ff7875] text-black shadow-[0_0_35px_rgba(255,120,117,0.2)]'
                  : 'bg-[#4edea3] text-[#003824] shadow-[0_0_35px_rgba(78,222,163,0.18)]'
              }`}
            >
              {language === 'TH' ? 'บันทึกรายการธุรกรรม' : 'Save Transaction'}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
