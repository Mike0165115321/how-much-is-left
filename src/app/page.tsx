import React from 'react';
import { useFinanceStore } from '../store/useFinanceStore';
import { 
  Plus, 
  ShoppingCart, 
  Wallet, 
  Gift, 
  PieChart, 
  Target, 
  TrendingDown, 
  TrendingUp,
  FlameKindling,
  Sparkles,
  Settings
} from 'lucide-react';
import AnimatedNumber from '../components/AnimatedNumber';

interface DashboardProps {
  onNavigate: (screen: string) => void;
  onOpenAddTransaction: (initialType: 'expense' | 'income') => void;
}

export default function Dashboard({ onNavigate, onOpenAddTransaction }: DashboardProps) {
  const { 
    language, 
    setLanguage, 
    netBalance, 
    monthlyBudgetGoal, 
    transactions,
    categories
  } = useFinanceStore();

  // Calculate today's spent total
  const todayStr = new Date().toISOString().split('T')[0];
  const todayExpense = transactions
    .filter(tx => tx.type === 'expense' && tx.date === todayStr)
    .reduce((sum, tx) => sum + tx.amount, 0);

  const todayIncome = transactions
    .filter(tx => tx.type === 'income' && tx.date === todayStr)
    .reduce((sum, tx) => sum + tx.amount, 0);

  // Helper to determine if a transaction is a savings transaction
  const isSavingsTx = React.useCallback((tx: any) => {
    if (!tx) return false;
    return tx.type === 'expense' && 
      (tx.categoryId === 'cat-savings' || 
       tx.categoryId === 'cat-investment' || 
       tx.categoryId.includes('saving') || 
       tx.note.toLowerCase().includes('goal:') || 
       tx.note.toLowerCase().includes('ออม'));
  }, []);

  const todayExpenseOnly = transactions
    .filter(tx => tx.type === 'expense' && tx.date === todayStr && !isSavingsTx(tx))
    .reduce((sum, tx) => sum + tx.amount, 0);

  const todaySavingsOnly = transactions
    .filter(tx => tx.type === 'expense' && tx.date === todayStr && isSavingsTx(tx))
    .reduce((sum, tx) => sum + tx.amount, 0);

  const todayNet = todayIncome - todayExpenseOnly - todaySavingsOnly;

  const hasActivityToday = todayIncome > 0 || todayExpense > 0;
  const latestTx = transactions[0];

  // Calculate overall cash flow volume metrics
  const totalIncome = transactions
    .filter(tx => tx.type === 'income')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalExpenseAll = transactions
    .filter(tx => tx.type === 'expense')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalFlow = totalIncome + totalExpenseAll;
  const averageTransaction = transactions.length > 0 ? totalFlow / transactions.length : 0;
  const flowPercentage = totalFlow > 0 ? (totalIncome / totalFlow) * 100 : 0;


  // Format currency
  const formatCurrency = React.useCallback((val: number) => {
    return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 0, maximumFractionDigits: 0 })
      .format(val)
      .replace('THB', '฿')
      .trim();
  }, []);

  // Living pulse state calculation based on daily budget and savings
  const pulseStatusText = React.useMemo(() => {
    if (!hasActivityToday) {
      return language === 'TH' 
        ? 'แดชบอร์ดพร้อมทำงาน เริ่มบันทึกธุรกรรมวันนี้กันเลย 🚀' 
        : 'System active & safe. Start logging transactions! 🚀';
    }
    const netToday = todayIncome - todayExpense;
    if (netToday > 0) {
      return language === 'TH' 
        ? `ยินดีด้วย! วันนี้ยอดสะสมเป็นบวก +${formatCurrency(netToday)} 📈` 
        : `Congrats! Saving rate is positive +${formatCurrency(netToday)} today 📈`;
    } else if (netToday < 0) {
      return language === 'TH' 
        ? `วันนี้กระแสเงินไหลออก -${formatCurrency(Math.abs(netToday))} ใช้สอยอย่างมีสตินะคะ 💸` 
        : `Outflow registered today -${formatCurrency(Math.abs(netToday))}. Mind your budget! 💸`;
    } else {
      return language === 'TH' 
        ? 'รายรับกับรายจ่ายวันนี้สมดุลกันพอดี ⚖️' 
        : 'Income and expenses are perfectly balanced today ⚖️';
    }
  }, [hasActivityToday, todayIncome, todayExpense, language, formatCurrency]);

  return (
    <div className="flex flex-col flex-1" id="dashboard_screen">
      {/* Top Header Section */}
      <header className="px-4 pt-6 pb-4 sm:px-6 sm:pt-10 sm:pb-8 flex flex-col items-center justify-center text-center relative border-b border-zinc-950/20">
        {/* Settings Button */}
        <button 
          id="dashboard_settings_btn"
          onClick={() => onNavigate('settings')}
          className="absolute top-3.5 left-6 w-8 h-8 rounded-full bg-zinc-900/60 border border-zinc-850 hover:border-zinc-700 flex items-center justify-center active:scale-90 transition-all cursor-pointer outline-none"
          title={language === 'TH' ? 'ตั้งค่า' : 'Settings'}
        >
          <Settings className="w-4 h-4 text-zinc-400" />
        </button>

        {/* Language Switcher Toggle */}
        <div className="absolute top-4 right-6 flex items-center gap-2 text-xs font-semibold tracking-wider font-mono">
          <button 
            id="lang_en_btn"
            onClick={() => setLanguage('EN')}
            className={`cursor-pointer transition-colors hover:text-[#4edea3] ${language === 'EN' ? 'text-[#4edea3]' : 'text-zinc-500'}`}
          >
            EN
          </button>
          <span className="text-zinc-700">|</span>
          <button 
            id="lang_th_btn"
            onClick={() => setLanguage('TH')}
            className={`cursor-pointer transition-colors hover:text-[#4edea3] ${language === 'TH' ? 'text-[#4edea3]' : 'text-zinc-500'}`}
          >
            TH
          </button>
        </div>

        {/* Title Brand (Subtle) */}
        <span className="text-xs uppercase tracking-widest text-[#4edea3]/60 mb-1 font-mono flex items-center gap-1.5">
          <Sparkles className="w-3 h-3" />
          {language === 'TH' ? 'เงินหมุนเวียนสะสมทั้งหมด' : 'Total Money Flow'}
        </span>

        {/* Glowing Total Flow Display */}
        <h1 
          id="net_balance_display"
          className="text-[#4edea3] font-extrabold text-4xl sm:text-5xl md:text-6xl tracking-tight mb-1.5 select-none drop-shadow-[0_0_35px_rgba(78,222,163,0.15)] filter"
        >
          <AnimatedNumber value={totalFlow} formatter={formatCurrency} />
        </h1>

        {/* Dynamic Living pulse indicator */}
        <div className="mt-3.5 mb-2.5 flex items-center gap-2.5 px-4.5 py-2.5 bg-zinc-900/40 border border-zinc-900/60 rounded-full shadow-inner select-none max-w-sm sm:max-w-md mx-auto hover:border-zinc-800 transition-colors">
          <div className="relative flex h-2 w-2 shrink-0">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 pulse-ring-effect"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#4edea3]"></span>
          </div>
          <span className="text-[11.5px] font-bold text-zinc-300 tracking-tight leading-tight select-none">
            {pulseStatusText}
          </span>
        </div>

        {/* Circular-style Progress Bar to Monthly Goal */}
        <div className="w-full max-w-xs mx-auto mt-2.5 sm:mt-4 flex flex-col items-center">
          <div className="w-full h-1.5 sm:h-2 bg-zinc-900 rounded-full overflow-hidden mb-1.5 sm:mb-2.5 p-[1px] border border-zinc-800/50">
            <div 
              id="dashboard_progress_bar"
              className="h-full bg-gradient-to-r from-[#4edea3] to-emerald-400 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${flowPercentage}%` }}
            />
          </div>
          <p className="text-zinc-400 text-xs md:text-sm font-medium tracking-wide">
            {language === 'TH' ? (
              <span>
                รายรับคิดเป็น <strong className="text-[#4edea3]">{Math.round(flowPercentage)}%</strong> ของเงินหมุน (เฉลี่ยรายวัน/รายการ <strong className="text-[#4edea3]">{formatCurrency(averageTransaction)}</strong>)
              </span>
            ) : (
              <span>
                Inflows are <strong className="text-[#4edea3]">{Math.round(flowPercentage)}%</strong> of flow (Avg. <strong className="text-[#4edea3]">{formatCurrency(averageTransaction)}</strong> per transaction)
              </span>
            )}
          </p>
        </div>
      </header>

      {/* 6-Grid Menu Layout */}
      <main className="flex-grow px-4 sm:px-6 max-w-2xl mx-auto w-full mb-4 sm:mb-8">
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          
          {/* Card 1: Add Expense */}
          <button 
            id="menu_add_expense_btn"
            onClick={() => onOpenAddTransaction('expense')}
            className="group bg-[#121212]/80 backdrop-blur-md border border-zinc-900/60 rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center h-[130px] sm:h-[150px] aspect-auto hover:bg-zinc-900/90 hover:border-rose-900/40 hover:shadow-[0_8px_30px_rgba(244,63,94,0.06)] transition-all active:scale-[0.95] cursor-pointer"
          >
            <div className="w-12 h-12 rounded-xl bg-rose-950/20 border border-rose-900/30 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <ShoppingCart className="w-5.5 h-5.5 text-rose-400" />
            </div>
            <span className="font-bold text-zinc-100 text-sm sm:text-base tracking-tight">
              {language === 'TH' ? '+ รายจ่าย' : '+ Add Expense'}
            </span>
          </button>

          {/* Card 2: Add Income */}
          <button 
            id="menu_add_income_btn"
            onClick={() => onOpenAddTransaction('income')}
            className="group bg-[#121212]/80 backdrop-blur-md border border-zinc-900/60 rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center h-[130px] sm:h-[150px] aspect-auto hover:bg-zinc-900/90 hover:border-emerald-900/40 hover:shadow-[0_8px_30px_rgba(78,222,163,0.07)] transition-all active:scale-[0.95] cursor-pointer"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-950/20 border border-emerald-900/30 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Wallet className="w-5.5 h-5.5 text-[#4edea3]" />
            </div>
            <span className="font-bold text-zinc-100 text-sm sm:text-base tracking-tight">
              {language === 'TH' ? '+ รายได้' : '+ Add Income'}
            </span>
          </button>

          {/* Card 3: Lump Sum */}
          <button 
            id="menu_lump_sum_btn"
            onClick={() => onNavigate('lump-sums')}
            className="group bg-[#121212]/80 backdrop-blur-md border border-zinc-900/60 rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center h-[130px] sm:h-[150px] aspect-auto hover:bg-zinc-900/90 hover:border-yellow-900/40 hover:shadow-[0_8px_30px_rgba(245,158,11,0.06)] transition-all active:scale-[0.95] cursor-pointer"
          >
            <div className="w-12 h-12 rounded-xl bg-yellow-950/20 border border-yellow-900/30 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Gift className="w-5.5 h-5.5 text-amber-400" />
            </div>
            <span className="font-bold text-zinc-100 text-sm sm:text-base tracking-tight">
              {language === 'TH' ? 'เงินก้อน' : 'Lump Sum'}
            </span>
          </button>

          {/* Card 4: Manage Savings */}
          <button 
            id="menu_goals_btn"
            onClick={() => onNavigate('goals')}
            className="group bg-[#121212]/80 backdrop-blur-md border border-zinc-900/60 rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center h-[130px] sm:h-[150px] aspect-auto hover:bg-zinc-900/90 hover:border-sky-900/40 hover:shadow-[0_8px_30px_rgba(56,189,248,0.06)] transition-all active:scale-[0.95] cursor-pointer"
          >
            <div className="w-12 h-12 rounded-xl bg-sky-950/10 border border-sky-900/30 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Target className="w-5.5 h-5.5 text-sky-400" />
            </div>
            <span className="font-bold text-zinc-100 text-sm sm:text-base tracking-tight text-center leading-tight">
              {language === 'TH' ? 'จัดการเงินออม' : 'Manage Savings'}
            </span>
          </button>

          {/* Card 5: Today's Summary / Latest Activity Dynamic Card */}
          {hasActivityToday ? (
            <button 
              id="menu_today_summary_btn"
              onClick={() => onNavigate('transactions')}
              className="group bg-[#121212]/80 backdrop-blur-md border border-zinc-900/60 rounded-2xl p-4 sm:p-5 flex flex-col items-start justify-between min-h-[130px] sm:min-h-[150px] h-auto aspect-auto hover:bg-zinc-900/90 hover:border-emerald-900/30 hover:shadow-[0_8px_30px_rgba(78,222,163,0.06)] transition-all active:scale-[0.95] text-left w-full cursor-pointer py-4"
            >
              <span className="font-bold text-zinc-100 text-sm sm:text-base tracking-tight leading-tight mb-2">
                {language === 'TH' ? 'สรุปวันนี้' : 'Today\'s Total'}
              </span>
              <div className="w-full flex flex-col gap-1 sm:gap-1.5 mt-auto">
                <div className="flex justify-between items-center w-full">
                  <span className="text-[11px] font-semibold text-zinc-400">{language === 'TH' ? 'รายรับ' : 'Income'}</span>
                  <span className="text-xs sm:text-sm font-bold font-mono text-[#4edea3]">+{formatCurrency(todayIncome)}</span>
                </div>
                <div className="flex justify-between items-center w-full">
                  <span className="text-[11px] font-semibold text-zinc-400">{language === 'TH' ? 'รายจ่าย' : 'Spent'}</span>
                  <span className="text-xs sm:text-sm font-bold font-mono text-[#ff7875]">-{formatCurrency(todayExpenseOnly)}</span>
                </div>
                <div className="flex justify-between items-center w-full">
                  <span className="text-[11px] font-semibold text-zinc-400">{language === 'TH' ? 'เงินออม' : 'Savings'}</span>
                  <span className="text-xs sm:text-sm font-bold font-mono text-sky-400">-{formatCurrency(todaySavingsOnly)}</span>
                </div>
                <div className="flex justify-between items-center w-full pt-1.5 border-t border-zinc-900/80 mt-0.5">
                  <span className="text-[11px] font-bold text-zinc-300">{language === 'TH' ? 'คงเหลือวันนี้' : 'Remaining Today'}</span>
                  <span className={`text-xs sm:text-sm font-black font-mono ${
                    todayNet > 0 
                      ? 'text-[#4edea3]' 
                      : todayNet < 0 
                        ? 'text-[#ff7875]' 
                        : 'text-zinc-300'
                  }`}>
                    {todayNet > 0 ? '+' : ''}{formatCurrency(todayNet)}
                  </span>
                </div>
              </div>
            </button>
          ) : latestTx ? (
            <button 
              id="menu_today_summary_btn"
              onClick={() => onNavigate('transactions')}
              className="group bg-[#121212]/80 backdrop-blur-md border border-zinc-900/60 rounded-2xl p-4 sm:p-5 flex flex-col items-start justify-between h-[130px] sm:h-[150px] aspect-auto hover:bg-zinc-900/90 hover:border-zinc-800/80 hover:shadow-[0_8px_30px_rgba(255,255,255,0.03)] transition-all active:scale-[0.95] text-left w-full cursor-pointer"
            >
              <span className="font-bold text-zinc-100 text-sm sm:text-base tracking-tight mb-1">
                {language === 'TH' ? 'ธุรกรรมล่าสุด' : 'Latest Activity'}
              </span>
              {(() => {
                const catObj = categories.find(c => c.id === latestTx.categoryId);
                const isExpense = latestTx.type === 'expense';
                return (
                  <div className="w-full flex flex-col gap-0.5 sm:gap-1 mt-auto">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xl shrink-0">{catObj?.emoji || '🍔'}</span>
                      <span className="text-[11px] font-bold text-zinc-300 truncate max-w-[80px]">
                        {latestTx.note || (catObj ? (language === 'TH' ? catObj.nameTH : catObj.nameEN) : 'Transaction')}
                      </span>
                    </div>
                    <p className={`text-[14px] sm:text-[15px] font-extrabold font-mono mt-0.5 ${
                      isSavingsTx(latestTx)
                        ? 'text-sky-400'
                        : isExpense
                          ? 'text-[#ff7875]'
                          : 'text-[#4edea3]'
                    }`}>
                      {latestTx.type === 'income' ? '+' : '-'}{formatCurrency(latestTx.amount)}
                    </p>
                  </div>
                );
              })()}
            </button>
          ) : (
            <div 
              id="menu_today_summary_btn"
              className="group bg-[#121212]/80 backdrop-blur-md border border-zinc-900/60 rounded-2xl p-4 sm:p-5 flex flex-col items-start justify-between h-[130px] sm:h-[150px] aspect-auto hover:bg-zinc-900/90 hover:border-zinc-800/80 hover:shadow-[0_8px_30px_rgba(255,255,255,0.02)] transition-all text-left w-full cursor-default"
            >
              <span className="font-bold text-zinc-100 text-sm sm:text-base tracking-tight leading-tight">
                {language === 'TH' ? 'สรุปวันนี้' : 'Today\'s Total'}
              </span>
              <div className="w-full flex flex-col gap-1 mt-auto">
                <span className="text-[10px] sm:text-[11px] text-[#4edea3]/70 font-semibold leading-normal">
                  {language === 'TH' ? '💡 ยังไม่มีธุรกรรมในวันนี้' : '💡 No transactions today'}
                </span>
              </div>
            </div>
          )}

          {/* Card 6: Monthly Summary (Reports and Charts) */}
          <button 
            id="menu_reports_btn"
            onClick={() => onNavigate('reports')}
            className="group bg-[#121212]/80 backdrop-blur-md border border-zinc-900/60 rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center h-[130px] sm:h-[150px] aspect-auto hover:bg-zinc-900/90 hover:border-blue-900/40 hover:shadow-[0_8px_30px_rgba(59,130,246,0.06)] transition-all active:scale-[0.95] cursor-pointer"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-950/20 border border-blue-900/30 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <PieChart className="w-5.5 h-5.5 text-blue-400" />
            </div>
            <span className="font-bold text-zinc-100 text-sm sm:text-base tracking-tight text-center leading-tight">
              {language === 'TH' ? 'สรุปรายเดือน' : 'Monthly Summary'}
            </span>
          </button>

        </div>
      </main>
    </div>
  );
}
