import React, { useState, useMemo } from 'react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ChevronRight,
  TrendingUpIcon,
  HelpCircle,
  Sparkles,
  Utensils,
  ShoppingBag,
  Car,
  Zap,
  Film,
  Wallet,
  Gift,
  Plus
} from 'lucide-react';

export default function ReportsPage() {
  const { 
    language, 
    transactions, 
    categories 
  } = useFinanceStore();

  const [activeTab, setActiveTab] = useState<'week' | 'month' | 'year' | 'custom'>('month');

  // Format currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 0, maximumFractionDigits: 0 })
      .format(val)
      .replace('THB', '฿')
      .trim();
  };

  // 1. Analyze Core Expenses split for the Donut Chart
  const expenseStats = useMemo(() => {
    const expenses = transactions.filter((tx) => tx.type === 'expense');
    const totalExp = expenses.reduce((sum, tx) => sum + tx.amount, 0);

    // Group by categoryId
    const grouped: { [id: string]: number } = {};
    expenses.forEach((tx) => {
      grouped[tx.categoryId] = (grouped[tx.categoryId] || 0) + tx.amount;
    });

    // Map to list with category metadata
    const list = Object.keys(grouped).map((catId) => {
      const cat = categories.find((c) => c.id === catId);
      const amount = grouped[catId];
      const percentage = totalExp > 0 ? Math.round((amount / totalExp) * 100) : 0;
      return {
        id: catId,
        amount,
        percentage,
        nameEN: cat?.nameEN || 'Other',
        nameTH: cat?.nameTH || 'อื่นๆ',
        emoji: cat?.emoji || '🍔',
        color: cat?.color || '#a78bfa',
      };
    }).sort((a, b) => b.amount - a.amount);

    return {
      total: totalExp,
      breakdown: list,
    };
  }, [transactions, categories]);

  // 2. Dual Bar Chart (Fixed structure matching screenshot mock trend, but updated dynamically with actual user parameters if any!)
  // January - June mock trends with actual logs appended if match months!
  const monthlyTrendsChartData = useMemo(() => {
    // Default mock data that aligns perfectly with reports mock image
    const bases = [
      { month: 'Jan', income: 15000, expense: 12000, percentageInc: 40, percentageExp: 60 },
      { month: 'Feb', income: 18000, expense: 9500, percentageInc: 70, percentageExp: 50 },
      { month: 'Mar', income: 24000, expense: 18000, percentageInc: 90, percentageExp: 80 },
      { month: 'Apr', income: 12000, expense: 14200, percentageInc: 45, percentageExp: 55 },
      { month: 'May', income: 20000, expense: 11000, percentageInc: 65, percentageExp: 50 },
      { month: 'Jun', income: 22000, expense: 24500, percentageInc: 80, percentageExp: 95 },
    ];

    // Read current transactions and override matching months
    // Let's make the mock respond to actual logs!
    const currentMonthNum = new Date().getMonth(); // 0 - 11
    const monthsName = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Sum for current month
    let userCurrentMonthIncome = 0;
    let userCurrentMonthExpense = 0;
    
    const nowY = new Date().getFullYear();
    const nowM = new Date().getMonth();
    
    transactions.forEach(tx => {
      const txDate = new Date(tx.date);
      if (txDate.getFullYear() === nowY && txDate.getMonth() === nowM) {
        if (tx.type === 'income') {
          userCurrentMonthIncome += tx.amount;
        } else {
          userCurrentMonthExpense += tx.amount;
        }
      }
    });

    // We can map current month in bases matching mock index
    const labelKey = monthsName[currentMonthNum] || 'Jun';
    const index = bases.findIndex(b => b.month === labelKey);
    if (index !== -1 && (userCurrentMonthIncome > 0 || userCurrentMonthExpense > 0)) {
      bases[index].income = Math.max(bases[index].income, userCurrentMonthIncome);
      bases[index].expense = Math.max(bases[index].expense, userCurrentMonthExpense);
      
      // cap percentage scale for rendering heights cleanly inside 112px
      const maxVal = Math.max(...bases.map(b => Math.max(b.income, b.expense)));
      bases.forEach(b => {
        b.percentageInc = Math.max(10, Math.min(100, (b.income / maxVal) * 100));
        b.percentageExp = Math.max(10, Math.min(100, (b.expense / maxVal) * 100));
      });
    }

    return bases;
  }, [transactions]);

  // 3. Highest Expense Category This Month
  const highestExpenseCard = useMemo(() => {
    if (expenseStats.breakdown.length === 0) return null;
    return expenseStats.breakdown[0]; // Already sorted descending
  }, [expenseStats]);

  // Simple slice of last 3 recent transactions
  const recentExpTransactions = useMemo(() => {
    return transactions
      .filter((tx) => tx.type === 'expense')
      .slice(0, 3);
  }, [transactions]);

  return (
    <div className="flex flex-col flex-1 pb-10" id="reports_screen">
      {/* Top Header Filter Segment Tabs */}
      <header className="px-6 pt-6 pb-4 sticky top-0 bg-black/90 backdrop-blur-md z-10 border-b border-zinc-900">
        <h1 className="text-2xl font-bold text-zinc-100 tracking-tight mb-4">
          {language === 'TH' ? 'วิเคราะห์การเงิน' : 'Analytics'}
        </h1>

        <div className="bg-[#121212] p-[3px] rounded-full flex relative border border-zinc-800">
          <button 
            onClick={() => setActiveTab('week')}
            className={`flex-1 py-1.5 text-center text-xs font-semibold rounded-full transition-all ${
              activeTab === 'week' 
                ? 'bg-zinc-800 text-[#4edea3] shadow-sm' 
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {language === 'TH' ? 'รายสัปดาห์' : 'Week'}
          </button>
          <button 
            onClick={() => setActiveTab('month')}
            className={`flex-1 py-1.5 text-center text-xs font-semibold rounded-full transition-all ${
              activeTab === 'month' 
                ? 'bg-zinc-800 text-[#4edea3] shadow-sm' 
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {language === 'TH' ? 'รายเดือน' : 'Month'}
          </button>
          <button 
            onClick={() => setActiveTab('year')}
            className={`flex-1 py-1.5 text-center text-xs font-semibold rounded-full transition-all ${
              activeTab === 'year' 
                ? 'bg-zinc-800 text-[#4edea3] shadow-sm' 
                : 'text-zinc-400 hover:text-zinc-300'
            }`}
          >
            {language === 'TH' ? 'รายปี' : 'Year'}
          </button>
          <button 
            onClick={() => setActiveTab('custom')}
            className={`flex-1 py-1.5 text-center text-xs font-semibold rounded-full transition-all ${
              activeTab === 'custom' 
                ? 'bg-zinc-800 text-[#4edea3] shadow-sm' 
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {language === 'TH' ? 'กำหนดเอง' : 'Custom'}
          </button>
        </div>
      </header>

      {/* Main Stats Scrollable container */}
      <main className="flex-grow px-6 py-4 max-w-2xl mx-auto w-full flex flex-col gap-8">
        
        {/* SECTION 1: Category Expense Donut Chart representation */}
        <section className="flex flex-col items-center justify-center py-4 bg-[#121212]/30 border border-zinc-900 rounded-2xl p-6">
          <div className="relative w-64 h-64 flex items-center justify-center">
            {/* Elegant, dynamic SVG circle representation for maximum responsive sizing and design accuracy */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="38"
                strokeWidth="10"
                stroke="#1c1c1e"
                fill="transparent"
              />
              {/* Calculate and draw segment strokes dynamically */}
              {expenseStats.breakdown.reduce((accum, item, idx) => {
                const percentage = item.percentage;
                if (percentage === 0) return accum;
                
                const strokeDasharray = `${percentage} ${100 - percentage}`;
                const strokeDashoffset = 100 - accum.offset;
                
                accum.elements.push(
                  <circle
                    key={item.id}
                    cx="50"
                    cy="50"
                    r="38"
                    strokeWidth="10"
                    stroke={item.color}
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="butt"
                    fill="transparent"
                    className="transition-all duration-1000 ease-in-out"
                  />
                );
                
                accum.offset += percentage;
                return accum;
              }, { offset: 0, elements: [] as React.ReactNode[] }).elements}
            </svg>

            {/* Core textual balance indicators */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-[11px] uppercase tracking-widest text-zinc-500 font-bold">
                {language === 'TH' ? 'รายจ่ายรวม' : 'Total Exp.'}
              </span>
              <span className="text-[#4edea3] font-mono text-2xl font-bold tracking-tight mt-1">
                {formatCurrency(expenseStats.total)}
              </span>
            </div>
          </div>

          {/* Dynamic Legends */}
          <div className="flex gap-x-4 gap-y-2 mt-6 w-full justify-center flex-wrap">
            {expenseStats.breakdown.length === 0 ? (
              <span className="text-xs text-zinc-500 font-medium">
                {language === 'TH' ? 'ไม่มีประวัติใช้จ่ายเดือนนี้' : 'No expenses logged yet.'}
              </span>
            ) : (
              expenseStats.breakdown.map((item) => (
                <div key={item.id} className="flex items-center gap-2">
                  <span 
                    className="w-2.5 h-2.5 rounded-full" 
                    style={{ backgroundColor: item.color }} 
                  />
                  <span className="text-xs text-zinc-400 font-medium flex gap-1 items-center">
                    <span>{item.emoji}</span>
                    <span>{language === 'TH' ? item.nameTH : item.nameEN}</span>
                    <strong className="text-zinc-200 font-mono">{item.percentage}%</strong>
                  </span>
                </div>
              ))
            )}
          </div>
        </section>

        {/* SECTION 2: Income vs Expense Grouped Bar Chart */}
        <section className="bg-[#121212] border border-zinc-900 rounded-2xl p-5">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-sm font-bold tracking-wide text-zinc-200">
              {language === 'TH' ? 'เปรียบเทียบ รายได้ VS รายจ่าย' : 'Income vs Expense'}
            </h3>
            <span className="px-2.5 py-0.5 rounded bg-zinc-900 text-zinc-500 border border-zinc-800 text-[10px] font-mono font-bold">
              6 Mos
            </span>
          </div>

          {/* Visual Responsive Grid Bar Elements */}
          <div className="flex items-end justify-between h-32 pt-2 border-b border-zinc-900">
            {monthlyTrendsChartData.map((data, index) => (
              <div key={index} className="flex flex-col items-center gap-1.5 w-[14%]">
                <div className="flex items-end gap-[3px] h-24 w-full justify-center pb-1">
                  
                  {/* Income column (gray background track) */}
                  <div 
                    title={`Income: ${formatCurrency(data.income)}`}
                    className="w-1.5 bg-zinc-800 rounded-t-sm transition-all duration-700 hover:bg-zinc-700" 
                    style={{ height: `${data.percentageInc}%` }}
                  />

                  {/* Expense column (neon colors) */}
                  <div 
                    title={`Expense: ${formatCurrency(data.expense)}`}
                    className="w-1.5 bg-[#4edea3] rounded-t-sm transition-all duration-700 hover:opacity-80" 
                    style={{ height: `${data.percentageExp}%` }}
                  />

                </div>
                {/* Labels */}
                <span className="text-[10px] font-bold text-zinc-500 font-mono uppercase tracking-wide">
                  {data.month}
                </span>
              </div>
            ))}
          </div>

          {/* Color Indicator Legends footer */}
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-zinc-800" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                {language === 'TH' ? 'รายได้' : 'Income'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#4edea3]" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                {language === 'TH' ? 'รายจ่าย' : 'Expense'}
              </span>
            </div>
          </div>
        </section>

        {/* SECTION 3: Stats Analytics Cards & Highlights */}
        <section className="flex flex-col gap-3">
          {highestExpenseCard ? (
            <div className="bg-[#121212] border border-zinc-900 rounded-xl p-5 flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  {language === 'TH' ? 'หมวดหมู่ที่ใช้เงินมากที่สุดเดือนนี้' : 'Highest Expense Category'}
                </span>
                <div className="flex items-center gap-2.5 mt-2">
                  <span className="text-2xl">{highestExpenseCard.emoji}</span>
                  <span className="font-semibold text-zinc-200">
                    {language === 'TH' ? highestExpenseCard.nameTH : highestExpenseCard.nameEN}
                  </span>
                </div>
              </div>
              <div className="text-right flex flex-col items-end">
                <span className="font-mono text-zinc-100 font-bold text-lg">
                  {formatCurrency(highestExpenseCard.amount)}
                </span>
                <span className="text-[11px] font-bold text-[#4edea3] mt-2 px-2 py-0.5 bg-emerald-950/30 border border-emerald-900/40 rounded-sm font-mono">
                  -5% vs last mo
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-[#121212] border border-zinc-900 rounded-xl p-5 text-center text-sm text-zinc-400">
              {language === 'TH' ? 'ยังไม่มีข้อมูลวิเคราะห์คาสูงสุดของเดือนนี้' : 'No calculations yet for highest expense category.'}
            </div>
          )}

          {/* Quick Recent Transactions heading */}
          <div className="flex justify-between items-center mt-4 mb-1">
            <h3 className="text-sm font-bold tracking-wide text-zinc-400">
              {language === 'TH' ? 'ประวัติรายจ่ายล่าสุด' : 'Recent Expenses'}
            </h3>
          </div>

          {/* Transactions List */}
          <div className="flex flex-col gap-2">
            {recentExpTransactions.length === 0 ? (
              <div className="bg-[#121212] border border-zinc-900 rounded-xl p-4 text-center text-xs text-zinc-600">
                {language === 'TH' ? 'ไม่มีประวัติใช้จ่ายใดๆ' : 'No expenses recorded.'}
              </div>
            ) : (
              recentExpTransactions.map((tx) => {
                const catObj = categories.find((c) => c.id === tx.categoryId);
                return (
                  <div 
                    key={tx.id}
                    className="bg-[#121212]/90 border border-zinc-900 hover:border-zinc-850 p-4 rounded-xl flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-9 h-9 rounded-lg bg-zinc-900 flex items-center justify-center text-xl border border-zinc-850">
                        {catObj ? catObj.emoji : '🍔'}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-zinc-200 text-sm">
                          {tx.note || (catObj ? (language === 'TH' ? catObj.nameTH : catObj.nameEN) : 'Transaction')}
                        </span>
                        <span className="text-[11px] text-zinc-500 font-medium">
                          {catObj ? (language === 'TH' ? catObj.nameTH : catObj.nameEN) : 'Other'} • {tx.date}
                        </span>
                      </div>
                    </div>
                    <span className="font-mono text-zinc-300 text-sm font-bold">
                      -{formatCurrency(tx.amount)}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </section>

      </main>
    </div>
  );
}
