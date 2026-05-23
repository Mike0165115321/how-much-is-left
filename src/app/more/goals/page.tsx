import React, { useState, useMemo } from 'react';
import { useFinanceStore, Goal } from '../../../store/useFinanceStore';
import { 
  Target, 
  Plus, 
  X, 
  Trash2, 
  PiggyBank, 
  Laptop, 
  Compass, 
  PlusCircle, 
  Sparkles,
  HelpCircle,
  TrendingUp,
  Percent
} from 'lucide-react';

export default function GoalsPage() {
  const { 
    language, 
    goals, 
    addGoal, 
    deleteGoal, 
    contributeToGoal,
    netBalance
  } = useFinanceStore();

  const [activeTab, setActiveTab] = useState<'periodic' | 'target'>('periodic');
  const [showAddGoalModal, setShowAddGoalModal] = useState(false);
  const [showContributeModal, setShowContributeModal] = useState<string | null>(null);

  // New goal Form state variables
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<'periodic' | 'target'>('periodic');
  const [newTargetAmount, setNewTargetAmount] = useState('');
  const [newCurrentAmount, setNewCurrentAmount] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  
  // Quick contribution amount variable
  const [contributionAmt, setContributionAmt] = useState('');

  // Format currency helper
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 0, maximumFractionDigits: 0 })
      .format(val)
      .replace('THB', '฿')
      .trim();
  };

  // Format deadline date helper
  const formatDeadline = (deadlineStr: string) => {
    if (!deadlineStr) return '';
    if (deadlineStr === 'Recurring' || deadlineStr === 'วนซ้ำ') {
      return language === 'TH' ? 'วนซ้ำรายเดือน' : 'Monthly Recurring';
    }
    const parts = deadlineStr.split('-');
    if (parts.length === 3) {
      const date = new Date(deadlineStr);
      if (!isNaN(date.getTime())) {
        return new Intl.DateTimeFormat(language === 'TH' ? 'th-TH' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })
          .format(date);
      }
    }
    return deadlineStr;
  };

  // Quick deadline setter helper for mobile ease of use
  const setQuickDeadline = (monthsToAdd: number) => {
    const d = new Date();
    d.setMonth(d.getMonth() + monthsToAdd);
    setNewDeadline(d.toISOString().split('T')[0]);
  };

  // Filter list by selected Tab
  const filteredGoals = useMemo(() => {
    return goals.filter(g => g.type === activeTab);
  }, [goals, activeTab]);

  // Handle saving contribution action
  const handleContributeSubmit = () => {
    const amt = parseFloat(contributionAmt.replace(/,/g, ''));
    if (isNaN(amt) || amt <= 0 || !showContributeModal) return;

    if (amt > netBalance) {
      alert(language === 'TH' 
        ? 'ขออภัย ยอดเงินสุทธิในกระเป๋าของคุณมีไม่เพียงพอสำหรับการออมเงินเป้าหมายนี้' 
        : 'Inadequate net balance to save for this target.'
      );
      return;
    }

    contributeToGoal(showContributeModal, amt);
    setContributionAmt('');
    setShowContributeModal(null);
  };

  // Handle saving full goal specification
  const handleSaveGoal = () => {
    const targetVal = parseFloat(newTargetAmount.replace(/,/g, ''));
    const currentVal = parseFloat(newCurrentAmount.replace(/,/g, '')) || 0;
    
    if (!newTitle || isNaN(targetVal) || targetVal <= 0) return;

    addGoal({
      title: newTitle,
      type: newType,
      targetAmount: targetVal,
      currentAmount: currentVal,
      deadline: newDeadline || (newType === 'periodic' ? 'Recurring' : 'Dec 2026'),
      icon: newType === 'periodic' ? 'PiggyBank' : 'Laptop',
      recurring: newType === 'periodic'
    });

    // Reset Form fields
    setNewTitle('');
    setNewTargetAmount('');
    setNewCurrentAmount('');
    setNewDeadline('');
    setShowAddGoalModal(false);
  };

  // Real-time Auto-Comma input formatter helper
  const handleAmountChange = (val: string, setter: (formatted: string) => void) => {
    const cleanVal = val.replace(/[^0-9.]/g, '');
    const parts = cleanVal.split('.');
    if (parts.length > 2) return;

    const integerPart = parts[0];
    const formattedInteger = integerPart ? parseInt(integerPart, 10).toLocaleString('en-US') : '';
    
    let finalVal = formattedInteger;
    if (integerPart === '0') finalVal = '0';
    else if (integerPart.startsWith('0') && integerPart.length > 1) {
      finalVal = parseInt(integerPart, 10).toLocaleString('en-US');
    }
    
    if (parts.length === 2) {
      finalVal = `${finalVal}.${parts[1].slice(0, 2)}`;
    }
    
    setter(finalVal);
  };

  // Get matching icon block
  const getGoalIcon = (iconName: string) => {
    switch (iconName) {
      case 'Laptop': return <Laptop className="w-5 h-5 text-blue-400" />;
      default: return <PiggyBank className="w-5 h-5 text-[#4edea3]" />;
    }
  };

  return (
    <div className="flex flex-col flex-1 pb-10" id="goals_screen">
      
      {/* Top Header Section */}
      <header className="px-6 pt-6 pb-2 border-b border-zinc-900 sticky top-0 bg-black/95 z-10 flex justify-between items-center">
        <div>
          <span className="text-zinc-500 text-[10px] uppercase tracking-widest font-mono">
            {language === 'TH' ? 'ระบบติดตามเป้าหมายการเงิน' : 'Target Hub'}
          </span>
          <h1 className="text-2xl font-bold text-zinc-100 mt-1 tracking-tight">
            {language === 'TH' ? 'เป้าหมายและงบประมาณ' : 'Financial Goals'}
          </h1>
        </div>
        <button 
          id="add_new_goal_btn"
          onClick={() => setShowAddGoalModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#4edea3]/10 border border-[#4edea3]/20 hover:border-[#4edea3]/40 text-xs font-semibold text-[#4edea3] rounded-full active:scale-95 transition-all outline-none"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{language === 'TH' ? 'สร้างเป้าหมาย' : 'New Goal'}</span>
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow px-6 py-4 max-w-xl mx-auto w-full flex flex-col gap-6">

        {/* High-fidelity Segment tabs (Periodic vs Target Goals) */}
        <div className="bg-[#121212] p-[3px] rounded-full flex relative border border-zinc-800 max-w-sm mx-auto w-full">
          <button 
            onClick={() => setActiveTab('periodic')}
            className={`flex-1 py-1.5 text-center text-xs font-semibold rounded-full transition-all ${
              activeTab === 'periodic' 
                ? 'bg-zinc-800 text-zinc-100 shadow-sm' 
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {language === 'TH' ? 'เป้าหมายระยะสั้น (รายเดือน)' : 'Periodic Goals'}
          </button>
          <button 
            onClick={() => setActiveTab('target')}
            className={`flex-1 py-1.5 text-center text-xs font-semibold rounded-full transition-all ${
              activeTab === 'target' 
                ? 'bg-zinc-800 text-zinc-100 shadow-sm' 
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {language === 'TH' ? 'เป้าหมายระยะยาว' : 'Target Goals'}
          </button>
        </div>

        {/* List of custom goals matching active tab */}
        <div className="flex flex-col gap-4">
          {filteredGoals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center text-zinc-650 mb-4 border border-zinc-850">
                <Target className="w-8 h-8 animate-pulse text-[#4edea3]/60" />
              </div>
              <p className="text-zinc-400 font-medium text-sm">
                {language === 'TH' ? 'ยังไม่มีข้อมูลจำลองหมวดนี้' : 'No goals logged in this category.'}
              </p>
              <button 
                onClick={() => setShowAddGoalModal(true)}
                className="mt-6 px-4 py-1.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 rounded-lg text-xs"
              >
                {language === 'TH' ? 'เริ่มกำหนดเป้าหมายแรกกันเลย' : 'Create First Goal Specification'}
              </button>
            </div>
          ) : (
            filteredGoals.map((g) => {
              const progressRatio = Math.min(100, Math.max(0, (g.currentAmount / g.targetAmount) * 100));
              const isComp = g.currentAmount >= g.targetAmount;
              
              return (
                <div 
                  key={g.id}
                  className="bg-[#121212] border border-zinc-900 rounded-2xl p-5 flex flex-col gap-4 relative group hover:border-zinc-800 transition-all"
                >
                  {/* Floating Action Contribute trigger point */}
                  <div className="absolute top-5 right-5 flex items-center gap-1">
                    {!isComp && (
                      <button 
                        onClick={() => setShowContributeModal(g.id)}
                        className="w-8 h-8 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-[#4edea3] rounded-full flex items-center justify-center transition-transform active:scale-90"
                        title={language === 'TH' ? 'ส่งเงินออม' : 'Contribute pocket money'}
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    )}
                    <button 
                      onClick={() => deleteGoal(g.id)}
                      className="w-8 h-8 bg-zinc-950/20 text-zinc-600 hover:text-rose-400 hover:bg-zinc-900 rounded-full flex items-center justify-center transition-colors"
                      title="Clear goal"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Header content with matching indicators */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-zinc-950 flex items-center justify-center border border-zinc-850">
                      {getGoalIcon(g.icon)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-zinc-100 text-sm">{g.title}</h3>
                      <p className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 mt-0.5">
                        {language === 'TH' 
                          ? (g.type === 'periodic' ? 'วนซ้ำรายเดือน' : `เป้าหมาย: ${formatDeadline(g.deadline)}`) 
                          : (g.type === 'periodic' ? 'Monthly Recurring' : `Due: ${formatDeadline(g.deadline)}`)}
                      </p>
                    </div>
                  </div>

                  {/* Pricing breakdown metrics row */}
                  <div className="flex justify-between items-end mt-1">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">
                        {language === 'TH' ? 'มูลค่าเป้าหมาย' : 'Target Budget'}
                      </span>
                      <span className="text-xl font-bold font-mono text-zinc-200 mt-1">
                        {formatCurrency(g.targetAmount)}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-semibold text-[#4edea3] block">
                        {language === 'TH' ? `ออมแล้ว ${formatCurrency(g.currentAmount)}` : `Saved ${formatCurrency(g.currentAmount)}`}
                      </span>
                      <span className="text-[10px] text-zinc-500 block mt-1 font-mono">
                        {language === 'TH' ? `ขาดอีก ${formatCurrency(Math.max(0, g.targetAmount - g.currentAmount))}` : `${formatCurrency(Math.max(0, g.targetAmount - g.currentAmount))} remaining`}
                      </span>
                    </div>
                  </div>

                  {/* Detailed progress scale indicators */}
                  <div className="flex flex-col gap-1.5 mt-1">
                    <div className="w-full h-2 bg-zinc-950 border border-zinc-900 rounded-full overflow-hidden p-[1px]">
                      <div 
                        className={`h-full rounded-full transition-all duration-750 ${g.type === 'periodic' ? 'bg-[#4edea3]' : 'bg-blue-400'}`}
                        style={{ width: `${progressRatio}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] font-mono font-semibold text-zinc-650">
                      <span>{Math.round(progressRatio)}% Completed</span>
                      {isComp && (
                        <span className="text-[#4edea3] flex items-center gap-1">
                          <Sparkles className="w-3 h-3 inline" />
                          Target Achieved!
                        </span>
                      )}
                    </div>
                  </div>

                </div>
              );
            })
          )}
        </div>
      </main>

      {/* Add Finance goal Modal code card overlay */}
      {showAddGoalModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-zinc-800 max-w-sm w-full rounded-2xl flex flex-col p-6 animate-in fade-in duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-zinc-100">
                {language === 'TH' ? 'ตั้งเป้าหมายการออม' : 'Create Custom Goal'}
              </h3>
              <button onClick={() => setShowAddGoalModal(false)} className="text-zinc-500 hover:text-zinc-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest font-mono">
                  {language === 'TH' ? 'ชื่อเป้าหมาย (เช่น คอมพิวเตอร์ใหม่)' : 'Goal Title'}
                </label>
                <input 
                  id="new_goal_title"
                  type="text" 
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Dream Car / Emergency Funds"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2 px-3 text-sm text-zinc-200 outline-none focus:border-[#4edea3]"
                />
              </div>

              {/* Goal Type toggle switch */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest font-mono">
                  {language === 'TH' ? 'ประเภทเป้าหมาย' : 'Goal Interval'}
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setNewType('periodic')}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-all ${
                      newType === 'periodic'
                        ? 'bg-zinc-900 text-zinc-100 border-zinc-700'
                        : 'bg-zinc-950 border-transparent text-zinc-500'
                    }`}
                  >
                    {language === 'TH' ? 'ระยะสั้น (รายเดือน)' : 'Monthly Periodic'}
                  </button>
                  <button
                    onClick={() => setNewType('target')}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-all ${
                      newType === 'target'
                        ? 'bg-zinc-900 text-zinc-100 border-zinc-700'
                        : 'bg-zinc-950 border-transparent text-zinc-500'
                    }`}
                  >
                    {language === 'TH' ? 'ตามเป้าหมาย (กำหนดเวลา)' : 'Target Goal'}
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-1 flex flex-col gap-1 justify-between min-w-0">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest font-mono truncate" title={language === 'TH' ? 'เป้าหมาย (฿)' : 'Limit Budget'}>
                    {language === 'TH' ? 'เป้าหมาย (฿)' : 'Limit Budget'}
                  </label>
                  <input 
                    id="new_goal_target_amount"
                    type="text" 
                    inputMode="decimal"
                    value={newTargetAmount}
                    onChange={(e) => handleAmountChange(e.target.value, setNewTargetAmount)}
                    placeholder="10,000"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2.5 px-3 text-sm text-zinc-200 outline-none focus:border-[#4edea3] font-mono"
                  />
                </div>
                <div className="flex-1 flex flex-col gap-1 justify-between min-w-0">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest font-mono truncate" title={language === 'TH' ? 'ออมเริ่มแรก (฿)' : 'Starting (฿)'}>
                    {language === 'TH' ? 'ออมเริ่มแรก (฿)' : 'Starting (฿)'}
                  </label>
                  <input 
                    id="new_goal_current_amount"
                    type="text" 
                    inputMode="decimal"
                    value={newCurrentAmount}
                    onChange={(e) => handleAmountChange(e.target.value, setNewCurrentAmount)}
                    placeholder="2,000"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2.5 px-3 text-sm text-zinc-200 outline-none focus:border-[#4edea3] font-mono"
                  />
                </div>
              </div>

              {newType === 'target' && (
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest font-mono">
                    {language === 'TH' ? 'วันกำหนดส่งเป้าหมาย' : 'Target Deadline Date'}
                  </label>
                  <input 
                    id="new_goal_deadline"
                    type="date" 
                    value={newDeadline}
                    onChange={(e) => setNewDeadline(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2.5 px-3 text-sm text-zinc-200 outline-none focus:border-[#4edea3] font-mono block text-left"
                    style={{ colorScheme: 'dark' }}
                  />
                  {/* Mobile Quick Tap Shortcuts */}
                  <div className="flex gap-2 mt-1.5 justify-start flex-wrap">
                    <button 
                      onClick={() => setQuickDeadline(3)}
                      className="px-2.5 py-1 text-[10px] font-extrabold bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 hover:border-[#4edea3]/40 rounded-full text-zinc-450 hover:text-[#4edea3] active:scale-95 transition-all cursor-pointer font-mono"
                      type="button"
                    >
                      {language === 'TH' ? '+3 เดือน' : '+3 Mos'}
                    </button>
                    <button 
                      onClick={() => setQuickDeadline(6)}
                      className="px-2.5 py-1 text-[10px] font-extrabold bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 hover:border-[#4edea3]/40 rounded-full text-zinc-450 hover:text-[#4edea3] active:scale-95 transition-all cursor-pointer font-mono"
                      type="button"
                    >
                      {language === 'TH' ? '+6 เดือน' : '+6 Mos'}
                    </button>
                    <button 
                      onClick={() => setQuickDeadline(12)}
                      className="px-2.5 py-1 text-[10px] font-extrabold bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 hover:border-[#4edea3]/40 rounded-full text-zinc-450 hover:text-[#4edea3] active:scale-95 transition-all cursor-pointer font-mono"
                      type="button"
                    >
                      {language === 'TH' ? '+1 ปี' : '+1 Yr'}
                    </button>
                  </div>
                </div>
              )}

              <button 
                id="save_new_goal_btn"
                onClick={handleSaveGoal}
                className="w-full bg-[#4edea3] hover:opacity-95 text-[#003824] font-bold py-3 rounded-lg text-sm transition-all active:scale-[0.98] mt-2 cursor-pointer shadow-md"
              >
                {language === 'TH' ? 'บันทึกและเปิดใช้งานเป้าหมาย' : 'Create Target Goal'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick interactive Savings contribution modal dialog overlay */}
      {showContributeModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-zinc-800 max-w-xs w-full rounded-2xl flex flex-col p-6 animate-in zoom-in duration-150">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-sm text-zinc-300 uppercase tracking-wide font-mono">
                {language === 'TH' ? 'ออมเงินเข้าเป้าหมาย' : 'Micro Contribution'}
              </h3>
              <button onClick={() => setShowContributeModal(null)} className="text-zinc-650 hover:text-zinc-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-zinc-550 leading-relaxed mb-4">
              {language === 'TH' 
                ? 'จำนวนเงินสุทธินี้ จะถูกหักจากยอดเงินรวมสุทธิของคุณ เพื่อโอนเอาไปสะสมไว้เป็นเงินออมเป้าหมายนี่' 
                : 'Contribution will deduct balance from your wallet automatically to allocate to this target goal.'}
            </p>

            <div className="flex flex-col gap-4">
              <input 
                id="contribution_amount_input"
                type="text" 
                inputMode="decimal"
                value={contributionAmt}
                onChange={(e) => handleAmountChange(e.target.value, setContributionAmt)}
                placeholder="2,000"
                autoFocus
                className="bg-zinc-950 border border-zinc-800 rounded-lg py-2.5 px-3 text-center text-lg font-bold text-[#4edea3] outline-none focus:border-[#4edea3] font-mono w-full"
              />

              <button 
                id="save_contribution_btn"
                onClick={handleContributeSubmit}
                className="w-full bg-[#4edea3] hover:opacity-90 font-bold text-[#003824] py-2.5 rounded-lg text-xs transition-transform active:scale-95 cursor-pointer"
              >
                {language === 'TH' ? 'ยืนยันโอนออมเงิน' : 'Transfer & Add Contribution'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
