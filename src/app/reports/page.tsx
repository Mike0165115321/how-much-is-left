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

  // 1. Analyze Core Incomes & Expenses split for the Donut Chart
  const financialStats = useMemo(() => {
    const expenses = transactions.filter((tx) => tx.type === 'expense');
    const incomes = transactions.filter((tx) => tx.type === 'income');
    
    const totalExp = expenses.reduce((sum, tx) => sum + tx.amount, 0);
    const totalInc = incomes.reduce((sum, tx) => sum + tx.amount, 0);
    const netFlow = totalInc - totalExp;
    const combinedTotal = totalInc + totalExp;

    // Group expenses by category
    const groupedExp: { [id: string]: number } = {};
    expenses.forEach((tx) => {
      groupedExp[tx.categoryId] = (groupedExp[tx.categoryId] || 0) + tx.amount;
    });

    // Group incomes by category
    const groupedInc: { [id: string]: number } = {};
    incomes.forEach((tx) => {
      groupedInc[tx.categoryId] = (groupedInc[tx.categoryId] || 0) + tx.amount;
    });

    // Map categories with metadata
    const expenseList = Object.keys(groupedExp).map((catId) => {
      const cat = categories.find((c) => c.id === catId);
      const amount = groupedExp[catId];
      const percentage = totalExp > 0 ? Math.round((amount / totalExp) * 100) : 0;
      return {
        id: catId,
        type: 'expense' as const,
        amount,
        percentage,
        nameEN: cat?.nameEN || 'Other',
        nameTH: cat?.nameTH || 'อื่นๆ',
        emoji: cat?.emoji || '💸',
        color: '#ff7875',
      };
    });

    const incomeList = Object.keys(groupedInc).map((catId) => {
      const cat = categories.find((c) => c.id === catId);
      const amount = groupedInc[catId];
      const percentage = totalInc > 0 ? Math.round((amount / totalInc) * 100) : 0;
      return {
        id: catId,
        type: 'income' as const,
        amount,
        percentage,
        nameEN: cat?.nameEN || 'Other',
        nameTH: cat?.nameTH || 'อื่นๆ',
        emoji: cat?.emoji || '💵',
        color: '#4edea3',
      };
    });

    // Combined list sorted by amount descending
    const breakdown = [...incomeList, ...expenseList].sort((a, b) => b.amount - a.amount);

    return {
      totalExp,
      totalInc,
      netFlow,
      combinedTotal,
      breakdown,
    };
  }, [transactions, categories]);

  // SVG dynamic donut segment stroke rendering helper
  const donutSegments = useMemo(() => {
    const { totalInc, totalExp, combinedTotal } = financialStats;
    if (combinedTotal === 0) return [];
    
    const percentageInc = (totalInc / combinedTotal) * 100;
    const percentageExp = (totalExp / combinedTotal) * 100;

    const segments = [];
    let offset = 0;

    if (percentageInc > 0) {
      segments.push({
        id: 'inc-segment',
        color: '#4edea3',
        percentage: percentageInc,
        strokeDasharray: `${percentageInc} ${100 - percentageInc}`,
        strokeDashoffset: 100 - offset,
      });
      offset += percentageInc;
    }

    if (percentageExp > 0) {
      segments.push({
        id: 'exp-segment',
        color: '#ff7875',
        percentage: percentageExp,
        strokeDasharray: `${percentageExp} ${100 - percentageExp}`,
        strokeDashoffset: 100 - offset,
      });
      offset += percentageExp;
    }

    return segments;
  }, [financialStats]);

  // 2. Dynamic Period Data Aggregation for Bar Chart
  const trendsChartData = useMemo(() => {
    const monthsNameEN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthsNameTH = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    
    const daysNameEN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const daysNameTH = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];

    if (activeTab === 'week') {
      const data = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        
        let income = 0;
        let expense = 0;
        transactions.forEach((tx) => {
          if (tx.date === dateStr) {
            if (tx.type === 'income') {
              income += tx.amount;
            } else {
              expense += tx.amount;
            }
          }
        });

        const dayName = language === 'TH' ? daysNameTH[d.getDay()] : daysNameEN[d.getDay()];
        const dayNum = d.getDate();
        const label = `${dayName} ${dayNum}`;
        
        data.push({ label, income, expense });
      }
      return data;
    }
    
    if (activeTab === 'month') {
      const data = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const year = d.getFullYear();
        const month = d.getMonth();

        let income = 0;
        let expense = 0;
        transactions.forEach((tx) => {
          const parts = tx.date.split('-');
          if (parts.length === 3) {
            const txYear = parseInt(parts[0]);
            const txMonth = parseInt(parts[1]) - 1;
            if (txYear === year && txMonth === month) {
              if (tx.type === 'income') {
                income += tx.amount;
              } else {
                expense += tx.amount;
              }
            }
          }
        });

        const label = language === 'TH' ? monthsNameTH[month] : monthsNameEN[month];
        data.push({ label, income, expense });
      }
      return data;
    }

    if (activeTab === 'year') {
      const data = [];
      const currentYear = new Date().getFullYear();
      for (let i = 4; i >= 0; i--) {
        const year = currentYear - i;

        let income = 0;
        let expense = 0;
        transactions.forEach((tx) => {
          const parts = tx.date.split('-');
          if (parts.length === 3) {
            const txYear = parseInt(parts[0]);
            if (txYear === year) {
              if (tx.type === 'income') {
                income += tx.amount;
              } else {
                expense += tx.amount;
              }
            }
          }
        });

        const label = String(year);
        data.push({ label, income, expense });
      }
      return data;
    }

    // activeTab === 'custom' -> Weeks of current month
    const data = [];
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    
    const weeks = [
      { nameEN: 'W1', nameTH: 'ส.1', start: 1, end: 7 },
      { nameEN: 'W2', nameTH: 'ส.2', start: 8, end: 14 },
      { nameEN: 'W3', nameTH: 'ส.3', start: 15, end: 21 },
      { nameEN: 'W4', nameTH: 'ส.4', start: 22, end: 31 },
    ];

    weeks.forEach((w) => {
      let income = 0;
      let expense = 0;
      
      transactions.forEach((tx) => {
        const parts = tx.date.split('-');
        if (parts.length === 3) {
          const txYear = parseInt(parts[0]);
          const txMonth = parseInt(parts[1]) - 1;
          const txDay = parseInt(parts[2]);
          
          if (txYear === year && txMonth === month && txDay >= w.start && txDay <= w.end) {
            if (tx.type === 'income') {
              income += tx.amount;
            } else {
              expense += tx.amount;
            }
          }
        }
      });

      const label = language === 'TH' ? w.nameTH : w.nameEN;
      data.push({ label, income, expense });
    });
    
    return data;
  }, [transactions, activeTab, language]);

  // Normalize column heights relative to the max transaction value
  const computedChartData = useMemo(() => {
    const maxVal = Math.max(...trendsChartData.map(d => Math.max(d.income, d.expense)));
    return trendsChartData.map(d => {
      const percentageInc = maxVal > 0 ? (d.income / maxVal) * 100 : 0;
      const percentageExp = maxVal > 0 ? (d.expense / maxVal) * 100 : 0;
      return {
        ...d,
        percentageInc: Math.max(d.income > 0 ? 8 : 0, percentageInc),
        percentageExp: Math.max(d.expense > 0 ? 8 : 0, percentageExp),
      };
    });
  }, [trendsChartData]);

  // 3. Highest Financial Category This Month
  const highestCategoryCard = useMemo(() => {
    if (financialStats.breakdown.length === 0) return null;
    return financialStats.breakdown[0]; // Already sorted descending
  }, [financialStats]);

  // Simple slice of last 3 recent transactions
  const recentExpTransactions = useMemo(() => {
    return transactions
      .filter((tx) => tx.type === 'expense')
      .slice(0, 3);
  }, [transactions]);

  return (
    <div className="flex flex-col flex-1 pb-6" id="reports_screen">
      {/* Top Header Filter Segment Tabs */}
      <header className="px-4 py-3 sm:px-6 sm:pt-6 sm:pb-4 sticky top-0 bg-black/90 backdrop-blur-md z-10 border-b border-zinc-900">
        <h1 className="text-xl sm:text-2xl font-bold text-zinc-100 tracking-tight mb-2.5 sm:mb-4">
          {language === 'TH' ? 'วิเคราะห์การเงิน' : 'Analytics'}
        </h1>

        <div className="bg-[#121212] p-[3px] rounded-full flex relative border border-zinc-800">
          <button 
            onClick={() => setActiveTab('week')}
            className={`flex-1 py-1 sm:py-1.5 text-center text-xs font-semibold rounded-full transition-all ${
              activeTab === 'week' 
                ? 'bg-zinc-800 text-[#4edea3] shadow-sm' 
                : 'text-zinc-550 hover:text-zinc-300'
            }`}
          >
            {language === 'TH' ? 'รายสัปดาห์' : 'Week'}
          </button>
          <button 
            onClick={() => setActiveTab('month')}
            className={`flex-1 py-1 sm:py-1.5 text-center text-xs font-semibold rounded-full transition-all ${
              activeTab === 'month' 
                ? 'bg-zinc-800 text-[#4edea3] shadow-sm' 
                : 'text-zinc-550 hover:text-zinc-300'
            }`}
          >
            {language === 'TH' ? 'รายเดือน' : 'Month'}
          </button>
          <button 
            onClick={() => setActiveTab('year')}
            className={`flex-1 py-1 sm:py-1.5 text-center text-xs font-semibold rounded-full transition-all ${
              activeTab === 'year' 
                ? 'bg-zinc-800 text-[#4edea3] shadow-sm' 
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {language === 'TH' ? 'รายปี' : 'Year'}
          </button>
          <button 
            onClick={() => setActiveTab('custom')}
            className={`flex-1 py-1 sm:py-1.5 text-center text-xs font-semibold rounded-full transition-all ${
              activeTab === 'custom' 
                ? 'bg-zinc-800 text-[#4edea3] shadow-sm' 
                : 'text-zinc-550 hover:text-zinc-300'
            }`}
          >
            {language === 'TH' ? 'กำหนดเอง' : 'Custom'}
          </button>
        </div>
      </header>

      {/* Main Stats Scrollable container */}
      <main className="flex-grow px-4 py-2 sm:px-6 sm:py-4 max-w-2xl mx-auto w-full flex flex-col gap-3 sm:gap-6">
        
        {/* SECTION 1: Compact donut + stats row */}
        <section className="bg-[#121212]/30 border border-zinc-900 rounded-2xl p-3 sm:p-5 w-full">
          {/* Row: donut (left) + net/income/expense (right) */}
          <div className="flex items-center gap-3">
            {/* Compact Donut */}
            <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="38" strokeWidth="12" stroke="#1c1c1e" fill="transparent" />
                {donutSegments.map((seg) => (
                  <circle
                    key={seg.id}
                    cx="50" cy="50" r="38"
                    strokeWidth="12"
                    stroke={seg.color}
                    strokeDasharray={seg.strokeDasharray}
                    strokeDashoffset={seg.strokeDashoffset}
                    strokeLinecap="butt"
                    fill="transparent"
                    className="transition-all duration-1000 ease-in-out"
                  />
                ))}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-[8px] uppercase tracking-widest text-zinc-500 font-bold leading-tight">
                  {language === 'TH' ? 'คงเหลือ' : 'Net'}
                </span>
                <span className={`font-mono text-sm font-bold tracking-tight ${
                  financialStats.netFlow >= 0 ? 'text-[#4edea3]' : 'text-[#ff7875]'
                }`}>
                  {financialStats.netFlow >= 0 ? '+' : ''}{formatCurrency(financialStats.netFlow)}
                </span>
              </div>
            </div>

            {/* Stats stack (right side) */}
            <div className="flex-1 flex flex-col gap-2">
              <div className="bg-[#121212] border border-zinc-900 rounded-xl px-3 py-2 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#4edea3]" />
                  <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-500">
                    {language === 'TH' ? 'รายรับ' : 'Income'}
                  </span>
                </div>
                <span className="font-mono text-sm font-bold text-[#4edea3]">
                  {formatCurrency(financialStats.totalInc)}
                </span>
              </div>
              <div className="bg-[#121212] border border-zinc-900 rounded-xl px-3 py-2 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <ArrowDownLeft className="w-3.5 h-3.5 text-[#ff7875]" />
                  <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-500">
                    {language === 'TH' ? 'รายจ่าย' : 'Expense'}
                  </span>
                </div>
                <span className="font-mono text-sm font-bold text-[#ff7875]">
                  {formatCurrency(financialStats.totalExp)}
                </span>
              </div>
            </div>
          </div>

          {/* Category Breakdown — slim progress-bar rows */}
          <div className="w-full flex flex-col gap-1.5 mt-3 pt-3 border-t border-zinc-900">
            <h3 className="text-[11px] font-bold tracking-wide text-zinc-400 uppercase mb-1">
              {language === 'TH' ? 'สัดส่วนหมวดหมู่' : 'Breakdown'}
            </h3>
            {financialStats.breakdown.length === 0 ? (
              <p className="text-xs text-zinc-600 text-center py-2">
                {language === 'TH' ? 'ยังไม่มีข้อมูล' : 'No data yet.'}
              </p>
            ) : (
              financialStats.breakdown.map((item) => (
                <div key={`${item.type}-${item.id}`} className="flex items-center gap-2">
                  <span className="text-base w-6 text-center shrink-0">{item.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <span className="text-[11px] font-semibold text-zinc-300 truncate">
                        {language === 'TH' ? item.nameTH : item.nameEN}
                      </span>
                      <span className={`font-mono text-[11px] font-bold ml-2 shrink-0 ${
                        item.type === 'income' ? 'text-[#4edea3]' : 'text-[#ff7875]'
                      }`}>
                        {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
                      </span>
                    </div>
                    <div className="h-1 rounded-full bg-zinc-900 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${item.percentage}%`,
                          background: item.type === 'income' ? '#4edea3' : '#ff7875',
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-[10px] text-zinc-600 font-mono w-7 text-right shrink-0">
                    {item.percentage}%
                  </span>
                </div>
              ))
            )}
          </div>
        </section>

        {/* SECTION 2: Income vs Expense Grouped Bar Chart */}
        <section className="bg-[#121212] border border-zinc-900 rounded-2xl p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-bold tracking-wide text-zinc-200">
              {language === 'TH' ? 'เปรียบเทียบ รายได้ VS รายจ่าย' : 'Income vs Expense'}
            </h3>
            <span className="px-2.5 py-0.5 rounded bg-zinc-900 text-zinc-500 border border-zinc-800 text-[10px] font-mono font-bold">
              {activeTab === 'week' && (language === 'TH' ? '7 วัน' : '7 Days')}
              {activeTab === 'month' && (language === 'TH' ? '6 เดือน' : '6 Mos')}
              {activeTab === 'year' && (language === 'TH' ? '5 ปี' : '5 Yrs')}
              {activeTab === 'custom' && (language === 'TH' ? 'เดือนนี้' : 'This Month')}
            </span>
          </div>

          {/* Visual Responsive Grid Bar Elements */}
          <div className="flex items-end justify-around h-28 pt-1.5 border-b border-zinc-900">
            {computedChartData.map((data, index) => (
              <div key={index} className="flex flex-col items-center gap-1 flex-1 min-w-0">
                <div className="flex items-end gap-[3px] h-20 w-full justify-center pb-1">
                  
                  {/* Income column (Green accent) */}
                  <div 
                    title={`Income: ${formatCurrency(data.income)}`}
                    className="w-2 bg-[#4edea3] rounded-t-sm transition-all duration-700 hover:opacity-85" 
                    style={{ height: `${data.percentageInc}%` }}
                  />

                  {/* Expense column (Red/Rose accent) */}
                  <div 
                    title={`Expense: ${formatCurrency(data.expense)}`}
                    className="w-2 bg-[#ff7875] rounded-t-sm transition-all duration-700 hover:opacity-85" 
                    style={{ height: `${data.percentageExp}%` }}
                  />

                </div>
                {/* Labels */}
                <span className="text-[10px] font-bold text-zinc-500 font-mono uppercase tracking-wide truncate max-w-full text-center">
                  {data.label}
                </span>
              </div>
            ))}
          </div>

          {/* Color Indicator Legends footer */}
          <div className="flex justify-center gap-6 mt-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#4edea3]" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                {language === 'TH' ? 'รายรับ' : 'Income'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ff7875]" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                {language === 'TH' ? 'รายจ่าย' : 'Expense'}
              </span>
            </div>
          </div>
        </section>

        {/* SECTION 3: Stats Analytics Cards & Highlights */}
        <section className="flex flex-col gap-2.5">
          {highestCategoryCard ? (
            <div className="bg-[#121212] border border-zinc-900 rounded-xl p-4 flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-550">
                  {highestCategoryCard.type === 'income'
                    ? (language === 'TH' ? 'หมวดหมู่แหล่งรายรับหลักของช่วงนี้' : 'Highest Income Source Category')
                    : (language === 'TH' ? 'หมวดหมู่ที่ใช้เงินมากที่สุดของช่วงนี้' : 'Highest Expense Category')}
                </span>
                <div className="flex items-center gap-2.5 mt-2">
                  <span className="text-2xl">{highestCategoryCard.emoji}</span>
                  <span className="font-semibold text-zinc-200">
                    {language === 'TH' ? highestCategoryCard.nameTH : highestCategoryCard.nameEN}
                  </span>
                </div>
              </div>
              <div className="text-right flex flex-col items-end">
                <span className={`font-mono font-bold text-base sm:text-lg ${
                  highestCategoryCard.type === 'income' ? 'text-[#4edea3]' : 'text-[#ff7875]'
                }`}>
                  {highestCategoryCard.type === 'income' ? '+' : '-'}{formatCurrency(highestCategoryCard.amount)}
                </span>
                <span className={`text-[11px] font-bold mt-2 px-2 py-0.5 border rounded-sm font-mono ${
                  highestCategoryCard.type === 'income'
                    ? 'text-[#4edea3] bg-emerald-950/20 border-emerald-900/30'
                    : 'text-[#ff7875] bg-rose-950/20 border-rose-900/30'
                }`}>
                  {highestCategoryCard.type === 'income' ? '+8%' : '-5%'} {language === 'TH' ? 'เทียบเดือนก่อน' : 'vs last mo'}
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-[#121212] border border-zinc-900 rounded-xl p-4 text-center text-sm text-zinc-400">
              {language === 'TH' ? 'ยังไม่มีข้อมูลวิเคราะห์หลักในช่วงนี้' : 'No calculations yet for highest category.'}
            </div>
          )}

          {/* Quick Recent Transactions heading */}
          <div className="flex justify-between items-center mt-2.5 mb-0.5">
            <h3 className="text-sm font-bold tracking-wide text-zinc-400">
              {language === 'TH' ? 'ประวัติรายจ่ายล่าสุด' : 'Recent Expenses'}
            </h3>
          </div>

          {/* Transactions List */}
          <div className="flex flex-col gap-1.5">
            {recentExpTransactions.length === 0 ? (
              <div className="bg-[#121212] border border-zinc-900 rounded-xl p-3 text-center text-xs text-zinc-600">
                {language === 'TH' ? 'ไม่มีประวัติใช้จ่ายใดๆ' : 'No expenses recorded.'}
              </div>
            ) : (
              recentExpTransactions.map((tx) => {
                const catObj = categories.find((c) => c.id === tx.categoryId);
                return (
                  <div 
                    key={tx.id}
                    className="bg-[#121212]/90 border border-zinc-900 hover:border-zinc-850 p-3 rounded-xl flex items-center justify-between"
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
