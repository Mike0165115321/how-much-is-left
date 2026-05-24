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
import TrueMoneySyncPage from './app/more/truemoney-sync/page';
import SplashScreen from './components/SplashScreen';

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
    contributeToGoal
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
  const [txModalCategoryId, setTxModalCategoryId] = useState<string>('cat-food');
  const [txModalNote, setTxModalNote] = useState<string>('');

  // Dynamically filter categories for modal based on Income vs Expense type
  const filteredCategoriesForModal = React.useMemo(() => {
    const incomeIds = ['cat-salary', 'cat-bonus', 'cat-investment', 'cat-business', 'cat-other-income', 'cat-project'];
    if (txModalType === 'income') {
      return categories.filter(c => 
        incomeIds.includes(c.id) || 
        c.id.includes('income') || 
        c.id.includes('salary') || 
        c.id.includes('project') || 
        c.nameEN.toLowerCase().includes('income') ||
        c.nameEN.toLowerCase().includes('salary') ||
        c.nameEN.toLowerCase().includes('bonus') ||
        c.nameEN.toLowerCase().includes('investment') ||
        c.nameEN.toLowerCase().includes('business') ||
        c.nameEN.toLowerCase().includes('project') ||
        c.nameTH.includes('รายได้') ||
        c.nameTH.includes('เงินเดือน') ||
        c.nameTH.includes('ลงทุน') ||
        c.nameTH.includes('ธุรกิจ') ||
        c.nameTH.includes('โปรเจกต์') ||
        c.nameTH.includes('โปรเจค')
      );
    } else {
      return categories.filter(c => 
        !incomeIds.includes(c.id) &&
        !c.id.includes('income') &&
        !c.id.includes('salary') &&
        !c.id.includes('project') &&
        !c.nameEN.toLowerCase().includes('income') &&
        !c.nameEN.toLowerCase().includes('salary') &&
        !c.nameEN.toLowerCase().includes('bonus') &&
        !c.nameEN.toLowerCase().includes('investment') &&
        !c.nameEN.toLowerCase().includes('business') &&
        !c.nameEN.toLowerCase().includes('project') &&
        !c.nameTH.includes('รายได้') &&
        !c.nameTH.includes('เงินเดือน') &&
        !c.nameTH.includes('ลงทุน') &&
        !c.nameTH.includes('ธุรกิจ') &&
        !c.nameTH.includes('โปรเจกต์') &&
        !c.nameTH.includes('โปรเจค')
      );
    }
  }, [categories, txModalType]);

  // Handle Bottom Navigation tab changes
  const handleTabChange = (tab: string) => {
    setCurrentScreen(tab);
  };

  // Helper to trigger and initialize the Add Transaction keyboard
  const openAddTransaction = (initialType: 'expense' | 'income') => {
    setTxModalType(initialType);
    setTxModalAmount('0');
    // Set first matching category as default starting state
    const defaultCat = categories.find(c => initialType === 'income' ? c.id === 'cat-salary' : c.id === 'cat-food');
    setTxModalCategoryId(defaultCat?.id || 'cat-food');
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
      categoryId: txModalCategoryId,
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
              className="mt-2 w-full py-3 bg-[#4edea3]/10 border border-[#4edea3]/25 hover:border-[#4edea3]/45 text-[#4edea3] hover:bg-[#4edea3]/15 font-bold rounded-xl text-xs transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wide"
            >
              🎬 {language === 'TH' ? 'เล่นอนิเมชั่นต้อนรับอีกครั้ง' : 'Replay Intro Welcome'}
            </button>
          </div>

          {/* Card 3: Flow Capture Integration */}
          <div className="bg-[#121212] border border-zinc-900 rounded-2xl p-5 flex flex-col gap-3 shadow-sm hover:border-[#4edea3]/30 transition-all">
            <h3 className="font-bold text-[#4edea3] text-sm flex items-center gap-2">
              ⚡ {language === 'TH' ? 'เชื่อมกับบัญชีเงินจริง (Flow Capture)' : 'Real Money Account Sync'}
            </h3>
            <p className="text-xs text-zinc-500 leading-normal">
              {language === 'TH' 
                ? 'ติดตามความเคลื่อนไหวจากข้อความแจ้งเตือน หรือ SMS ของบัญชีธนาคารและกระเป๋าเงินจริงของคุณ (Krungthai NEXT, K PLUS, SCB, TrueMoney, KKP Mobile) แบบออฟไลน์ปลอดภัย 100%' 
                : 'Instantly connect and parse transaction logs from your real bank accounts or SMS alerts (Krungthai, K PLUS, SCB, TrueMoney, KKP Mobile) locally.'}
            </p>
            <button 
              onClick={() => setCurrentScreen('truemoney-sync')}
              className="mt-2 w-full py-3 bg-[#4edea3]/10 border border-[#4edea3]/20 hover:border-[#4edea3]/40 text-[#4edea3] hover:bg-[#4edea3]/15 font-bold rounded-xl text-xs transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wide"
            >
              🔌 {language === 'TH' ? 'เปิดระบบเชื่อมต่อบัญชีเงินจริง' : 'Open Real Account Sync'}
            </button>
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
      case 'truemoney-sync':
        return <TrueMoneySyncPage onBack={() => setCurrentScreen('settings')} />;
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
    <div className="min-h-screen text-zinc-100 flex flex-col relative max-w-xl mx-auto border-x border-zinc-950/60 shadow-2xl bg-black">
      <SplashScreen forcePlay={forceSplash} onComplete={() => setForceSplash(false)} />
      
      {/* Screen view target mounts */}
      <div className="flex-1 flex flex-col pb-26 overflow-x-hidden">
        {renderCurrentScreen()}
      </div>

      {/* Bottom high-contrast Navigation Bar representing universal triggers */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-xl mx-auto bg-black border-t border-zinc-900/80 px-6 h-20 flex justify-around items-center z-40 pb-safe shadow-[0_-10px_35px_rgba(0,0,0,0.85)]">
        
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
                  onClick={() => { setTxModalType('expense'); setTxModalCategoryId('cat-food'); }}
                  className={`px-6 py-2 rounded-full text-[13px] font-bold transition-all w-28 uppercase ${
                    txModalType === 'expense' ? 'bg-zinc-800 text-[#ff7875] shadow' : 'text-zinc-450 hover:text-zinc-300'
                  }`}
                >
                  {language === 'TH' ? 'รายจ่าย' : 'Expense'}
                </button>
                <button 
                  type="button"
                  onClick={() => { setTxModalType('income'); setTxModalCategoryId('cat-salary'); }}
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
            {/* Category Grid */}
            {txModalType === 'income' ? (
              <div className="w-full">
                <span className="text-[12.5px] font-bold text-zinc-400 block mb-2.5 text-left">
                  {language === 'TH' ? 'แหล่งที่มาของรายรับ' : 'Income Source Category'}
                </span>
                <div className="grid grid-cols-2 gap-3">
                  {filteredCategoriesForModal.map((cat) => {
                    const isActive = txModalCategoryId === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setTxModalCategoryId(cat.id)}
                        className={`flex items-center gap-3 py-3 px-4 rounded-xl border transition-all active:scale-95 cursor-pointer h-[58px] w-full ${
                          isActive 
                            ? 'bg-[#121212] border-[#4edea3] shadow-[0_0_15px_rgba(78,222,163,0.2)] scale-[1.02]' 
                            : 'bg-[#121212]/50 border-zinc-900/60 opacity-60 hover:opacity-90 hover:border-zinc-800'
                        }`}
                        type="button"
                      >
                        <span className="text-2xl shrink-0">{cat.emoji}</span>
                        <div className="flex flex-col text-left justify-center min-w-0">
                          <span className="text-[14.5px] font-bold tracking-tight uppercase truncate" style={{ color: isActive ? '#4edea3' : '#e4e4e7' }}>
                            {language === 'TH' ? cat.nameTH : cat.nameEN}
                          </span>
                          <span className="text-[10.5px] text-zinc-500 tracking-wider mt-0.5">
                            {isActive ? (language === 'TH' ? 'เลือกอยู่' : 'SELECTED') : (language === 'TH' ? 'รายรับ' : 'INCOME')}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="w-full">
                <span className="text-[12.5px] font-bold text-zinc-400 block mb-2.5 text-left">
                  {language === 'TH' ? 'ประเภทของรายจ่าย' : 'Expense Category'}
                </span>
                <div className="grid grid-cols-4 gap-2">
                  {filteredCategoriesForModal.map((cat) => {
                    const isActive = txModalCategoryId === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setTxModalCategoryId(cat.id)}
                        className={`flex flex-col items-center justify-center py-3.5 px-1 rounded-xl border transition-all active:scale-95 cursor-pointer h-[88px] ${
                          isActive 
                            ? 'bg-[#121212] border-[#ff7875] shadow-[0_0_15px_rgba(255,120,117,0.25)] scale-[1.03]' 
                            : 'bg-[#121212]/50 border-zinc-900/60 opacity-60 hover:opacity-90 hover:border-zinc-800'
                        }`}
                        type="button"
                      >
                        <span className="text-2xl mb-1">{cat.emoji}</span>
                        <span className="text-[13px] font-bold tracking-tight uppercase truncate max-w-full text-center" style={{ color: isActive ? '#ff7875' : '#a1a1aa' }}>
                          {language === 'TH' ? cat.nameTH : cat.nameEN}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

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
