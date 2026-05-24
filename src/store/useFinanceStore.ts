import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Category {
  id: string;
  nameEN: string;
  nameTH: string;
  emoji: string;
  icon: string; // Lucide icon name
  color: string;
  isCustom?: boolean;
}

export interface Transaction {
  id: string;
  type: 'expense' | 'income';
  amount: number;
  categoryId: string;
  note: string;
  date: string; // ISO string or YYYY-MM-DD
}

export interface Allocation {
  id: string;
  title: string;
  amount: number;
  status: 'pending' | 'spent';
  icon: string; // Lucide icon name
  categoryEmoji?: string;
  color?: string; // Hex color code
}

export interface LumpSum {
  id: string;
  title: string;
  amount: number; // Total initial windfall sum
  date: string;
  allocations: Allocation[];
}

export interface Goal {
  id: string;
  title: string;
  type: 'periodic' | 'target';
  targetAmount: number;
  currentAmount: number;
  deadline: string; // e.g., "Dec 2026" or "Recurring"
  icon: string;
  recurring?: boolean;
}

interface FinanceState {
  language: 'TH' | 'EN';
  netBalance: number; // Single central wallet balance
  monthlyBudgetGoal: number; // Goal for monthly income/savings relative to balance
  categories: Category[];
  transactions: Transaction[];
  lumpSums: LumpSum[];
  goals: Goal[];

  // Actions
  setLanguage: (lang: 'TH' | 'EN') => void;
  setMonthlyBudgetGoal: (amount: number) => void;
  adjustBalance: (amount: number) => void;
  
  // Transaction Actions
  addTransaction: (tx: Omit<Transaction, 'id'>) => void;
  deleteTransaction: (id: string) => void;
  
  // Lump Sum Actions
  addLumpSum: (lump: Omit<LumpSum, 'id' | 'allocations'> & { allocations: Omit<Allocation, 'id'>[] }) => void;
  deleteLumpSum: (id: string) => void;
  toggleAllocationStatus: (lumpSumId: string, allocationId: string) => void;
  updateAllocationAmount: (lumpSumId: string, allocationId: string, amount: number) => void;
  addAllocationToLumpSum: (lumpSumId: string, allocation: Omit<Allocation, 'id'>) => void;
  deleteAllocationFromLumpSum: (lumpSumId: string, allocationId: string) => void;

  // Goal Actions
  addGoal: (goal: Omit<Goal, 'id'>) => void;
  deleteGoal: (id: string) => void;
  contributeToGoal: (id: string, amount: number) => void;
  
  // Category Actions
  addCategory: (cat: Omit<Category, 'id' | 'isCustom'>) => void;
  deleteCategory: (id: string) => void;
  
  // Debug / Preset reset
  resetToDefault: () => void;
}

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-food', nameEN: 'Food', nameTH: 'อาหาร', emoji: '🍔', icon: 'Utensils', color: '#4edea3' },
  { id: 'cat-shop', nameEN: 'Shopping', nameTH: 'ช้อปปิ้ง', emoji: '🛍️', icon: 'ShoppingBag', color: '#adc6ff' },
  { id: 'cat-transport', nameEN: 'Transport', nameTH: 'เดินทาง', emoji: '🚗', icon: 'Car', color: '#ffb95f' },
  { id: 'cat-utilities', nameEN: 'Utilities', nameTH: 'ค่าน้ำค่าไฟ', emoji: '⚡', icon: 'Zap', color: '#fc7c78' },
  { id: 'cat-entertainment', nameEN: 'Entertainment', nameTH: 'ความบันเทิง', emoji: '🎬', icon: 'Film', color: '#a78bfa' },
  { id: 'cat-ai', nameEN: 'AI Tools', nameTH: 'ค่า AI', emoji: '🤖', icon: 'Cpu', color: '#38bdf8' },
  { id: 'cat-self-dev', nameEN: 'Self-Development', nameTH: 'พัฒนาตัวเอง', emoji: '🌱', icon: 'Sprout', color: '#a3e635' },
  { id: 'cat-books', nameEN: 'Books', nameTH: 'หนังสือ', emoji: '📚', icon: 'BookOpen', color: '#fbbf24' },
  { id: 'cat-salary', nameEN: 'Salary', nameTH: 'เงินเดือน', emoji: '💰', icon: 'Wallet', color: '#34d399' },
  { id: 'cat-bonus', nameEN: 'Bonus', nameTH: 'เงินพิเศษ', emoji: '🎁', icon: 'Gift', color: '#fb7185' },
  { id: 'cat-investment', nameEN: 'Investment', nameTH: 'ลงทุน', emoji: '📈', icon: 'TrendingUp', color: '#60a5fa' },
  { id: 'cat-business', nameEN: 'Business', nameTH: 'ธุรกิจ/ขายของ', emoji: '🏪', icon: 'Store', color: '#fbbf24' },
  { id: 'cat-other-income', nameEN: 'Other Income', nameTH: 'รายได้อื่น ๆ', emoji: '💵', icon: 'Banknote', color: '#f472b6' },
  { id: 'cat-project', nameEN: 'Project', nameTH: 'รายได้จากโปรเจกต์', emoji: '💼', icon: 'Briefcase', color: '#a78bfa' },
];

const DEFAULT_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-1',
    type: 'expense',
    amount: 1250,
    categoryId: 'cat-food',
    note: 'Sushi Zen',
    date: new Date().toISOString().split('T')[0], // Today
  },
  {
    id: 'tx-2',
    type: 'expense',
    amount: 500,
    categoryId: 'cat-transport',
    note: 'BTS Top Up',
    date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Yesterday
  },
  {
    id: 'tx-3',
    type: 'expense',
    amount: 450,
    categoryId: 'cat-entertainment',
    note: 'Cinema',
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 days ago
  },
  {
    id: 'tx-4',
    type: 'expense',
    amount: 8000,
    categoryId: 'cat-utilities',
    note: 'Rent',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  },
  {
    id: 'tx-5',
    type: 'income',
    amount: 32000,
    categoryId: 'cat-salary',
    note: 'Monthly Salary',
    date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  }
];

const DEFAULT_LUMP_SUMS: LumpSum[] = [
  {
    id: 'lump-1',
    title: 'Bonus 2026',
    amount: 50000,
    date: '2026-01-15',
    allocations: [
      {
        id: 'alloc-1',
        title: 'Rent for 3 Months',
        amount: 12000,
        status: 'spent',
        icon: 'Home',
        categoryEmoji: '🏠',
      },
      {
        id: 'alloc-2',
        title: 'Buy MacBook',
        amount: 35000,
        status: 'spent',
        icon: 'Laptop',
        categoryEmoji: '💻',
      },
      {
        id: 'alloc-3',
        title: 'Emergency Fund',
        amount: 3000,
        status: 'pending',
        icon: 'ShieldAlert',
        categoryEmoji: '🏥',
      },
    ],
  },
];

const DEFAULT_GOALS: Goal[] = [
  {
    id: 'goal-1',
    title: 'Buy New MacBook',
    type: 'target',
    targetAmount: 60000,
    currentAmount: 27000,
    deadline: 'Dec 2026',
    icon: 'Laptop',
  },
  {
    id: 'goal-2',
    title: 'Monthly Savings Target',
    type: 'periodic',
    targetAmount: 10000,
    currentAmount: 8000,
    deadline: 'Recurring',
    icon: 'PiggyBank',
  },
];

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set, get) => ({
      language: 'TH',
      netBalance: 24500, // Matches initial balance tag ฿24,500
      monthlyBudgetGoal: 27500, // Target amount on monthly progress
      categories: DEFAULT_CATEGORIES,
      transactions: DEFAULT_TRANSACTIONS,
      lumpSums: DEFAULT_LUMP_SUMS,
      goals: DEFAULT_GOALS,

      setLanguage: (lang) => set({ language: lang }),
      
      setMonthlyBudgetGoal: (amount) => set({ monthlyBudgetGoal: amount }),
      
      adjustBalance: (amount) => set((state) => ({ netBalance: state.netBalance + amount })),

      addTransaction: (tx) => {
        const id = `tx-${Date.now()}`;
        const newTx = { ...tx, id };
        
        set((state) => {
          const change = tx.type === 'income' ? tx.amount : -tx.amount;
          return {
            transactions: [newTx, ...state.transactions],
            netBalance: state.netBalance + change,
          };
        });
      },

      deleteTransaction: (id) => {
        set((state) => {
          const target = state.transactions.find((t) => t.id === id);
          if (!target) return {};
          
          const change = target.type === 'income' ? -target.amount : target.amount;
          return {
            transactions: state.transactions.filter((t) => t.id !== id),
            netBalance: state.netBalance + change,
          };
        });
      },

      addLumpSum: (lump) => {
        const lumpId = `lump-${Date.now()}`;
        const allocations = lump.allocations.map((alloc, idx) => ({
          ...alloc,
          id: `alloc-${Date.now()}-${idx}`,
        }));

        const newLump: LumpSum = {
          id: lumpId,
          title: lump.title,
          amount: lump.amount,
          date: lump.date,
          allocations,
        };

        set((state) => ({
          lumpSums: [...state.lumpSums, newLump],
          netBalance: state.netBalance + lump.amount, // Adding custom windfall to overall wallet balance
        }));
      },

      deleteLumpSum: (id) => {
        set((state) => {
          const target = state.lumpSums.find((l) => l.id === id);
          if (!target) return {};
          
          return {
            lumpSums: state.lumpSums.filter((l) => l.id !== id),
            netBalance: state.netBalance - target.amount, // Deduct the initial lump sum contribution
          };
        });
      },

      toggleAllocationStatus: (lumpSumId, allocationId) => {
        set((state) => {
          let txChange = 0;
          let addedTx: Transaction | null = null;

          const updatedLumps = state.lumpSums.map((lump) => {
            if (lump.id !== lumpSumId) return lump;

            const updatedAllocations = lump.allocations.map((alloc) => {
              if (alloc.id !== allocationId) return alloc;

              const newStatus = (alloc.status === 'pending' ? 'spent' : 'pending') as 'pending' | 'spent';
              
              // Automatically record or adjust transaction log when allocated funds are 'spent'
              if (newStatus === 'spent') {
                txChange = -alloc.amount;
                // Create auto transaction
                addedTx = {
                  id: `tx-auto-${Date.now()}`,
                  type: 'expense',
                  amount: alloc.amount,
                  categoryId: 'cat-utilities', // default utility or dynamic category
                  note: `[Allocated] ${alloc.title}`,
                  date: new Date().toISOString().split('T')[0],
                };
              } else {
                // If toggled back to pending, restore the money
                txChange = alloc.amount;
              }

              return { ...alloc, status: newStatus };
            });

            return { ...lump, allocations: updatedAllocations };
          });

          const nextTransactions = addedTx 
            ? [addedTx, ...state.transactions] 
            : state.transactions;

          return {
            lumpSums: updatedLumps,
            transactions: nextTransactions,
            netBalance: state.netBalance + txChange,
          };
        });
      },

      updateAllocationAmount: (lumpSumId, allocationId, amount) => {
        set((state) => {
          const updatedLumps = state.lumpSums.map((lump) => {
            if (lump.id !== lumpSumId) return lump;

            let prevAmount = 0;
            let currentStatus: string = 'pending';

            const updatedAllocations = lump.allocations.map((alloc) => {
              if (alloc.id !== allocationId) return alloc;
              prevAmount = alloc.amount;
              currentStatus = alloc.status;
              return { ...alloc, amount };
            });

            // If the allocation is already spent, modifying the amount will adjust netBalance
            const diff = amount - prevAmount;
            if (currentStatus === 'spent') {
              state.adjustBalance(-diff);
            }

            return { ...lump, allocations: updatedAllocations };
          });

          return { lumpSums: updatedLumps };
        });
      },

      addAllocationToLumpSum: (lumpSumId, allocation) => {
        set((state) => {
          const updatedLumps = state.lumpSums.map((lump) => {
            if (lump.id !== lumpSumId) return lump;
            const newAlloc: Allocation = {
              ...allocation,
              id: `alloc-${Date.now()}`,
            };
            return {
              ...lump,
              allocations: [...lump.allocations, newAlloc],
            };
          });
          return { lumpSums: updatedLumps };
        });
      },

      deleteAllocationFromLumpSum: (lumpSumId, allocationId) => {
        set((state) => {
          const updatedLumps = state.lumpSums.map((lump) => {
            if (lump.id !== lumpSumId) return lump;
            
            const targetAlloc = lump.allocations.find(a => a.id === allocationId);
            if (!targetAlloc) return lump;
            
            // If the deleted allocation was already marked as spent, refund it
            if (targetAlloc.status === 'spent') {
              state.adjustBalance(targetAlloc.amount);
            }

            return {
              ...lump,
              allocations: lump.allocations.filter(a => a.id !== allocationId),
            };
          });
          return { lumpSums: updatedLumps };
        });
      },

      addGoal: (goal) => {
        const id = `goal-${Date.now()}`;
        set((state) => ({
          goals: [...state.goals, { ...goal, id }],
        }));
      },

      deleteGoal: (id) => {
        set((state) => ({
          goals: state.goals.filter((g) => g.id !== id),
        }));
      },

      contributeToGoal: (id, amount) => {
        set((state) => {
          // Contributions deduct from net balance automatically and add to goal balance
          const updatedGoals = state.goals.map((g) => {
            if (g.id !== id) return g;
            return {
              ...g,
              currentAmount: Math.min(g.targetAmount, g.currentAmount + amount),
            };
          });

          // Log transaction
          const targetGoal = state.goals.find((g) => g.id === id);
          const autoTx: Transaction = {
            id: `tx-goal-${Date.now()}`,
            type: 'expense',
            amount: amount,
            categoryId: 'cat-investment',
            note: `Goal: ${targetGoal?.title || 'Contribute'}`,
            date: new Date().toISOString().split('T')[0],
          };

          return {
            goals: updatedGoals,
            netBalance: state.netBalance - amount,
            transactions: [autoTx, ...state.transactions],
          };
        });
      },

      addCategory: (cat) => {
        const id = `cat-custom-${Date.now()}`;
        set((state) => ({
          categories: [...state.categories, { ...cat, id, isCustom: true }],
        }));
      },

      deleteCategory: (id) => {
        set((state) => ({
          categories: state.categories.filter((c) => c.id !== id),
        }));
      },

      resetToDefault: () => {
        set({
          language: 'TH',
          netBalance: 24500,
          monthlyBudgetGoal: 27500,
          categories: DEFAULT_CATEGORIES,
          transactions: DEFAULT_TRANSACTIONS,
          lumpSums: DEFAULT_LUMP_SUMS,
          goals: DEFAULT_GOALS,
        });
      },
    }),
    {
      name: 'how-much-is-left-storage-v3',
    }
  )
);
