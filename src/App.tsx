import React, { useState } from 'react';
import { useFinanceStore } from './store/useFinanceStore';
import { 
  LayoutGrid, 
  Receipt, 
  BarChart3, 
  MoreHorizontal, 
  X, 
  Edit2, 
  Gift, 
  Target, 
  FolderPlus, 
  RefreshCw,
  Plus,
  HelpCircle,
  Laptop,
  CheckCircle,
  Lock,
  Sparkles,
  ArrowLeft
} from 'lucide-react';

// Import our modular screen files
import Dashboard from './app/page';
import TransactionsPage from './app/transactions/page';
import ReportsPage from './app/reports/page';
import LumpSumsPage from './app/more/lump-sums/page';
import GoalsPage from './app/more/goals/page';
import CategoriesPage from './app/more/categories/page';

export default function App() {
  const { 
    language, 
    setLanguage, 
    netBalance, 
    transactions, 
    categories, 
    addTransaction,
    resetToDefault
  } = useFinanceStore();

  // Navigation Routing States
  // 'dashboard' | 'transactions' | 'reports' | 'more' | 'lump-sums' | 'goals' | 'categories'
  const [currentScreen, setCurrentScreen] = useState<string>('dashboard');

  // Universal Custom Add Transaction Numpad Modal Overlay States
  const [showAddTxModal, setShowAddTxModal] = useState<boolean>(false);
  const [txModalType, setTxModalType] = useState<'expense' | 'income'>('expense');
  const [txModalAmount, setTxModalAmount] = useState<string>('0');
  const [txModalCategoryId, setTxModalCategoryId] = useState<string>('cat-food');
  const [txModalNote, setTxModalNote] = useState<string>('');

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

  // Save transaction to Zustand persistent store
  const handleSaveTransaction = () => {
    const finalAmount = parseFloat(txModalAmount);
    if (isNaN(finalAmount) || finalAmount <= 0) {
      alert(language === 'TH' ? 'กรุณาระบุจำนวนเงินมากกว่า 0 คระ' : 'Please input a valid amount greater than ฿0');
      return;
    }

    // Capture date dynamically as ISO string (Local YYYY-MM-DD format)
    const localDateStr = new Date().toISOString().split('T')[0];

    addTransaction({
      type: txModalType,
      amount: finalAmount,
      categoryId: txModalCategoryId,
      note: txModalNote.trim(),
      date: localDateStr
    });

    // Close and reset modal elements
    setShowAddTxModal(false);
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
        
      case 'more':
        // Submenu Navigator frame that routes to more targets
        return (
          <div className="flex flex-col flex-1 pb-10" id="more_settings_screen">
            <header className="px-6 pt-6 pb-2 border-b border-zinc-900 sticky top-0 bg-black z-10">
              <span className="text-zinc-500 text-[10px] uppercase tracking-widest font-mono">
                {language === 'TH' ? 'เพิ่มเติม' : 'More Options'}
              </span>
              <h1 className="text-2xl font-bold text-zinc-100 mt-1 tracking-tight">
                {language === 'TH' ? 'หมวดหมู่อื่นๆ' : 'Explore System'}
              </h1>
            </header>

            <main className="px-6 py-4 max-w-xl mx-auto w-full flex flex-col gap-3 mt-2">
              {/* Allocation Lump sums Card link */}
              <button 
                onClick={() => setCurrentScreen('lump-sums')}
                className="bg-[#121212] border border-zinc-900 hover:border-zinc-850 p-5 rounded-2xl flex items-center justify-between group transition-all text-left w-full cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-950/20 border border-amber-900/30 text-amber-500 flex items-center justify-center">
                    <Gift className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-zinc-200 text-sm">{language === 'TH' ? 'ระบบจัดสรรเงินก้อน (Lump Sum)' : 'Lump Sum Allocator'}</span>
                    <span className="text-xs text-zinc-500 mt-0.5">{language === 'TH' ? 'วางแผนกระจายเงินโบนัสเข้าเป้าหมายต่างๆ' : 'Plan and allocate windfall assets'}</span>
                  </div>
                </div>
              </button>

              {/* Financial Goals Card link */}
              <button 
                onClick={() => setCurrentScreen('goals')}
                className="bg-[#121212] border border-zinc-900 hover:border-zinc-850 p-5 rounded-2xl flex items-center justify-between group transition-all text-left w-full cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-950/25 border border-purple-900/30 text-purple-400 flex items-center justify-center">
                    <Target className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-zinc-200 text-sm">{language === 'TH' ? 'เป้าหมายและงบประมาณ' : 'Financial Goals'}</span>
                    <span className="text-xs text-zinc-500 mt-0.5">{language === 'TH' ? 'ออมเงินสะสมสั้นยาวเพื่อสิ่งที่ฝัน' : 'Track saving rates for milestones'}</span>
                  </div>
                </div>
              </button>

              {/* Category manager Card link */}
              <button 
                onClick={() => setCurrentScreen('categories')}
                className="bg-[#121212] border border-zinc-900 hover:border-zinc-850 p-5 rounded-2xl flex items-center justify-between group transition-all text-left w-full cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-cyan-950/20 border border-cyan-900/30 text-[#4edea3] flex items-center justify-center">
                    <FolderPlus className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-zinc-200 text-sm">{language === 'TH' ? 'จัดการหมวดหมู่รายการ' : 'Category Management'}</span>
                    <span className="text-xs text-zinc-500 mt-0.5">{language === 'TH' ? 'ปรับแต่งอีโมจิและชื่อหมวดพืเศษ' : 'Customize emojis and language lists'}</span>
                  </div>
                </div>
              </button>

              {/* Restore Defaults Config row button */}
              <div className="border-t border-zinc-900 pt-6 mt-6">
                <button 
                  onClick={() => {
                    if (confirm(language === 'TH' ? 'คุณแน่ใจหรือไม่ที่จะกู้คืนข้อมูลเริ่มต้นทั้งหมด? การทำงานนี้ไม่สามารถย้อนกลับได้ค่ะ' : 'Are you sure you want to reset all data? This cannot be undone.')) {
                      resetToDefault();
                      setCurrentScreen('dashboard');
                    }
                  }}
                  className="w-full bg-zinc-950/40 hover:bg-rose-950/20 border border-zinc-900 hover:border-rose-900/40 text-zinc-500 hover:text-rose-400 py-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{language === 'TH' ? 'ล้างข้อมูลและกู้คืนเริ่มต้นสำเร็จ' : 'Troubleshoot: Reset to Sample Data'}</span>
                </button>
              </div>
            </main>
          </div>
        );
      default:
        return <div className="text-zinc-500 p-10 text-center">404 - Screen Not Found</div>;
    }
  };

  // Check if viewing secondary screen (for back buttons representation on sub-screens)
  const isSecondaryScreen = ['lump-sums', 'goals', 'categories'].includes(currentScreen);

  // Format modal amount readout nicely
  const getModalAmountFormatted = () => {
    if (txModalAmount === '0') return '0';
    const parts = txModalAmount.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join('.');
  };

  return (
    <div className="min-h-screen text-zinc-100 flex flex-col relative max-w-xl mx-auto border-x border-zinc-950/60 shadow-2xl bg-black">
      
      {/* Top Mobile Bar representing customized context */}
      {isSecondaryScreen && (
        <div className="bg-black py-4.5 px-6 flex items-center justify-start sticky top-0 z-25">
          <button 
            id="back_to_more_btn"
            onClick={() => setCurrentScreen('more')}
            className="flex items-center gap-1.5 text-xs text-[#4edea3] font-bold py-1 px-3 bg-zinc-900 border border-zinc-800 rounded-full hover:border-[#4edea3]/40 active:scale-95 transition-all outline-none"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{language === 'TH' ? 'กลับไปยังหน้าตัวเลือก' : 'Back'}</span>
          </button>
        </div>
      )}

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

        {/* Tab 4: More option routes */}
        <button 
          id="tab_more_btn"
          onClick={() => handleTabChange('more')}
          className={`flex flex-col items-center justify-center flex-1 h-full select-none outline-none group cursor-pointer ${
            ['more', 'lump-sums', 'goals', 'categories'].includes(currentScreen) ? 'text-[#4edea3]' : 'text-zinc-550 hover:text-zinc-300'
          }`}
        >
          <MoreHorizontal className="w-6 h-6 transition-transform group-active:scale-90" />
          <span className="text-[10px] font-bold tracking-tight mt-1">
            {language === 'TH' ? 'เพิ่มเติม' : 'More'}
          </span>
        </button>
      </nav>

      {/* 
         UNIVERSAL ADD TRANSACTION MODEL SECTION (Screen 2: Add Transaction Keypad Modal)
         Avoid using native mobile OS keyboards via custom UI grids containing:
         Segment toggle, large amount screen, scroll horizontal category, remarks, custom numpad.
      */}
      {showAddTxModal && (
        <div 
          id="add_tx_modal_overlay"
          className="fixed inset-0 bg-black z-50 flex flex-col justify-between max-w-xl mx-auto border-x border-zinc-950 p-6 shadow-2xl overflow-y-auto"
        >
          {/* Header Action Row */}
          <header className="flex justify-between items-center h-12 w-full mt-2 shrink-0">
            <button 
              id="close_tx_modal_btn"
              onClick={() => setShowAddTxModal(false)}
              className="w-10 h-10 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-400 rounded-full flex items-center justify-center active:scale-95 transition-all outline-none"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-md font-bold text-zinc-100 tracking-wide uppercase font-mono">
              {language === 'TH' ? 'เพิ่มบันทึกธุรกรรม' : 'Add Transaction'}
            </h2>
            <div className="w-10 h-10" /> {/* Spacer */}
          </header>

          <main className="flex-grow flex flex-col justify-center gap-6 mt-4 pb-2">
            
            {/* Segmented Control Toggle EXPENSE vs INCOME */}
            <div className="flex justify-center shrink-0">
              <div className="bg-zinc-900 p-[3px] rounded-full flex relative border border-zinc-850 shadow-inner">
                <button 
                  onClick={() => setTxModalType('expense')}
                  className={`relative z-10 px-6 py-2 rounded-full text-xs font-bold transition-all w-28 uppercase font-mono ${
                    txModalType === 'expense' ? 'bg-zinc-800 text-rose-450 shadow' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {language === 'TH' ? 'รายจ่าย' : 'Expense'}
                </button>
                <button 
                  onClick={() => setTxModalType('income')}
                  className={`relative z-10 px-6 py-2 rounded-full text-xs font-bold transition-all w-28 uppercase font-mono ${
                    txModalType === 'income' ? 'bg-zinc-800 text-[#4edea3] shadow' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {language === 'TH' ? 'รายได้' : 'Income'}
                </button>
              </div>
            </div>

            {/* Glowing Big Amount display with flashing currency cursor representation */}
            <div className="flex flex-col items-center justify-center py-4 shrink-0 selection:bg-transparent">
              <div className="flex items-center justify-center select-none font-mono tracking-wider">
                <span className="text-3xl font-extrabold text-[#4edea3]/60 mr-2">฿</span>
                <span className="text-5xl font-extrabold text-[#4edea3] tracking-tight truncate max-w-[280px]">
                  {getModalAmountFormatted()}
                </span>
                <span className="text-4xl font-light text-[#4edea3] cursor-blink leading-none ml-1.5">|</span>
              </div>
            </div>

            {/* Horizontal Categorization list slider */}
            <div className="w-full relative shrink-0">
              {/* Fade sliders gradients overlay for beautiful edge transitions */}
              <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
              <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />
              
              <div className="flex overflow-x-auto gap-3.5 px-2 snap-x snap-mandatory no-scrollbar pb-1">
                {categories.map((cat) => {
                  const isActive = txModalCategoryId === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setTxModalCategoryId(cat.id)}
                      className={`flex flex-col items-center justify-center p-4 rounded-xl min-w-[85px] h-[85px] snap-center shrink-0 border transition-all active:scale-95 relative cursor-pointer ${
                        isActive 
                          ? 'bg-zinc-900 border-[#4edea3] shadow-md scale-105' 
                          : 'bg-[#121212] border-transparent opacity-50 hover:opacity-85'
                      }`}
                    >
                      <span className="text-2xl mb-1.5">{cat.emoji}</span>
                      <span className="text-[10px] font-bold tracking-tight uppercase truncate max-w-[70px]" style={{ color: isActive ? '#4edea3' : '#a1a1aa' }}>
                        {language === 'TH' ? cat.nameTH : cat.nameEN}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Remarks / Note input field custom styled wrapper */}
            <div className="shrink-0">
              <div className="relative flex items-center bg-[#121212] border border-zinc-900 hover:border-zinc-850 rounded-xl px-4 py-3.5">
                <Edit2 className="w-5 h-5 text-zinc-550 absolute ml-1 absolute pointer-events-none" />
                <input 
                  id="tx_modal_note_input"
                  type="text"
                  value={txModalNote}
                  onChange={(e) => setTxModalNote(e.target.value)}
                  placeholder={language === 'TH' ? 'วันนี้ทานอะไร? ซื้อเพื่อใคร? (บันทึกช่วยจำ...)' : 'What was this transaction for?'}
                  className="w-full bg-transparent border-none text-zinc-100 placeholder-zinc-700 outline-none pl-9 text-sm focus:ring-0"
                />
              </div>
            </div>

            {/* Custom 3x4 layout numeric keypad containing large touch points */}
            <div className="grid grid-cols-3 gap-2.5 shrink-0 select-none">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                <button
                  key={num}
                  onClick={() => handleNumpadPress(num)}
                  className="h-14 font-mono font-bold text-center text-2xl text-zinc-100 flex items-center justify-center rounded-2xl bg-zinc-950 hover:bg-zinc-900 active:bg-zinc-850 active:scale-95 active:border-zinc-800 border border-transparent transition-all cursor-pointer"
                >
                  {num}
                </button>
              ))}
              {/* Row 4: . , 0 , backspace */}
              <button
                onClick={() => handleNumpadPress('.')}
                className="h-14 font-mono font-bold text-center text-3xl text-zinc-100 flex items-center justify-center rounded-2xl bg-zinc-950 hover:bg-zinc-900 active:bg-zinc-850 active:scale-95 transition-all cursor-pointer"
              >
                .
              </button>
              <button
                onClick={() => handleNumpadPress('0')}
                className="h-14 font-mono font-bold text-center text-2xl text-zinc-100 flex items-center justify-center rounded-2xl bg-zinc-950 hover:bg-zinc-900 active:bg-zinc-850 active:scale-95 transition-all cursor-pointer"
              >
                0
              </button>
              <button
                id="numpad_delete_btn"
                onClick={handleNumpadDelete}
                className="h-14 text-[#ff7875] flex items-center justify-center rounded-2xl bg-zinc-950 hover:bg-zinc-900 active:bg-zinc-850 active:scale-95 transition-all cursor-pointer"
                title="Backspace"
              >
                {/* Visual backspace character representation */}
                <span className="text-sm font-bold font-mono tracking-wider uppercase font-mono">⌫ Delete</span>
              </button>
            </div>

            {/* Save Transaction primary trigger button */}
            <div className="shrink-0 mt-2 pb-safe">
              <button 
                id="save_transaction_action"
                onClick={handleSaveTransaction}
                className="w-full bg-[#4edea3] hover:opacity-95 font-bold text-[#003824] py-4 rounded-xl flex justify-center items-center active:scale-[0.98] transition-all duration-150 shadow-[0_0_35px_rgba(78,222,163,0.18)] cursor-pointer text-md tracking-wide uppercase font-semibold"
              >
                {language === 'TH' ? 'บันทึกรายการธุรกรรม' : 'Save Transaction'}
              </button>
            </div>

          </main>
        </div>
      )}

    </div>
  );
}
