import React, { useState } from 'react';
import { useFinanceStore, Category } from '../../../store/useFinanceStore';
import { 
  X, 
  Plus, 
  Trash2, 
  Palette, 
  Smile, 
  Tag,
  AlertCircle,
  Shapes
} from 'lucide-react';

const EMOJI_OPTIONS = [
  '🍔', '🍕', '🍰', '☕', '🍺', '🛍️', '👕', '👠', '🚗', '✈️', 
  '⚡', '🏠', '🎬', '🎮', '🎵', '🏥', '⚽', '📚', '💰', '🎁', 
  '🔮', '💻', '💼', '🐾', '🔥', '💧', '🌲', '❤️', '🚲', '💈'
];

const COLOR_OPTIONS = [
  '#4edea3', '#adc6ff', '#ffb95f', '#fc7c78', '#a78bfa', 
  '#fb7185', '#60a5fa', '#34d399', '#f472b6', '#38bdf8', 
  '#a3e635', '#fbbf24', '#f87171', '#c084fc', '#818cf8'
];

export default function CategoriesPage() {
  const { 
    language, 
    categories, 
    addCategory, 
    deleteCategory 
  } = useFinanceStore();

  const [showAddCatModal, setShowAddCatModal] = useState(false);
  const [nameEN, setNameEN] = useState('');
  const [nameTH, setNameTH] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🍔');
  const [selectedColor, setSelectedColor] = useState('#4edea3');

  // Format currency or counter helper
  const categoryUsageCount = (catId: string) => {
    // Simply check total registered categories count or placeholder
    return categories.length;
  };

  const handleSaveCategory = () => {
    if (!nameEN || !nameTH) {
      alert(language === 'TH' ? 'กรุณากรอกชื่อหมวดหมู่ทั้งสองภาษา' : 'Please fill layout labels for both languages');
      return;
    }

    addCategory({
      nameEN,
      nameTH,
      emoji: selectedEmoji,
      icon: 'Tag', // Fallback default lucide icon
      color: selectedColor
    });

    // Reset Form
    setNameEN('');
    setNameTH('');
    setSelectedEmoji('🍔');
    setSelectedColor('#4edea3');
    setShowAddCatModal(false);
  };

  return (
    <div className="flex flex-col flex-1 pb-10" id="categories_screen">
      {/* Top Header App bar */}
      <header className="px-6 pt-6 pb-2 border-b border-zinc-900 sticky top-0 bg-black/95 z-10 flex justify-between items-center">
        <div>
          <span className="text-zinc-500 text-[10px] uppercase tracking-widest font-mono">
            {language === 'TH' ? 'การตั้งค่าระบบ' : 'Settings System'}
          </span>
          <h1 className="text-2xl font-bold text-zinc-100 mt-1 tracking-tight">
            {language === 'TH' ? 'หมวดหมู่การจัดเก็บ' : 'Category Manager'}
          </h1>
        </div>
        <button 
          id="add_new_category_btn"
          onClick={() => setShowAddCatModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#4edea3]/10 border border-[#4edea3]/20 hover:border-[#4edea3]/45 text-xs font-semibold text-[#4edea3] rounded-full active:scale-95 transition-all outline-none"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{language === 'TH' ? 'เพิ่มหมวดหมู่' : 'New Category'}</span>
        </button>
      </header>

      {/* Main categories view list space */}
      <main className="flex-grow px-6 py-4 max-w-xl mx-auto w-full flex flex-col gap-5">
        
        {/* Banner Alert informing user that custom categories will automatically inject to transaction logs horizontal scrolls */}
        <div className="bg-[#121212] border border-zinc-850 p-4 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-bold text-zinc-300">
              {language === 'TH' ? 'หมวดหมู่ที่กำหนดเองพร้อมใช้งานทันที' : 'Custom Category Integration'}
            </span>
            <p className="text-[11px] text-zinc-500 leading-relaxed mt-1">
              {language === 'TH' 
                ? 'หมวดเพิ่มใหม่ตรงนี้ จะแสดงให้เลือกทันทีเมื่อคุณเลื่อนด้านซ้ายขวาในหน้าจอบันทึกรายการรายรับรายจ่ายด่วน!' 
                : 'Custom additions created here will instantly manifest inside the horizontally scrolled rows under custom numpad modal overlay!'}
            </p>
          </div>
        </div>

        {/* Categories list grids */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
          {categories.map((cat) => (
            <div 
              key={cat.id}
              className="bg-[#121212] border border-zinc-900 rounded-xl p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                {/* Visual block with matching customizable hex colors background */}
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-inner border border-zinc-800"
                  style={{ backgroundColor: `${cat.color}15`, borderLeft: `3px solid ${cat.color}` }}
                >
                  {cat.emoji}
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-zinc-100 text-sm leading-tight">
                    {language === 'TH' ? cat.nameTH : cat.nameEN}
                  </span>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono font-semibold mt-1">
                    {cat.isCustom ? (language === 'TH' ? 'กำหนดเอง' : 'Custom') : (language === 'TH' ? 'ระบบหลัก' : 'System')}
                  </span>
                </div>
              </div>

              {/* Action trash triggers for custom models only and safe guard rules */}
              {cat.isCustom ? (
                <button 
                  onClick={() => deleteCategory(cat.id)}
                  className="text-zinc-650 hover:text-rose-400 p-1.5 rounded-lg hover:bg-zinc-950 transition-colors cursor-pointer"
                  title="Remove category"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              ) : (
                <span className="text-[10px] font-bold text-zinc-650/40 uppercase font-mono mr-2">
                  Locked
                </span>
              )}
            </div>
          ))}
        </div>
      </main>

      {/* Add Custom Category screen Overlay design modal */}
      {showAddCatModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#121212] border border-zinc-800 max-w-sm w-full rounded-2xl flex flex-col p-6 max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex justify-between items-center mb-4 border-b border-zinc-900 pb-3">
              <h3 className="font-bold text-lg text-zinc-100 flex items-center gap-2">
                <Shapes className="w-5 h-5 text-[#4edea3]" />
                <span>{language === 'TH' ? 'สร้างหมวดหมู่ใหม่' : 'Create Category'}</span>
              </h3>
              <button onClick={() => setShowAddCatModal(false)} className="text-zinc-500 hover:text-[#4edea3] transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              
              {/* Name inputs (Dual languages) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono">
                  {language === 'TH' ? 'ชื่อหมวดหมู่ (ภาษาไทย)' : 'Thai Label String'}
                </label>
                <input 
                  id="category_name_th"
                  type="text" 
                  value={nameTH}
                  onChange={(e) => setNameTH(e.target.value)}
                  placeholder="เงินสมทบ / ชาบูของหวาน"
                  className="bg-zinc-950 border border-zinc-800 rounded-lg py-2.5 px-3 text-sm text-zinc-200 outline-none focus:border-[#4edea3]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono">
                  {language === 'TH' ? 'ชื่อหมวดหมู่ (ภาษาอังกฤษ)' : 'English Label String'}
                </label>
                <input 
                  id="category_name_en"
                  type="text" 
                  value={nameEN}
                  onChange={(e) => setNameEN(e.target.value)}
                  placeholder="Subscription / Groceries"
                  className="bg-zinc-950 border border-zinc-800 rounded-lg py-2.5 px-3 text-sm text-zinc-200 outline-none focus:border-[#4edea3]"
                />
              </div>

              {/* Emoji Options panel */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono flex items-center gap-1">
                  <Smile className="w-3.5 h-3.5" />
                  <span>{language === 'TH' ? 'เลือก Emoji ประจำหมวดหมู่' : 'Select Category Emoji'}</span>
                </label>
                
                <div className="grid grid-cols-6 gap-2 bg-zinc-950 border border-zinc-900 rounded-xl p-3 max-h-32 overflow-y-auto no-scrollbar">
                  {EMOJI_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => setSelectedEmoji(emoji)}
                      className={`h-10 text-xl flex items-center justify-center rounded-lg border transition-all active:scale-95 ${
                        selectedEmoji === emoji
                          ? 'bg-zinc-900 border-[#4edea3] scale-105 shadow-inner'
                          : 'border-transparent hover:bg-zinc-900'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color hex options select */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono flex items-center gap-1">
                  <Palette className="w-3.5 h-3.5" />
                  <span>{language === 'TH' ? 'เลือกสีประจำหมวดหมู่' : 'Identify Color Ring'}</span>
                </label>
                
                <div className="flex gap-2.5 flex-wrap justify-center bg-zinc-950 border border-zinc-900 rounded-xl p-3">
                  {COLOR_OPTIONS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className="w-6 h-6 rounded-full transition-transform active:scale-90 flex items-center justify-center"
                      style={{ backgroundColor: color }}
                    >
                      {selectedColor === color && (
                        <span className="w-2 h-2 rounded-full bg-black block shadow-inner" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Confirm submit buttons */}
              <button 
                id="save_new_category_btn"
                onClick={handleSaveCategory}
                className="w-full bg-[#4edea3] hover:opacity-90 font-bold text-[#003824] py-3 rounded-lg text-sm transition-all active:scale-98 mt-2 cursor-pointer shadow-md"
              >
                {language === 'TH' ? 'สร้างหมวดหมู่เดี๋ยวนี้!' : 'Append Category Now'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
