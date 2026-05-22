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
  Sparkles
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
    transactions 
  } = useFinanceStore();

  // Calculate today's spent total
  const todayStr = new Date().toISOString().split('T')[0];
  const todayExpense = transactions
    .filter(tx => tx.type === 'expense' && tx.date === todayStr)
    .reduce((sum, tx) => sum + tx.amount, 0);

  // Derive target progress
  // Net balance progress relative to monthly target
  const limit = monthlyBudgetGoal;
  const percentage = Math.min(100, Math.max(0, (netBalance / limit) * 100));
  const leftToGoal = Math.max(0, limit - netBalance);

  // Format currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 0, maximumFractionDigits: 0 })
      .format(val)
      .replace('THB', '฿')
      .trim();
  };

  return (
    <div className="flex flex-col flex-1" id="dashboard_screen">
      {/* Top Header Section */}
      <header className="px-6 pt-10 pb-8 flex flex-col items-center justify-center text-center relative">
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
        <span className="text-xs uppercase tracking-widest text-[#4edea3]/60 mb-2 font-mono flex items-center gap-1.5">
          <Sparkles className="w-3 h-3" />
          {language === 'TH' ? 'ความมั่งคั่งสุทธิ' : 'Total Net Worth'}
        </span>

        {/* Glowing Net Balance Display */}
        <h1 
          id="net_balance_display"
          className="text-[#4edea3] font-extrabold text-5xl md:text-6xl tracking-tight mb-2 select-none drop-shadow-[0_0_35px_rgba(78,222,163,0.15)] filter"
        >
          {formatCurrency(netBalance)}
        </h1>

        {/* Circular-style Progress Bar to Monthly Goal */}
        <div className="w-full max-w-xs mx-auto mt-4 flex flex-col items-center">
          <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden mb-2.5 p-[1px] border border-zinc-800/50">
            <div 
              id="dashboard_progress_bar"
              className="h-full bg-gradient-to-r from-[#4edea3] to-emerald-400 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <p className="text-zinc-400 text-xs md:text-sm font-medium tracking-wide">
            {language === 'TH' ? (
              leftToGoal > 0 ? (
                <span>เหลืออีก <strong className="text-[#4edea3]">{formatCurrency(leftToGoal)}</strong> จะถึงเป้าหมายรายเดือน</span>
              ) : (
                <span className="text-[#4edea3]">ยินดีด้วย! บรรลุเป้าหมายทางการเงินของเดือนแล้ว</span>
              )
            ) : (
              leftToGoal > 0 ? (
                <span><strong className="text-[#4edea3]">{formatCurrency(leftToGoal)}</strong> left to reach monthly target</span>
              ) : (
                <span className="text-[#4edea3]">Congrats! Monthly financial target achieved 🎉</span>
              )
            )}
          </p>
        </div>
      </header>

      {/* 6-Grid Menu Layout */}
      <main className="flex-1 px-6 max-w-2xl mx-auto w-full mb-8">
        <div className="grid grid-cols-2 gap-4">
          
          {/* Card 1: Add Expense */}
          <button 
            id="menu_add_expense_btn"
            onClick={() => onOpenAddTransaction('expense')}
            className="group bg-[#121212] border border-zinc-900 rounded-2xl p-5 flex flex-col items-center justify-center aspect-square hover:bg-zinc-900/80 hover:border-zinc-800 transition-all active:scale-[0.97]"
          >
            <div className="w-14 h-14 rounded-2xl bg-rose-950/20 border border-rose-900/30 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <ShoppingCart className="w-7 h-7 text-rose-400" />
            </div>
            <span className="font-semibold text-zinc-100 tracking-tight text-md">
              {language === 'TH' ? '+ รายจ่าย' : '+ Add Expense'}
            </span>
            <span className="text-[10px] text-zinc-500 mt-1 uppercase tracking-wider font-mono">
              Exp
            </span>
          </button>

          {/* Card 2: Add Income */}
          <button 
            id="menu_add_income_btn"
            onClick={() => onOpenAddTransaction('income')}
            className="group bg-[#121212] border border-zinc-900 rounded-2xl p-5 flex flex-col items-center justify-center aspect-square hover:bg-zinc-900/80 hover:border-zinc-800 transition-all active:scale-[0.97]"
          >
            <div className="w-14 h-14 rounded-2xl bg-emerald-950/20 border border-emerald-900/30 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Wallet className="w-7 h-7 text-[#4edea3]" />
            </div>
            <span className="font-semibold text-zinc-100 tracking-tight text-md">
              {language === 'TH' ? '+ รายได้' : '+ Add Income'}
            </span>
            <span className="text-[10px] text-zinc-500 mt-1 uppercase tracking-wider font-mono">
              Inc
            </span>
          </button>

          {/* Card 3: Lump Sum */}
          <button 
            id="menu_lump_sum_btn"
            onClick={() => onNavigate('lump-sums')}
            className="group bg-[#121212] border border-zinc-900 rounded-2xl p-5 flex flex-col items-center justify-center aspect-square hover:bg-zinc-900/80 hover:border-zinc-800 transition-all active:scale-[0.97]"
          >
            <div className="w-14 h-14 rounded-2xl bg-yellow-950/20 border border-yellow-900/30 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Gift className="w-7 h-7 text-amber-400" />
            </div>
            <span className="font-semibold text-zinc-100 tracking-tight text-md">
              {language === 'TH' ? 'เงินก้อน' : 'Lump Sum'}
            </span>
            <span className="text-[10px] text-zinc-500 mt-1 uppercase tracking-wider font-mono">
              Allocation
            </span>
          </button>

          {/* Card 4: Today's Summary */}
          <button 
            id="menu_today_summary_btn"
            onClick={() => onNavigate('transactions')}
            className="group bg-[#121212] border border-zinc-900 rounded-2xl p-6 flex flex-col items-start justify-between aspect-square hover:bg-zinc-900/80 hover:border-zinc-800 transition-all active:scale-[0.97]"
          >
            <span className="font-bold text-zinc-100 text-lg tracking-tight leading-tight">
              {language === 'TH' ? 'สรุปวันนี้' : 'Today\'s Total'}
            </span>
            <div className="w-full flex flex-col gap-1.5 mt-auto">
              <span className="text-sm font-semibold text-zinc-400 group-hover:text-zinc-200 transition-colors">
                {language === 'TH' ? 'วันนี้ใช้ไป' : 'Spent Today'}
              </span>
              <p className="text-xl font-bold font-mono text-rose-400">
                {formatCurrency(todayExpense)}
              </p>
            </div>
          </button>

          {/* Card 5: Monthly Summary (Reports and Charts) */}
          <button 
            id="menu_reports_btn"
            onClick={() => onNavigate('reports')}
            className="group bg-[#121212] border border-zinc-900 rounded-2xl p-5 flex flex-col items-center justify-center aspect-square hover:bg-zinc-900/80 hover:border-zinc-800 transition-all active:scale-[0.97]"
          >
            <div className="w-14 h-14 rounded-2xl bg-blue-950/20 border border-blue-900/30 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <PieChart className="w-7 h-7 text-blue-400" />
            </div>
            <span className="font-semibold text-zinc-100 tracking-tight text-md">
              {language === 'TH' ? 'สรุปรายเดือน' : 'Monthly Summary'}
            </span>
            <span className="text-[10px] text-zinc-500 mt-1 uppercase tracking-wider font-mono">
              Analytics
            </span>
          </button>

          {/* Card 6: Goals and Budget */}
          <button 
            id="menu_goals_btn"
            onClick={() => onNavigate('goals')}
            className="group bg-[#121212] border border-zinc-900 rounded-2xl p-5 flex flex-col items-center justify-center aspect-square hover:bg-zinc-900/80 hover:border-zinc-800 transition-all active:scale-[0.97]"
          >
            <div className="w-14 h-14 rounded-2xl bg-purple-950/10 border border-purple-900/30 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Target className="w-7 h-7 text-purple-400" />
            </div>
            <span className="font-semibold text-zinc-100 tracking-tight text-md text-center leading-tight">
              {language === 'TH' ? 'เป้าหมายรายเดือน' : 'Goals & Targets'}
            </span>
            <span className="text-[10px] text-zinc-500 mt-1 uppercase tracking-wider font-mono">
              Target Tracker
            </span>
          </button>

        </div>
      </main>
    </div>
  );
}
