import React, { useState, useMemo } from 'react';
import { useFinanceStore, Transaction } from '../../store/useFinanceStore';
import { 
  Search, 
  Trash2, 
  ArrowUpDown, 
  TrendingUp, 
  TrendingDown, 
  HelpCircle,
  Filter,
  X,
  Plus
} from 'lucide-react';

export default function TransactionsPage() {
  const { 
    language, 
    transactions, 
    categories, 
    deleteTransaction,
    language: storeLang
  } = useFinanceStore();

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc');

  // Format date helper
  const formatDateLabel = (dateStr: string) => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    if (dateStr === today) {
      return storeLang === 'TH' ? 'วันนี้' : 'Today';
    } else if (dateStr === yesterday) {
      return storeLang === 'TH' ? 'เมื่อวานนี้' : 'Yesterday';
    }

    const d = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
    return d.toLocaleDateString(storeLang === 'TH' ? 'th-TH' : 'en-US', options);
  };

  // Format currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 0, maximumFractionDigits: 0 })
      .format(val)
      .replace('THB', '฿')
      .trim();
  };

  // Filters & Sorting logic
  const filteredAndSortedTransactions = useMemo(() => {
    return transactions
      .filter((tx) => {
        // Search
        const matchSearch = tx.note.toLowerCase().includes(search.toLowerCase());
        
        // Filter type
        const matchType = filterType === 'all' || tx.type === filterType;
        
        // Filter category
        const matchCategory = selectedCategory === 'all' || tx.categoryId === selectedCategory;
        
        return matchSearch && matchType && matchCategory;
      })
      .sort((a, b) => {
        if (sortBy === 'date-desc') {
          return new Date(b.date).getTime() - new Date(a.date).getTime() || b.id.localeCompare(a.id);
        } else if (sortBy === 'date-asc') {
          return new Date(a.date).getTime() - new Date(b.date).getTime() || a.id.localeCompare(b.id);
        } else if (sortBy === 'amount-desc') {
          return b.amount - a.amount;
        } else if (sortBy === 'amount-asc') {
          return a.amount - b.amount;
        }
        return 0;
      });
  }, [transactions, search, filterType, selectedCategory, sortBy]);

  // Group by Date for standard grouping view
  const groupedTransactions = useMemo(() => {
    if (sortBy === 'amount-asc' || sortBy === 'amount-desc') {
      // Don't group by date if sorting by amount
      return null;
    }

    const groups: { [date: string]: Transaction[] } = {};
    filteredAndSortedTransactions.forEach((tx) => {
      const dateKey = tx.date;
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(tx);
    });
    return groups;
  }, [filteredAndSortedTransactions, sortBy]);

  return (
    <div className="flex flex-col flex-1" id="transactions_screen">
      {/* Search and Sort Section */}
      <header className="px-6 pt-6 pb-4 sticky top-0 bg-black/90 backdrop-blur-md z-10 border-b border-zinc-900">
        <h1 className="text-2xl font-bold text-zinc-100 tracking-tight mb-4">
          {language === 'TH' ? 'ประวัติรายการ' : 'Transactions'}
        </h1>

        <div className="flex flex-col gap-3">
          {/* Search bar inputs */}
          <div className="relative flex items-center bg-[#121212] border border-zinc-800 rounded-xl px-4 py-3">
            <Search className="w-5 h-5 text-zinc-500 absolute pointer-events-none left-4" />
            <input 
              id="tx_search_input"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={language === 'TH' ? 'ค้นหาบันทึก...' : 'Search transactions...'}
              className="w-full bg-transparent border-none text-zinc-100 text-sm pl-8 outline-none focus:ring-0"
            />
            {search && (
              <button 
                onClick={() => setSearch('')}
                className="text-zinc-500 hover:text-zinc-300 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Filters Group */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            <button
              onClick={() => setFilterType('all')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide border transition-all shrink-0 ${
                filterType === 'all' 
                  ? 'bg-zinc-100 border-zinc-100 text-black' 
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {language === 'TH' ? 'ทั้งหมด' : 'All'}
            </button>
            <button
              onClick={() => setFilterType('expense')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide border transition-all shrink-0 ${
                filterType === 'expense' 
                  ? 'bg-rose-950/45 border-rose-900/60 text-rose-400' 
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {language === 'TH' ? 'รายจ่าย' : 'Expenses'}
            </button>
            <button
              onClick={() => setFilterType('income')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide border transition-all shrink-0 ${
                filterType === 'income' 
                  ? 'bg-emerald-950/45 border-emerald-900/60 text-[#4edea3]' 
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {language === 'TH' ? 'รายได้' : 'Income'}
            </button>

            <span className="h-4 w-[1px] bg-zinc-800 mx-1" />

            {/* Sort Toggle Controls */}
            <select
              id="tx_sort_select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs rounded-full px-3 py-1.5 outline-none font-semibold focus:ring-0 cursor-pointer"
            >
              <option value="date-desc">{language === 'TH' ? 'ใหม่สุด' : 'Newest'}</option>
              <option value="date-asc">{language === 'TH' ? 'เก่าสุด' : 'Oldest'}</option>
              <option value="amount-desc">{language === 'TH' ? 'จำนวนสูงสุด' : 'Highest Amount'}</option>
              <option value="amount-asc">{language === 'TH' ? 'จำนวนน้อยสุด' : 'Lowest Amount'}</option>
            </select>
          </div>

          {/* Extended Category Select pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1 rounded-md text-[11px] font-medium transition-all ${
                selectedCategory === 'all'
                  ? 'bg-zinc-800 text-zinc-100 border border-zinc-700'
                  : 'bg-zinc-950/40 text-zinc-500 border border-transparent hover:text-zinc-400'
              }`}
            >
              {language === 'TH' ? 'หมวดหมู่อื่นๆ: ทั้งหมด' : 'Category: All'}
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1 rounded-md text-[11px] font-medium flex items-center gap-1 transition-all border ${
                  selectedCategory === cat.id
                    ? 'bg-zinc-900 text-zinc-100 border-zinc-700'
                    : 'bg-zinc-950/40 text-zinc-500 border-transparent hover:text-zinc-400'
                }`}
                style={{ activeColor: cat.color }}
              >
                <span>{cat.emoji}</span>
                <span>{language === 'TH' ? cat.nameTH : cat.nameEN}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Transactions Scroll View */}
      <main className="flex-1 px-6 py-4 max-w-2xl mx-auto w-full mb-10 overflow-y-auto">
        {filteredAndSortedTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center text-zinc-600 mb-4 border border-zinc-850">
              <HelpCircle className="w-8 h-8" />
            </div>
            <p className="text-zinc-400 font-medium text-sm">
              {language === 'TH' ? 'ไม่มีข้อมูลรายการที่พบคะหน้าฟิลเตอร์นี้' : 'No transactions found.'}
            </p>
            <p className="text-zinc-600 text-xs mt-1">
              {language === 'TH' ? 'ลองทดสอบเพิ่มรายการใหม่ที่หน้าแดชบอร์ดด้านล่าง' : 'Try adding a new transaction on the dashboard!'}
            </p>
          </div>
        ) : groupedTransactions ? (
          /* Render Grouped by Date list */
          <div className="flex flex-col gap-6">
            {Object.keys(groupedTransactions).map((dateKey) => (
              <div key={dateKey} className="flex flex-col gap-2">
                {/* Section Date Heading */}
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#4edea3] bg-zinc-950/80 sticky top-[152px] py-1 border-b border-zinc-900/30 font-mono">
                  {formatDateLabel(dateKey)}
                </h3>

                {/* Date Group Listing */}
                <div className="flex flex-col gap-2">
                  {groupedTransactions[dateKey].map((tx) => {
                    const catObj = categories.find((c) => c.id === tx.categoryId);
                    return (
                      <div 
                        key={tx.id}
                        className="bg-[#121212] border border-zinc-900 hover:border-zinc-850 p-4 rounded-xl flex items-center justify-between group transition-all"
                      >
                        <div className="flex items-center gap-3.5">
                          {/* Emoji category frame */}
                          <div className="w-11 h-11 rounded-xl bg-zinc-900 flex items-center justify-center text-xl border border-zinc-800">
                            {catObj ? catObj.emoji : '💵'}
                          </div>
                          
                          <div className="flex flex-col">
                            <span className="font-semibold text-zinc-200 text-sm leading-tight group-hover:text-zinc-100 transition-colors">
                              {tx.note || (catObj ? (language === 'TH' ? catObj.nameTH : catObj.nameEN) : 'Transaction')}
                            </span>
                            <span className="text-[11px] text-zinc-500 font-medium uppercase tracking-wider mt-1">
                              {catObj ? (language === 'TH' ? catObj.nameTH : catObj.nameEN) : 'Other'}
                            </span>
                          </div>
                        </div>

                        {/* Amount & Delete */}
                        <div className="flex items-center gap-4">
                          <span className={`text-md font-bold font-mono ${tx.type === 'income' ? 'text-[#4edea3]' : 'text-rose-400'}`}>
                            {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                          </span>
                          <button 
                            onClick={() => deleteTransaction(tx.id)}
                            className="text-zinc-650 hover:text-rose-400 p-1.5 rounded-lg hover:bg-zinc-900 active:scale-95 transition-all outline-none"
                            title="Delete transaction"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Render Flat sorting list directly */
          <div className="flex flex-col gap-2">
            {filteredAndSortedTransactions.map((tx) => {
              const catObj = categories.find((c) => c.id === tx.categoryId);
              return (
                <div 
                  key={tx.id}
                  className="bg-[#121212] border border-zinc-900 p-4 rounded-xl flex items-center justify-between group transition-all"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-zinc-900 flex items-center justify-center text-xl border border-zinc-800">
                      {catObj ? catObj.emoji : '💵'}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-zinc-200 text-sm leading-tight">
                        {tx.note || (catObj ? (language === 'TH' ? catObj.nameTH : catObj.nameEN) : 'Transaction')}
                      </span>
                      <span className="text-[11px] text-zinc-500 font-medium tracking-wide mt-1">
                        {catObj ? (language === 'TH' ? catObj.nameTH : catObj.nameEN) : 'Other'} • {formatDateLabel(tx.date)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className={`text-sm font-bold font-mono ${tx.type === 'income' ? 'text-[#4edea3]' : 'text-[#ff7875]'}`}>
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </span>
                    <button 
                      onClick={() => deleteTransaction(tx.id)}
                      className="text-zinc-650 hover:text-rose-400 p-1.5 rounded-lg hover:bg-zinc-900 transition-all outline-none"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
