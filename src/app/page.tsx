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
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 0, maximumFractionDigits: 0 })
      .format(val)
      .replace('THB', '฿')
      .trim();
  };  return (
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
          {formatCurrency(totalFlow)}
        </h1>

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
            className="group bg-[#121212] border border-zinc-900 rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center h-[130px] sm:h-[150px] aspect-auto hover:bg-zinc-900/80 hover:border-zinc-800 transition-all active:scale-[0.97]"
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
            className="group bg-[#121212] border border-zinc-900 rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center h-[130px] sm:h-[150px] aspect-auto hover:bg-zinc-900/80 hover:border-zinc-800 transition-all active:scale-[0.97]"
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
            className="group bg-[#121212] border border-zinc-900 rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center h-[130px] sm:h-[150px] aspect-auto hover:bg-zinc-900/80 hover:border-zinc-800 transition-all active:scale-[0.97]"
          >
            <div className="w-12 h-12 rounded-xl bg-yellow-950/20 border border-yellow-900/30 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Gift className="w-5.5 h-5.5 text-amber-400" />
            </div>
            <span className="font-bold text-zinc-100 text-sm sm:text-base tracking-tight">
              {language === 'TH' ? 'เงินก้อน' : 'Lump Sum'}
            </span>
          </button>

          {/* Card 4: Today's Summary / Latest Activity Dynamic Card */}
          {hasActivityToday ? (
            <button 
              id="menu_today_summary_btn"
              onClick={() => onNavigate('transactions')}
              className="group bg-[#121212] border border-zinc-900 rounded-2xl p-4 sm:p-5 flex flex-col items-start justify-between h-[130px] sm:h-[150px] aspect-auto hover:bg-zinc-900/80 hover:border-zinc-800 transition-all active:scale-[0.97] text-left w-full cursor-pointer"
            >
              <span className="font-bold text-zinc-100 text-sm sm:text-base tracking-tight leading-tight mb-1">
                {language === 'TH' ? 'สรุปวันนี้' : 'Today\'s Total'}
              </span>
              <div className="w-full flex flex-col gap-1 sm:gap-1.5 mt-auto">
                <div className="flex justify-between items-center w-full">
                  <span className="text-[11px] font-semibold text-zinc-400">{language === 'TH' ? 'รายรับ' : 'Income'}</span>
                  <span className="text-xs sm:text-sm font-bold font-mono text-[#4edea3]">+{formatCurrency(todayIncome)}</span>
                </div>
                <div className="flex justify-between items-center w-full">
                  <span className="text-[11px] font-semibold text-zinc-400">{language === 'TH' ? 'รายจ่าย' : 'Spent'}</span>
                  <span className="text-xs sm:text-sm font-bold font-mono text-[#ff7875]">-{formatCurrency(todayExpense)}</span>
                </div>
              </div>
            </button>
          ) : latestTx ? (
            <button 
              id="menu_today_summary_btn"
              onClick={() => onNavigate('transactions')}
              className="group bg-[#121212] border border-zinc-900 rounded-2xl p-4 sm:p-5 flex flex-col items-start justify-between h-[130px] sm:h-[150px] aspect-auto hover:bg-zinc-900/80 hover:border-zinc-800 transition-all active:scale-[0.97] text-left w-full cursor-pointer"
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
                    <p className={`text-[14px] sm:text-[15px] font-extrabold font-mono mt-0.5 ${isExpense ? 'text-[#ff7875]' : 'text-[#4edea3]'}`}>
                      {isExpense ? '-' : '+'}{formatCurrency(latestTx.amount)}
                    </p>
                  </div>
                );
              })()}
            </button>
          ) : (
            <button 
              id="menu_today_summary_btn"
              onClick={() => onOpenAddTransaction('expense')}
              className="group bg-[#121212] border border-zinc-900 rounded-2xl p-4 sm:p-5 flex flex-col items-start justify-between h-[130px] sm:h-[150px] aspect-auto hover:bg-zinc-900/80 hover:border-zinc-800 transition-all active:scale-[0.97] text-left w-full cursor-pointer"
            >
              <span className="font-bold text-zinc-100 text-sm sm:text-base tracking-tight leading-tight">
                {language === 'TH' ? 'สรุปวันนี้' : 'Today\'s Total'}
              </span>
              <div className="w-full flex flex-col gap-1 mt-auto">
                <span className="text-[10px] sm:text-[11px] text-[#4edea3] font-bold leading-normal">
                  {language === 'TH' ? '💡 แตะเริ่มบันทึกรายการแรก!' : '💡 Tap to record first!'}
                </span>
              </div>
            </button>
          )}

          {/* Card 5: Monthly Summary (Reports and Charts) */}
          <button 
            id="menu_reports_btn"
            onClick={() => onNavigate('reports')}
            className="group bg-[#121212] border border-zinc-900 rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center h-[130px] sm:h-[150px] aspect-auto hover:bg-zinc-900/80 hover:border-zinc-800 transition-all active:scale-[0.97]"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-950/20 border border-blue-900/30 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <PieChart className="w-5.5 h-5.5 text-blue-400" />
            </div>
            <span className="font-bold text-zinc-100 text-sm sm:text-base tracking-tight text-center leading-tight">
              {language === 'TH' ? 'สรุปรายเดือน' : 'Monthly Summary'}
            </span>
          </button>

          {/* Card 6: Goals and Budget */}
          <button 
            id="menu_goals_btn"
            onClick={() => onNavigate('goals')}
            className="group bg-[#121212] border border-zinc-900 rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center h-[130px] sm:h-[150px] aspect-auto hover:bg-zinc-900/80 hover:border-zinc-800 transition-all active:scale-[0.97]"
          >
            <div className="w-12 h-12 rounded-xl bg-purple-950/10 border border-purple-900/30 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Target className="w-5.5 h-5.5 text-purple-400" />
            </div>
            <span className="font-bold text-zinc-100 text-sm sm:text-base tracking-tight text-center leading-tight">
              {language === 'TH' ? 'เป้าหมายรายเดือน' : 'Goals & Targets'}
            </span>
          </button>

        </div>
      </main>
    </div>
  );
}
