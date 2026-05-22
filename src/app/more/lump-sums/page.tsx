import React, { useState, useMemo } from 'react';
import { useFinanceStore, Allocation } from '../../../store/useFinanceStore';
import { 
  PiggyBank, 
  CheckCircle, 
  Clock, 
  Trash2, 
  Plus, 
  Coins, 
  HelpCircle,
  ToggleLeft,
  X,
  PlusCircle,
  ShieldAlert,
  Home,
  Laptop
} from 'lucide-react';

export default function LumpSumsPage() {
  const { 
    language, 
    lumpSums, 
    addLumpSum, 
    deleteLumpSum, 
    toggleAllocationStatus 
  } = useFinanceStore();

  const [showAddLumpModal, setShowAddLumpModal] = useState(false);
  const [newLumpTitle, setNewLumpTitle] = useState('');
  const [newLumpAmount, setNewLumpAmount] = useState('');
  
  // Custom Allocations inside add-lump flow
  const [allocations, setAllocations] = useState<Array<{ title: string; amount: number; icon: string; emoji: string }>>([
    { title: 'Rent for 3 Months', amount: 12000, icon: 'Home', emoji: '🏠' },
    { title: 'Buy MacBook', amount: 35000, icon: 'Laptop', emoji: '💻' },
    { title: 'Emergency Fund', amount: 3000, icon: 'ShieldAlert', emoji: '🏥' }
  ]);

  const [newAllocTitle, setNewAllocTitle] = useState('');
  const [newAllocAmount, setNewAllocAmount] = useState('');

  // Format currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 0, maximumFractionDigits: 0 })
      .format(val)
      .replace('THB', '฿')
      .trim();
  };

  // Compute stats for current active lump sum
  const activeLump = lumpSums[0]; // focus on the single active primary lump sum

  const chartStats = useMemo(() => {
    if (!activeLump) return { spent: 0, allocated: 0, unmanaged: 0, spentPercentage: 0, allocPercentage: 0, unmanagedPercentage: 0 };
    
    const total = activeLump.amount;
    let spentSum = 0;
    let pendingSum = 0;

    activeLump.allocations.forEach((alloc) => {
      if (alloc.status === 'spent') {
        spentSum += alloc.amount;
      } else {
        pendingSum += alloc.amount;
      }
    });

    const spentPercentage = total > 0 ? Math.round((spentSum / total) * 100) : 0;
    const allocPercentage = total > 0 ? Math.round((pendingSum / total) * 100) : 0;
    const unmanaged = Math.max(0, total - (spentSum + pendingSum));
    const unmanagedPercentage = Math.max(0, 100 - (spentPercentage + allocPercentage));

    return {
      spent: spentSum,
      allocated: pendingSum,
      unmanaged,
      spentPercentage,
      allocPercentage,
      unmanagedPercentage
    };
  }, [activeLump]);

  // Handle adding new custom allocation row to draft State
  const addAllocRowToDraft = () => {
    const amt = parseFloat(newAllocAmount);
    if (!newAllocTitle || isNaN(amt) || amt <= 0) return;
    
    setAllocations([
      ...allocations,
      {
        title: newAllocTitle,
        amount: amt,
        icon: 'Coins',
        emoji: '🎁'
      }
    ]);
    
    setNewAllocTitle('');
    setNewAllocAmount('');
  };

  // Save the full Windfall + Allocation Structure
  const handleSaveLumpSum = () => {
    const totalAmt = parseFloat(newLumpAmount);
    if (!newLumpTitle || isNaN(totalAmt) || totalAmt <= 0) return;

    addLumpSum({
      title: newLumpTitle,
      amount: totalAmt,
      date: new Date().toISOString().split('T')[0],
      allocations: allocations.map(a => ({
        title: a.title,
        amount: a.amount,
        status: 'pending',
        icon: a.icon,
        categoryEmoji: a.emoji
      }))
    });

    // Reset form params
    setNewLumpTitle('');
    setNewLumpAmount('');
    setAllocations([]);
    setShowAddLumpModal(false);
  };

  // Get icon for display cards
  const getAllocIcon = (iconName: string) => {
    switch (iconName) {
      case 'Home': return <Home className="w-5 h-5 text-rose-400" />;
      case 'Laptop': return <Laptop className="w-5 h-5 text-rose-400" />;
      default: return <ShieldAlert className="w-5 h-5 text-amber-500" />;
    }
  };

  return (
    <div className="flex flex-col flex-1 pb-10" id="lumpsum_screen">
      {/* Top App bar */}
      <header className="px-6 pt-6 pb-2 border-b border-zinc-900 sticky top-0 bg-black/95 z-10 flex justify-between items-center">
        <div>
          <span className="text-zinc-500 text-[10px] uppercase tracking-widest font-mono">
            {language === 'TH' ? 'ระบบการจัดการเงินก้อน' : 'Windfall Allocator'}
          </span>
          <h1 className="text-2xl font-bold text-zinc-100 mt-1 tracking-tight">
            {language === 'TH' ? 'เงินก้อนและการจัดสรร' : 'Lump Sum Allocator'}
          </h1>
        </div>
        <button 
          id="add_new_lumpsum_btn"
          onClick={() => setShowAddLumpModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs font-bold text-[#4edea3] rounded-full active:scale-95 transition-all outline-none"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{language === 'TH' ? 'เพิ่มเงินก้อน' : 'New Windfall'}</span>
        </button>
      </header>

      {/* Main Allocator space */}
      <main className="flex-grow px-6 py-4 max-w-xl mx-auto w-full flex flex-col gap-6">

        {activeLump ? (
          <>
            {/* Header info widget details of active wind fall */}
            <div className="py-2 mt-2">
              <span className="text-sm font-semibold text-zinc-500">{activeLump.title}</span>
              <h2 className="text-4xl font-extrabold text-[#4edea3] tracking-tight mt-1 font-mono">
                {formatCurrency(activeLump.amount)}
              </h2>
            </div>

            {/* Circular progress percentages chart ring representation */}
            <section className="flex flex-col items-center justify-center py-4 relative">
              <div 
                className="w-60 h-60 rounded-full flex items-center justify-center shadow-lg transform active:scale-98 transition-all"
                style={{
                  background: `conic-gradient(
                    #fda4af 0% ${chartStats.spentPercentage}%, 
                    #fbbf24 ${chartStats.spentPercentage}% ${chartStats.spentPercentage + chartStats.allocPercentage}%, 
                    #27272a ${chartStats.spentPercentage + chartStats.allocPercentage}% 100%
                  )`
                }}
              >
                {/* Hole masking center */}
                <div className="w-[85%] h-[85%] bg-[#000000] rounded-full flex flex-col items-center justify-center relative border border-zinc-900">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono">
                    {language === 'TH' ? 'เงินส่วนที่ยังไม่จัดสรร' : 'Unmanaged'}
                  </span>
                  <span className="text-xl font-bold font-mono text-zinc-100 mt-1">
                    {formatCurrency(chartStats.unmanaged)}
                  </span>
                </div>
              </div>

              {/* Legends with detail keys */}
              <div className="flex gap-x-4 gap-y-1.5 mt-6 justify-center flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-300" />
                  <span className="text-xs text-zinc-400 font-medium">
                    {language === 'TH' ? `ใช้ไปแล้ว (${chartStats.spentPercentage}%)` : `Spent (${chartStats.spentPercentage}%)`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-amber-400" />
                  <span className="text-xs text-zinc-400 font-medium">
                    {language === 'TH' ? `จัดสรรรอใช้ (${chartStats.allocPercentage}%)` : `Allocated (${chartStats.allocPercentage}%)`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-zinc-800" />
                  <span className="text-xs text-zinc-400 font-medium">
                    {language === 'TH' ? `ไม่มีการจัดสรร (${chartStats.unmanagedPercentage}%)` : `Unmanaged (${chartStats.unmanagedPercentage}%)`}
                  </span>
                </div>
              </div>
            </section>

            {/* List of custom allocations */}
            <section className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold tracking-wide text-zinc-400">
                  {language === 'TH' ? 'รายละเอียดการจัดสรรเงินก้อน' : 'Allocations'}
                </h3>
                <button 
                  id="delete_primary_lumpsum_btn"
                  onClick={() => deleteLumpSum(activeLump.id)}
                  className="text-zinc-600 hover:text-rose-400 p-1 rounded hover:bg-zinc-950 transition-colors"
                  title="Remove this Lump Sum"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {activeLump.allocations.map((alloc) => (
                <div 
                  key={alloc.id}
                  className={`p-4 rounded-xl flex items-center justify-between transition-all border ${
                    alloc.status === 'spent' 
                      ? 'bg-zinc-900/30 border-zinc-950/40 opacity-70' 
                      : 'bg-[#121212] border-zinc-900 hover:border-zinc-850'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Circle identifier status */}
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center border ${
                      alloc.status === 'spent' 
                        ? 'bg-rose-950/20 border-rose-900/10 text-rose-400' 
                        : 'bg-amber-950/20 border-amber-900/20 text-amber-500'
                    }`}>
                      {alloc.categoryEmoji ? (
                        <span className="text-lg">{alloc.categoryEmoji}</span>
                      ) : (
                        getAllocIcon(alloc.icon)
                      )}
                    </div>

                    <div className="flex flex-col">
                      <span className="font-semibold text-zinc-200 text-sm">{alloc.title}</span>
                      <span className={`text-[10px] font-bold uppercase tracking-wide flex items-center gap-1 mt-1 font-mono ${
                        alloc.status === 'spent' ? 'text-rose-400' : 'text-amber-500'
                      }`}>
                        {alloc.status === 'spent' ? (
                          <>
                            <CheckCircle className="w-3.5 h-3.5 inline" />
                            {language === 'TH' ? 'ใช้แล้ว' : 'Spent'}
                          </>
                        ) : (
                          <>
                            <Clock className="w-3.5 h-3.5 inline" />
                            {language === 'TH' ? 'รอดำเนินการ' : 'Pending'}
                          </>
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <span className="font-bold text-md text-zinc-100 font-mono">
                      {formatCurrency(alloc.amount)}
                    </span>
                    
                    {/* Toggle switch with action trigger */}
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={alloc.status === 'spent'}
                        onChange={() => toggleAllocationStatus(activeLump.id, alloc.id)}
                        className="sr-only peer" 
                      />
                      <div className="w-8 h-4.5 bg-zinc-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-zinc-400 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-[#4edea3] peer-checked:after:bg-black peer-checked:after:border-black" />
                    </label>
                  </div>
                </div>
              ))}
            </section>
          </>
        ) : (
          /* Empty Space visual with prompt setup */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center text-[#4edea3] mb-4 border border-zinc-800">
              <Coins className="w-8 h-8" />
            </div>
            <h3 className="text-zinc-200 font-bold text-lg mb-1">
              {language === 'TH' ? 'ยังไม่ได้ระบุระบบเงินก้อน' : 'No windfall registered.'}
            </h3>
            <p className="text-zinc-500 text-xs max-w-xs mx-auto leading-relaxed">
              {language === 'TH' 
                ? 'จัดเก็บเงินก้อนก้อนพิเศษ เช่น โบนัสประจำปี หรือ รางวัลใหญ่ แล้ววางแผนแบ่งสัดส่วนไว้ที่นี่อย่างคุ้มค่าสูงสุด' 
                : 'Hold onto dynamic lumps like end-of-year bonuses or tax-refund windfalls here and split allocations systematically!'}
            </p>
            <button 
              onClick={() => setShowAddLumpModal(true)}
              className="mt-6 px-6 py-2 bg-[#4edea3] hover:opacity-90 font-bold text-[#003824] hover:scale-105 active:scale-95 transition-all rounded-md text-sm cursor-pointer shadow-md"
            >
              {language === 'TH' ? 'เพิ่มเงินก้อนแรก' : 'Initialize First Windfall'}
            </button>
          </div>
        )}
      </main>

      {/* Windfall dynamic addition modal drawer code overlay */}
      {showAddLumpModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-zinc-800 max-w-sm w-full rounded-2xl flex flex-col p-6 animate-in fade-in duration-250">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-zinc-100">
                {language === 'TH' ? 'เพิ่มเงินก้อนใหม่' : 'Log New Windfall'}
              </h3>
              <button onClick={() => setShowAddLumpModal(false)} className="text-zinc-500 hover:text-zinc-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              {/* Inputs */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 font-mono">
                  {language === 'TH' ? 'ชื่อเงินก้อน (เช่น โบนัสปี 2026)' : 'Windfall Label (e.g. Bonus)'}
                </label>
                <input 
                  id="new_lump_title"
                  type="text" 
                  value={newLumpTitle}
                  onChange={(e) => setNewLumpTitle(e.target.value)}
                  placeholder="Bonus Year 2026"
                  className="bg-zinc-950 border border-zinc-800 rounded-lg py-2.5 px-3 text-sm text-zinc-200 outline-none focus:border-[#4edea3]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 font-mono">
                  {language === 'TH' ? 'จำนวนเงินจริง (฿)' : ' wind-drop Amount (฿)'}
                </label>
                <input 
                  id="new_lump_amount"
                  type="number" 
                  value={newLumpAmount}
                  onChange={(e) => setNewLumpAmount(e.target.value)}
                  placeholder="50000"
                  className="bg-zinc-950 border border-zinc-800 rounded-lg py-2.5 px-3 text-sm text-zinc-200 outline-none focus:border-[#4edea3] font-mono"
                />
              </div>

              {/* Sub allocations manager row widget */}
              <div className="border-t border-zinc-900 pt-4 mt-1 flex flex-col gap-3">
                <h4 className="text-xs font-bold text-zinc-400 flex items-center justify-between">
                  <span>{language === 'TH' ? 'รายการข่อยเพื่อจัดสรรเงินก้อน' : 'Allocations list draft'}</span>
                  <span className="text-[10px] text-zinc-500 font-mono">({allocations.length} items)</span>
                </h4>

                <div className="flex gap-2">
                  <input 
                    type="text"
                    value={newAllocTitle}
                    onChange={(e) => setNewAllocTitle(e.target.value)}
                    placeholder={language === 'TH' ? 'เป้าจัดสรร (เช่น ค่าเช่า 3 เดือน)' : 'Alloc label'}
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg py-2 px-3 text-xs text-zinc-200 outline-none focus:border-amber-400"
                  />
                  <input 
                    type="number"
                    value={newAllocAmount}
                    onChange={(e) => setNewAllocAmount(e.target.value)}
                    placeholder="12000"
                    className="w-24 bg-zinc-950 border border-zinc-800 rounded-lg py-2 px-3 text-xs text-zinc-200 outline-none focus:border-amber-400 font-mono"
                  />
                  <button 
                    onClick={addAllocRowToDraft}
                    className="p-2 bg-amber-950/20 border border-amber-900/30 rounded-lg text-amber-500 cursor-pointer hover:bg-amber-900/30 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Listing allocations in modal draft */}
                <div className="flex flex-col gap-1.5 max-h-32 overflow-y-auto no-scrollbar">
                  {allocations.map((a, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-900">
                      <span className="text-xs text-zinc-300 font-medium">{a.emoji} {a.title}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-amber-400 font-mono">{formatCurrency(a.amount)}</span>
                        <button 
                          onClick={() => setAllocations(allocations.filter((_, i) => i !== idx))}
                          className="text-zinc-600 hover:text-rose-400"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Confirm submit buttons */}
              <button 
                id="save_new_lumpsum_btn"
                onClick={handleSaveLumpSum}
                className="w-full bg-[#4edea3] hover:opacity-90 font-bold text-[#003824] py-3 rounded-lg text-sm transition-all active:scale-98 mt-2 cursor-pointer shadow-md"
              >
                {language === 'TH' ? 'บันทึกและเปิดใช้งาน เงินก้อน' : 'Save Windfall'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
