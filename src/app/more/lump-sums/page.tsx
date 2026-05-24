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

const COLOR_PALETTE = [
  '#4edea3', // Mint Green
  '#2dd4bf', // Teal
  '#38bdf8', // Sky Blue
  '#60a5fa', // Indigo Blue
  '#818cf8', // Indigo
  '#a78bfa', // Lavender Violet
  '#c084fc', // Purple
  '#f472b6', // Pink
  '#fb7185', // Rose
  '#f87171', // Red
  '#fb923c', // Orange
  '#fbbf24'  // Amber/Yellow
];

export default function LumpSumsPage() {
  const { 
    language, 
    lumpSums, 
    addLumpSum, 
    deleteLumpSum, 
    toggleAllocationStatus,
    addAllocationToLumpSum,
    deleteAllocationFromLumpSum
  } = useFinanceStore();

  const [showAddLumpModal, setShowAddLumpModal] = useState(false);
  const [newLumpTitle, setNewLumpTitle] = useState('');
  const [newLumpAmount, setNewLumpAmount] = useState('');
  
  // Custom Allocations inside add-lump flow
  const [allocations, setAllocations] = useState<Array<{ title: string; amount: number }>>([
    { title: 'Rent for 3 Months', amount: 12000 },
    { title: 'Buy MacBook', amount: 35000 },
    { title: 'Emergency Fund', amount: 3000 }
  ]);

  const [newAllocTitle, setNewAllocTitle] = useState('');
  const [newAllocAmount, setNewAllocAmount] = useState('');

  // Inline Allocations inside active lump sum details
  const [showAddAllocForm, setShowAddAllocForm] = useState(false);
  const [inlineAllocTitle, setInlineAllocTitle] = useState('');
  const [inlineAllocAmount, setInlineAllocAmount] = useState('');
  const [inlineAllocColor, setInlineAllocColor] = useState('#4edea3');

  // Format currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 0, maximumFractionDigits: 0 })
      .format(val)
      .replace('THB', '฿')
      .trim();
  };

  // Helper to format typed input values with commas as thousand separators
  const formatInputWithCommas = (val: string) => {
    if (!val) return '';
    // Remove any existing commas or non-numeric/non-decimal characters
    const clean = val.replace(/,/g, '');
    const parts = clean.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join('.');
  };

  // Helper to sanitize incoming typed text to a clean raw number string on change
  const sanitizeInputRawValue = (val: string) => {
    // Keep only numbers and decimal point
    return val.replace(/[^0-9.]/g, '');
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

  // Compute dynamic conic-gradient styles representing active allocation slice colors
  const conicGradientStyle = useMemo(() => {
    if (!activeLump || activeLump.amount <= 0) {
      return 'conic-gradient(#27272a 0% 100%)';
    }

    const total = activeLump.amount;
    let cumulative = 0;
    const gradientParts: string[] = [];

    // 1. Spent allocations first (rendered in soft rose-300)
    let spentSum = 0;
    activeLump.allocations.forEach((alloc) => {
      if (alloc.status === 'spent') {
        spentSum += alloc.amount;
      }
    });

    if (spentSum > 0) {
      const spentPercentage = (spentSum / total) * 100;
      gradientParts.push(`#fda4af 0% ${spentPercentage}%`);
      cumulative = spentPercentage;
    }

    // 2. Pending allocations next (rendered in their actual custom colors)
    activeLump.allocations.forEach((alloc) => {
      if (alloc.status !== 'spent') {
        const allocPercentage = (alloc.amount / total) * 100;
        const end = cumulative + allocPercentage;
        const color = alloc.color || '#fbbf24'; // fallback to golden yellow
        gradientParts.push(`${color} ${cumulative}% ${end}%`);
        cumulative = end;
      }
    });

    // 3. Unmanaged portion last (rendered in dark zinc-800)
    if (cumulative < 100) {
      gradientParts.push(`#27272a ${cumulative}% 100%`);
    }

    return `conic-gradient(${gradientParts.join(', ')})`;
  }, [activeLump]);

  // Handle adding new custom allocation row to draft State
  const addAllocRowToDraft = () => {
    const amt = parseFloat(newAllocAmount);
    if (!newAllocTitle || isNaN(amt) || amt <= 0) return;
    
    setAllocations([
      ...allocations,
      {
        title: newAllocTitle,
        amount: amt
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
      allocations: allocations.map((a, idx) => ({
        title: a.title,
        amount: a.amount,
        status: 'pending',
        icon: '',
        categoryEmoji: '',
        color: COLOR_PALETTE[idx % COLOR_PALETTE.length]
      }))
    });

    // Reset form params
    setNewLumpTitle('');
    setNewLumpAmount('');
    setAllocations([]);
    setShowAddLumpModal(false);
  };

  const handleSaveInlineAllocation = () => {
    const amt = parseFloat(inlineAllocAmount);
    if (!activeLump || !inlineAllocTitle || isNaN(amt) || amt <= 0) return;

    addAllocationToLumpSum(activeLump.id, {
      title: inlineAllocTitle,
      amount: amt,
      status: 'pending',
      icon: '',
      categoryEmoji: '',
      color: inlineAllocColor
    });

    // Reset inline form
    setInlineAllocTitle('');
    setInlineAllocAmount('');
    setInlineAllocColor('#4edea3');
    setShowAddAllocForm(false);
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
                className="w-36 h-36 sm:w-44 sm:h-44 rounded-full flex items-center justify-center shadow-lg transform active:scale-98 transition-all"
                style={{
                  background: conicGradientStyle
                }}
              >
                {/* Hole masking center */}
                <div className="w-[85%] h-[85%] bg-[#000000] rounded-full flex flex-col items-center justify-center relative border border-zinc-900">
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest font-mono">
                    {language === 'TH' ? 'เงินส่วนที่ยังไม่จัดสรร' : 'Unmanaged'}
                  </span>
                  <span className="text-lg font-bold font-mono text-zinc-100 mt-0.5">
                    {formatCurrency(chartStats.unmanaged)}
                  </span>
                </div>
              </div>

              {/* Legends with detail keys */}
              <div className="flex gap-x-4 gap-y-1.5 mt-4 justify-center flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-300" />
                  <span className="text-xs text-zinc-400 font-medium">
                    {language === 'TH' ? `ใช้ไปแล้ว (${chartStats.spentPercentage}%)` : `Spent (${chartStats.spentPercentage}%)`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-gradient-to-r from-[#4edea3] via-[#c084fc] to-[#fbbf24]" />
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
              <div className="flex justify-between items-center mb-1">
                <h3 className="text-sm font-bold tracking-wide text-zinc-400">
                  {language === 'TH' ? 'รายละเอียดการจัดสรรเงินก้อน' : 'Allocations'}
                </h3>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setShowAddAllocForm(!showAddAllocForm)}
                    className="flex items-center gap-1.5 px-3 py-1 bg-[#4edea3]/10 hover:bg-[#4edea3]/20 text-[#4edea3] font-bold rounded-lg text-xs active:scale-95 transition-all cursor-pointer border border-[#4edea3]/20"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{language === 'TH' ? 'เพิ่มการจัดสรร' : 'Add Allocation'}</span>
                  </button>
                  <button 
                    id="delete_primary_lumpsum_btn"
                    onClick={() => deleteLumpSum(activeLump.id)}
                    className="text-zinc-650 hover:text-rose-400 p-1.5 rounded hover:bg-zinc-950 transition-colors cursor-pointer"
                    title="Remove this Lump Sum"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Inline Add Allocation Form */}
              {showAddAllocForm && (
                <div className="bg-[#121212] border border-zinc-800 p-4 rounded-xl flex flex-col gap-3.5 animate-in slide-in-from-top-2 duration-200">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono">
                      {language === 'TH' ? 'เพิ่มรายการจัดสรรใหม่' : 'New Allocation'}
                    </span>
                    <button 
                      onClick={() => setShowAddAllocForm(false)} 
                      className="text-zinc-500 hover:text-zinc-300"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      value={inlineAllocTitle}
                      onChange={(e) => setInlineAllocTitle(e.target.value)}
                      placeholder={language === 'TH' ? 'ระบุเป้าหมาย (เช่น ค่าเช่าห้อง)' : 'Alloc label'}
                      className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg py-2.5 px-3 text-xs text-zinc-200 outline-none focus:border-[#4edea3]"
                    />
                    <input 
                      type="text"
                      inputMode="decimal"
                      value={formatInputWithCommas(inlineAllocAmount)}
                      onChange={(e) => setInlineAllocAmount(sanitizeInputRawValue(e.target.value))}
                      placeholder={language === 'TH' ? '12,000' : '12,000'}
                      className="w-28 bg-zinc-950 border border-zinc-800 rounded-lg py-2.5 px-3 text-xs text-zinc-200 outline-none focus:border-[#4edea3] font-mono"
                    />
                  </div>

                  {/* 12-Color Palette Selector Grid */}
                  <div className="flex flex-col gap-1.5 mt-0.5">
                    <span className="text-[11px] text-zinc-500 font-bold uppercase tracking-wide font-mono">
                      {language === 'TH' ? 'เลือกสีสำหรับรายการนี้:' : 'Category color:'}
                    </span>
                    <div className="flex flex-wrap gap-3 py-1 select-none">
                      {COLOR_PALETTE.map(c => {
                        const isSelected = inlineAllocColor === c;
                        return (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setInlineAllocColor(c)}
                            className="w-8 h-8 rounded-full transition-all duration-200 active:scale-75 cursor-pointer"
                            style={{ 
                              backgroundColor: c,
                              boxShadow: isSelected ? `0 0 10px ${c}` : 'none',
                              border: isSelected ? '2.5px solid #ffffff' : '1.5px solid rgba(255,255,255,0.08)'
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 mt-1">
                    <button
                      onClick={() => {
                        setShowAddAllocForm(false);
                        setInlineAllocTitle('');
                        setInlineAllocAmount('');
                        setInlineAllocColor('#4edea3');
                      }}
                      className="px-3 py-1.5 bg-zinc-900 border border-zinc-850 hover:bg-zinc-800 text-zinc-400 font-bold rounded-lg text-[11px] cursor-pointer"
                    >
                      {language === 'TH' ? 'ยกเลิก' : 'Cancel'}
                    </button>
                    <button 
                      onClick={handleSaveInlineAllocation}
                      className="px-4 py-1.5 bg-[#4edea3] hover:opacity-90 text-[#003824] font-extrabold rounded-lg text-[11px] cursor-pointer shadow-[0_0_15px_rgba(78,222,163,0.18)]"
                    >
                      {language === 'TH' ? 'ตกลง' : 'Add'}
                    </button>
                  </div>
                </div>
              )}

              {activeLump.allocations.map((alloc) => (
                <div 
                  key={alloc.id}
                  className={`p-4 pl-6 rounded-xl flex items-center justify-between transition-all border relative overflow-hidden ${
                    alloc.status === 'spent' 
                      ? 'bg-zinc-900/30 border-zinc-950/40 opacity-70' 
                      : 'bg-[#121212] border-zinc-900 hover:border-zinc-850'
                  }`}
                >
                  {/* Left Color Indicator Bar */}
                  <div 
                    className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl transition-all duration-300"
                    style={{ backgroundColor: alloc.color || '#4edea3' }}
                  />

                  <div className="flex items-center gap-2">
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
                    
                    <div className="flex items-center gap-1.5">
                      {/* Delete Allocation Button */}
                      <button
                        onClick={() => deleteAllocationFromLumpSum(activeLump.id, alloc.id)}
                        className="text-zinc-500 hover:text-rose-400 p-2.5 rounded-lg transition-colors cursor-pointer hover:bg-zinc-950/60 active:scale-90"
                        title={language === 'TH' ? 'ลบรายการจัดสรร' : 'Delete Allocation'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      {/* Toggle switch with action trigger (Larger mobile hit target area) */}
                      <label className="inline-flex items-center cursor-pointer p-2.5 -mr-2 select-none">
                        <input 
                          type="checkbox" 
                          checked={alloc.status === 'spent'}
                          onChange={() => toggleAllocationStatus(activeLump.id, alloc.id)}
                          className="sr-only peer" 
                        />
                        <div className="relative w-8 h-4.5 bg-zinc-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-zinc-400 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-[#4edea3] peer-checked:after:bg-black peer-checked:after:border-black" />
                      </label>
                    </div>
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
                  type="text" 
                  inputMode="decimal"
                  value={formatInputWithCommas(newLumpAmount)}
                  onChange={(e) => setNewLumpAmount(sanitizeInputRawValue(e.target.value))}
                  placeholder="50,000"
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
                    type="text"
                    inputMode="decimal"
                    value={formatInputWithCommas(newAllocAmount)}
                    onChange={(e) => setNewAllocAmount(sanitizeInputRawValue(e.target.value))}
                    placeholder="12,000"
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
                      <span className="text-xs text-zinc-300 font-medium">{a.title}</span>
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
