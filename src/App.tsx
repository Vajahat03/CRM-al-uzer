import { useEffect, useMemo, useState } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  ArrowUpRight, BarChart3, Bell, BriefcaseBusiness, Check, ChevronDown, CircleDollarSign,
  ClipboardList, FileSpreadsheet, LayoutDashboard, ListChecks, Menu, MoreHorizontal, Plus,
  Receipt, Search, Settings, ShoppingBag, Sparkles, Users, WalletCards, Wand, FileDown,
  Pencil, Trash2, Download, Upload, Bot, Smartphone,
} from 'lucide-react';
import './index.css';
import {
  CustomerRecord, Spending, WorkType, Category, WorkStatus, Page, Kirkol, TotalsSummary,
  calculateTotals, formatCurrency, formatDate, makeId,
} from './types';
import { autoSyncCustomer, autoSyncSpending, autoSyncKirkol, fullSyncToGoogleSheets } from './googleSheetsSync';
import { CustomerModal } from './CustomerModal';
import { SpendingModal } from './SpendingModal';
import { NameModal } from './NameModal';
import { WorkTypesPage } from './WorkTypesPage';
import { CustomersPage } from './CustomersPage';
import { SpendingPage } from './SpendingPage';
import { CategoriesAndStatusesPage } from './CategoriesAndStatusesPage';
import { CRMDashboard } from './CRMDashboard';
import { KirkolModal } from './KirkolModal';
import { GoogleSheetsPage } from './GoogleSheetsPage';
import { MonthlyReportModal } from './MonthlyReportModal';
import { ConfirmDialog } from './ConfirmDialog';
import { AIAssistantPage } from './AIAssistantPage';
import { SMSDashboardPage } from './sms/SMSDashboardPage';
import { SendSMSModal } from './sms/SendSMSModal';

const seedWorkTypes: WorkType[] = [
  { id: 'wt-1', name: 'PAN CARD 500', expense: 320, is_active: true },
  { id: 'wt-2', name: 'ELECTION', expense: 20, is_active: true },
  { id: 'wt-3', name: 'PAN CARD 400', expense: 220, is_active: true },
  { id: 'wt-4', name: 'DRIVING LICENSE (2W+4W TRANSPO', expense: 3500, is_active: true },
  { id: 'wt-5', name: 'AADHAR PAN LINK', expense: 1000, is_active: true },
  { id: 'wt-6', name: 'PASSPORT', expense: 2500, is_active: true },
  { id: 'wt-7', name: 'INCOME', expense: 170, is_active: true },
  { id: 'wt-8', name: 'PAN CARD 250', expense: 120, is_active: true },
  { id: 'wt-9', name: 'PAN CARD', expense: 100, is_active: true },
  { id: 'wt-10', name: 'DOMICILE', expense: 150, is_active: true },
  { id: 'wt-11', name: 'GAZETTE', expense: 300, is_active: true },
  { id: 'wt-12', name: 'AADHAR CARD', expense: 50, is_active: true },
  { id: 'wt-13', name: 'VOTER ID', expense: 30, is_active: true },
];

const defaultCategories: Category[] = ['Business', 'Utilities', 'Office supplies', 'Personal'].map((name, i) => ({ id: `cat-${i}`, name }));
const defaultStatuses: WorkStatus[] = ['Pending', 'In Progress', 'Payment Pending', 'Document Required', 'Completed', 'Delivered', 'Rejected', 'Cancelled'].map((name, i) => ({ id: `ws-${i}`, name }));

const fallbackCustomers: CustomerRecord[] = [
  { id: 'cust-1', customer_name: 'SAHAIL HAKIM SHAIKH TAKARE', mobile: '8177808656', work_type: 'PAN CARD 500', total_amount: 450, charges: 0, paid: 450, expense: 320, income: 130, payment_status: 'PAID', work_status: 'Pending', created_at: '2026-09-03T10:00:00Z' },
  { id: 'cust-2', customer_name: 'ILMODDIN LUKMAN SHAIKH', mobile: '9637609072', work_type: 'ELECTION', total_amount: 300, charges: 0, paid: 300, expense: 20, income: 280, payment_status: 'PAID', work_status: 'In Progress', created_at: '2026-09-03T10:30:00Z' },
  { id: 'cust-3', customer_name: 'SHAHADAT LUKMAN SHAIKH', mobile: '9637609072', work_type: 'ELECTION', total_amount: 300, charges: 0, paid: 300, expense: 20, income: 280, payment_status: 'PAID', work_status: 'Payment Pending', created_at: '2026-09-03T11:00:00Z' },
  { id: 'cust-4', customer_name: 'AYASHA MAZHAR HUSSAIN ANSARI', mobile: '7020936678', work_type: 'PAN CARD 400', total_amount: 400, charges: 0, paid: 400, expense: 220, income: 180, payment_status: 'PAID', work_status: 'Pending', created_at: '2026-09-03T11:30:00Z' },
  { id: 'cust-5', customer_name: 'NASIR RASHID KHAN', mobile: '9284217176', work_type: 'DRIVING LICENSE (2W+4W TRANSPO', total_amount: 5500, charges: 0, paid: 3500, expense: 3500, income: 2000, payment_status: 'PARTIAL', work_status: 'Pending', created_at: '2026-09-03T12:00:00Z' },
  { id: 'cust-6', customer_name: 'YASMEEN ILIYAS SHAIKH', mobile: '8888428035', work_type: 'AADHAR PAN LINK', total_amount: 1200, charges: 0, paid: 1200, expense: 1000, income: 200, payment_status: 'PAID', work_status: 'In Progress', created_at: '2026-09-02T10:00:00Z' },
  { id: 'cust-7', customer_name: 'GULBANO KUTUBODDIN NAGINEWALE', mobile: '', work_type: 'PASSPORT', total_amount: 3000, charges: 0, paid: 2500, expense: 2500, income: 500, payment_status: 'PARTIAL', work_status: 'Pending', created_at: '2026-09-02T11:00:00Z' },
  { id: 'cust-8', customer_name: 'KISHOR RAJARAM TAKARE', mobile: '', work_type: 'INCOME', total_amount: 250, charges: 0, paid: 250, expense: 170, income: 80, payment_status: 'PAID', work_status: 'In Progress', created_at: '2026-09-01T10:00:00Z' },
  { id: 'cust-9', customer_name: 'MADEEHA ASAD SAYYED', mobile: '9850578671', work_type: 'ELECTION', total_amount: 300, charges: 0, paid: 300, expense: 20, income: 280, payment_status: 'PAID', work_status: 'In Progress', created_at: '2026-09-01T11:00:00Z' },
  { id: 'cust-10', customer_name: 'ASAD SULTAN SAYYYED', mobile: '985078671', work_type: 'ELECTION', total_amount: 300, charges: 0, paid: 300, expense: 20, income: 280, payment_status: 'PAID', work_status: 'In Progress', created_at: '2026-09-01T11:30:00Z' },
  { id: 'cust-11', customer_name: 'SABA USMAN KHAN', mobile: '9422999478', work_type: 'PAN CARD 250', total_amount: 250, charges: 0, paid: 250, expense: 120, income: 130, payment_status: 'PAID', work_status: 'Pending', created_at: '2026-09-01T12:00:00Z' },
];

const fallbackKirkol: Kirkol[] = [
  { id: 'kir-1', work: '2000 MT T', price: 20, created_at: '2026-09-04T09:00:00Z' },
  { id: 'kir-2', work: 'AADHAAR', price: 60, created_at: '2026-09-04T09:15:00Z' },
  { id: 'kir-3', work: 'AADHAAR', price: 60, created_at: '2026-09-04T09:30:00Z' },
  { id: 'kir-4', work: 'ADHAAR', price: 60, created_at: '2026-09-04T09:45:00Z' },
  { id: 'kir-5', work: 'PVC CARD', price: 100, created_at: '2026-09-04T10:00:00Z' },
  { id: 'kir-6', work: '8000 ONLNE YUKUB BHAI J', price: 80, created_at: '2026-09-04T10:15:00Z' },
  { id: 'kir-7', work: 'PHOTO', price: 50, created_at: '2026-09-04T10:30:00Z' },
  { id: 'kir-8', work: '5000 MT', price: 50, created_at: '2026-09-04T10:45:00Z' },
  { id: 'kir-9', work: '2000 MT', price: 20, created_at: '2026-09-04T11:00:00Z' },
  { id: 'kir-10', work: '1000 MJ', price: 10, created_at: '2026-09-04T11:15:00Z' },
  { id: 'kir-11', work: 'AADHAAR', price: 60, created_at: '2026-09-04T11:30:00Z' },
  { id: 'kir-12', work: '2000MT T', price: 20, created_at: '2026-09-03T09:00:00Z' },
  { id: 'kir-13', work: 'COLOUR PRINT', price: 10, created_at: '2026-09-03T09:30:00Z' },
  { id: 'kir-14', work: 'AADHAR', price: 60, created_at: '2026-09-03T10:00:00Z' },
  { id: 'kir-15', work: '850 MT J', price: 10, created_at: '2026-09-03T10:30:00Z' },
  { id: 'kir-16', work: 'MHA ID', price: 100, created_at: '2026-09-03T11:00:00Z' },
  { id: 'kir-17', work: '500MT T', price: 10, created_at: '2026-09-03T11:30:00Z' },
  { id: 'kir-18', work: 'AADHAR', price: 120, created_at: '2026-09-03T12:00:00Z' },
  { id: 'kir-19', work: '500 MT J', price: 10, created_at: '2026-09-03T12:30:00Z' },
  { id: 'kir-20', work: '12500 MT J', price: 130, created_at: '2026-09-03T13:00:00Z' },
  { id: 'kir-21', work: '2000 MT T', price: 20, created_at: '2026-09-03T13:30:00Z' },
  { id: 'kir-22', work: '500 LADKI BAHEN J', price: 10, created_at: '2026-09-03T14:00:00Z' },
  { id: 'kir-23', work: '400 MT T', price: 10, created_at: '2026-09-03T14:30:00Z' },
  { id: 'kir-24', work: 'PHOTO', price: 50, created_at: '2026-09-03T15:00:00Z' },
  { id: 'kir-25', work: 'PHOTO', price: 50, created_at: '2026-09-03T15:30:00Z' },
  { id: 'kir-26', work: 'MAHA ID', price: 200, created_at: '2026-09-03T16:00:00Z' },
  { id: 'kir-27', work: 'LETTER HEAD', price: 80, created_at: '2026-09-03T16:30:00Z' },
  { id: 'kir-28', work: '10000 mt j', price: 100, created_at: '2026-09-03T17:00:00Z' },
  { id: 'kir-29', work: '2200 MT J', price: 30, created_at: '2026-09-03T17:30:00Z' },
  { id: 'kir-30', work: 'AADHAR', price: 60, created_at: '2026-09-03T18:00:00Z' },
  { id: 'kir-31', work: '2000 MONEY TRANSFER', price: 20, created_at: '2026-09-03T18:30:00Z' },
];

const LOCAL_STORAGE_KEYS = {
  CUSTOMERS: 'al_uzer_crm_customers',
  SPENDINGS: 'al_uzer_crm_spendings',
  KIRKOL: 'al_uzer_crm_kirkol',
  WORK_TYPES: 'al_uzer_crm_work_types',
  CATEGORIES: 'al_uzer_crm_categories',
  WORK_STATUSES: 'al_uzer_crm_work_statuses',
};

function loadFromLocalStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length === 0 && Array.isArray(fallback) && fallback.length > 0) {
      return fallback;
    }
    return parsed;
  } catch {
    return fallback;
  }
}

function saveToLocalStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('Failed to save to localStorage:', e);
  }
}

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined) || (import.meta.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined);
const supabaseKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) || (import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY as string | undefined);
const supabase: SupabaseClient | null = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

function App() {
  const [page, setPage] = useState<Page>('dashboard');
  const [workTypes, setWorkTypes] = useState<WorkType[]>(() =>
    loadFromLocalStorage(LOCAL_STORAGE_KEYS.WORK_TYPES, seedWorkTypes)
  );
  const [customers, setCustomers] = useState<CustomerRecord[]>(() =>
    loadFromLocalStorage(LOCAL_STORAGE_KEYS.CUSTOMERS, fallbackCustomers)
  );
  const [spendings, setSpendings] = useState<Spending[]>(() =>
    loadFromLocalStorage(LOCAL_STORAGE_KEYS.SPENDINGS, [])
  );
  const [categories, setCategories] = useState<Category[]>(() =>
    loadFromLocalStorage(LOCAL_STORAGE_KEYS.CATEGORIES, defaultCategories)
  );
  const [workStatuses, setWorkStatuses] = useState<WorkStatus[]>(() =>
    loadFromLocalStorage(LOCAL_STORAGE_KEYS.WORK_STATUSES, defaultStatuses)
  );
  const [kirkol, setKirkol] = useState<Kirkol[]>(() =>
    loadFromLocalStorage(LOCAL_STORAGE_KEYS.KIRKOL, fallbackKirkol)
  );

  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [showSpendingForm, setShowSpendingForm] = useState(false);
  const [showKirkolForm, setShowKirkolForm] = useState(false);
  const [showMonthlyReportModal, setShowMonthlyReportModal] = useState(false);
  const [editingKirkol, setEditingKirkol] = useState<Kirkol | null>(null);
  const [categoryModal, setCategoryModal] = useState<{ open: boolean; editing: Category | null }>({ open: false, editing: null });
  const [statusModal, setStatusModal] = useState<{ open: boolean; editing: WorkStatus | null }>({ open: false, editing: null });
  const [sendingSMSCustomer, setSendingSMSCustomer] = useState<CustomerRecord | null>(null);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState('');

  // Permanent browser storage sync
  useEffect(() => { saveToLocalStorage(LOCAL_STORAGE_KEYS.CUSTOMERS, customers); }, [customers]);
  useEffect(() => { saveToLocalStorage(LOCAL_STORAGE_KEYS.SPENDINGS, spendings); }, [spendings]);
  useEffect(() => { saveToLocalStorage(LOCAL_STORAGE_KEYS.KIRKOL, kirkol); }, [kirkol]);
  useEffect(() => { saveToLocalStorage(LOCAL_STORAGE_KEYS.WORK_TYPES, workTypes); }, [workTypes]);
  useEffect(() => { saveToLocalStorage(LOCAL_STORAGE_KEYS.CATEGORIES, categories); }, [categories]);
  useEffect(() => { saveToLocalStorage(LOCAL_STORAGE_KEYS.WORK_STATUSES, workStatuses); }, [workStatuses]);

  const [supabaseConnected, setSupabaseConnected] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    const load = async (): Promise<void> => {
      try {
        const [types, cust, spend, cats, wst, kir] = await Promise.all([
          supabase.from('work_types').select('*').order('name'),
          supabase.from('customer_records').select('*').order('created_at', { ascending: false }),
          supabase.from('spendings').select('*').order('created_at', { ascending: false }),
          supabase.from('spending_categories').select('*').order('name'),
          supabase.from('work_statuses').select('*').order('name'),
          supabase.from('kirkol').select('*').order('created_at', { ascending: false }),
        ]);

        if (!types.error && types.data?.length) {
          const remoteTypes = types.data as WorkType[];
          const localTypes = loadFromLocalStorage<WorkType[]>(LOCAL_STORAGE_KEYS.WORK_TYPES, []);
          const mergedMap = new Map<string, WorkType>();
          remoteTypes.forEach((t) => mergedMap.set(t.name.toUpperCase(), t));
          localTypes.forEach((t) => {
            if (!mergedMap.has(t.name.toUpperCase())) {
              mergedMap.set(t.name.toUpperCase(), t);
              if (supabase) {
                void supabase.from('work_types').upsert(t);
              }
            }
          });
          const mergedList = Array.from(mergedMap.values()).sort((a, b) => a.name.localeCompare(b.name));
          setWorkTypes(mergedList);
          saveToLocalStorage(LOCAL_STORAGE_KEYS.WORK_TYPES, mergedList);
        }

        if (!cust.error && cust.data?.length) setCustomers(cust.data as CustomerRecord[]);
        if (!spend.error && spend.data?.length) setSpendings(spend.data as Spending[]);
        if (!cats.error && cats.data?.length) setCategories(cats.data as Category[]);
        if (!wst.error && wst.data?.length) setWorkStatuses(wst.data as WorkStatus[]);
        if (!kir.error && kir.data?.length) setKirkol(kir.data as Kirkol[]);

        if (!cust.error && !types.error) {
          setSupabaseConnected(true);
        } else {
          setSupabaseConnected(false);
        }
      } catch (err) {
        console.warn('Database fetch note:', err);
        setSupabaseConnected(false);
      }
    };
    void load();
  }, []);

  // Verified single source of truth calculations
  const totals: TotalsSummary = useMemo(() => {
    return calculateTotals(customers, spendings, kirkol);
  }, [customers, spendings, kirkol]);

  const filteredCustomers = useMemo(
    () => customers.filter((row) => `${row.customer_name} ${row.mobile} ${row.work_type} ${row.id}`.toLowerCase().includes(search.toLowerCase())),
    [customers, search],
  );

  const notify = (message: string): void => { setToast(message); window.setTimeout(() => setToast(''), 2800); };

  const saveCustomer = async (data: Partial<CustomerRecord>, editingId?: string): Promise<void> => {
    let savedRecord: CustomerRecord;
    let nextCustomers: CustomerRecord[] = [];

    if (editingId) {
      savedRecord = {
        ...(customers.find((c) => c.id === editingId) || {}),
        ...data,
        id: editingId,
      } as CustomerRecord;

      if (supabase) {
        try {
          const response = await supabase.from('customer_records').update(data).eq('id', editingId).select().maybeSingle();
          if (response.data) savedRecord = response.data as CustomerRecord;
        } catch (e) {
          console.warn('Supabase customer update error:', e);
        }
      }

      nextCustomers = customers.map((row) => (row.id === editingId ? savedRecord : row));
      setCustomers(nextCustomers);
      notify('Customer record updated.');
    } else {
      const record: CustomerRecord = {
        id: makeId(),
        customer_name: data.customer_name!,
        mobile: data.mobile!,
        work_type: data.work_type!,
        total_amount: data.total_amount!,
        charges: data.charges ?? 0,
        paid: data.paid!,
        expense: data.expense!,
        income: data.income!,
        payment_status: data.payment_status!,
        work_status: data.work_status!,
        created_at: data.created_at || new Date().toISOString(),
      };
      savedRecord = record;

      if (supabase) {
        try {
          const response = await supabase.from('customer_records').insert(record).select().maybeSingle();
          if (response.data) savedRecord = response.data as CustomerRecord;
        } catch (e) {
          console.warn('Supabase customer insert error:', e);
        }
      }

      nextCustomers = [savedRecord, ...customers];
      setCustomers(nextCustomers);
      notify('Customer work saved successfully.');
    }

    if (savedRecord) {
      const d = new Date(savedRecord.created_at);
      void fullSyncToGoogleSheets(nextCustomers, spendings, kirkol, totals, d.getFullYear(), d.getMonth(), true);
    }
    setShowCustomerForm(false);
  };

  const deleteCustomer = async (id: string): Promise<void> => {
    const target = customers.find((c) => c.id === id);
    if (supabase) {
      try {
        await supabase.from('customer_records').delete().eq('id', id);
      } catch (e) {
        console.warn('Supabase customer delete error:', e);
      }
    }
    const updated = customers.filter((row) => row.id !== id);
    setCustomers(updated);
    notify('Customer record deleted.');
    if (target) {
      const d = new Date(target.created_at);
      void fullSyncToGoogleSheets(updated, spendings, kirkol, totals, d.getFullYear(), d.getMonth(), true);
    }
  };

  const saveSpending = async (data: Partial<Spending>, editingId?: string): Promise<void> => {
    let savedSpending: Spending;
    let nextSpendings: Spending[] = [];

    if (editingId) {
      savedSpending = {
        ...(spendings.find((s) => s.id === editingId) || {}),
        ...data,
        id: editingId,
      } as Spending;

      if (supabase) {
        try {
          const response = await supabase.from('spendings').update(data).eq('id', editingId).select().maybeSingle();
          if (response.data) savedSpending = response.data as Spending;
        } catch (e) {
          console.warn('Supabase spending update error:', e);
        }
      }

      nextSpendings = spendings.map((row) => (row.id === editingId ? savedSpending : row));
      setSpendings(nextSpendings);
      notify('Spending updated.');
    } else {
      const spending: Spending = {
        id: makeId(),
        expense_name: data.expense_name!,
        amount: data.amount!,
        category: data.category!,
        created_at: data.created_at || new Date().toISOString(),
      };
      savedSpending = spending;

      if (supabase) {
        try {
          const response = await supabase.from('spendings').insert(spending).select().maybeSingle();
          if (response.data) savedSpending = response.data as Spending;
        } catch (e) {
          console.warn('Supabase spending insert error:', e);
        }
      }

      nextSpendings = [savedSpending, ...spendings];
      setSpendings(nextSpendings);
      notify('Spending added to your records.');
    }

    if (savedSpending) {
      const d = new Date(savedSpending.created_at);
      void fullSyncToGoogleSheets(customers, nextSpendings, kirkol, totals, d.getFullYear(), d.getMonth(), true);
    }
    setShowSpendingForm(false);
  };

  const deleteSpending = async (id: string): Promise<void> => {
    const target = spendings.find((s) => s.id === id);
    if (supabase) {
      try {
        await supabase.from('spendings').delete().eq('id', id);
      } catch (e) {
        console.warn('Supabase spending delete error:', e);
      }
    }
    const updated = spendings.filter((row) => row.id !== id);
    setSpendings(updated);
    notify('Spending deleted.');
    if (target) {
      const d = new Date(target.created_at);
      void fullSyncToGoogleSheets(customers, updated, kirkol, totals, d.getFullYear(), d.getMonth(), true);
    }
  };

  const saveKirkol = async (data: Partial<Kirkol>, editingId?: string): Promise<void> => {
    let savedKirkol: Kirkol;
    let nextKirkol: Kirkol[] = [];

    if (editingId) {
      savedKirkol = {
        ...(kirkol.find((k) => k.id === editingId) || {}),
        ...data,
        id: editingId,
      } as Kirkol;

      if (supabase) {
        try {
          const response = await supabase.from('kirkol').update(data).eq('id', editingId).select().maybeSingle();
          if (response.data) savedKirkol = response.data as Kirkol;
        } catch (e) {
          console.warn('Supabase kirkol update error:', e);
        }
      }

      nextKirkol = kirkol.map((row) => (row.id === editingId ? savedKirkol : row));
      setKirkol(nextKirkol);
      notify('Kirkol updated.');
    } else {
      const record: Kirkol = {
        id: makeId(),
        work: data.work!,
        price: data.price!,
        created_at: data.created_at || new Date().toISOString(),
      };
      savedKirkol = record;

      if (supabase) {
        try {
          const response = await supabase.from('kirkol').insert(record).select().maybeSingle();
          if (response.data) savedKirkol = response.data as Kirkol;
        } catch (e) {
          console.warn('Supabase kirkol insert error:', e);
        }
      }

      nextKirkol = [savedKirkol, ...kirkol];
      setKirkol(nextKirkol);
      notify('Kirkol added successfully.');
    }

    if (savedKirkol) {
      const d = new Date(savedKirkol.created_at);
      void fullSyncToGoogleSheets(customers, spendings, nextKirkol, totals, d.getFullYear(), d.getMonth(), true);
    }
    setShowKirkolForm(false);
    setEditingKirkol(null);
  };

  const deleteKirkol = async (id: string): Promise<void> => {
    const target = kirkol.find((k) => k.id === id);
    if (supabase) {
      try {
        await supabase.from('kirkol').delete().eq('id', id);
      } catch (e) {
        console.warn('Supabase kirkol delete error:', e);
      }
    }
    const updated = kirkol.filter((row) => row.id !== id);
    setKirkol(updated);
    notify('Kirkol record deleted.');
    if (target) {
      const d = new Date(target.created_at);
      void fullSyncToGoogleSheets(customers, spendings, updated, totals, d.getFullYear(), d.getMonth(), true);
    }
  };

  const saveCategory = async (name: string, editingId?: string): Promise<void> => {
    if (editingId) {
      if (categories.some((c) => c.name.toLowerCase() === name.toLowerCase() && c.id !== editingId)) {
        notify('That category name is already used.');
        return;
      }
      if (supabase) {
        try {
          await supabase.from('spending_categories').update({ name }).eq('id', editingId);
        } catch (e) {
          console.warn('Supabase category update error:', e);
        }
      }
      setCategories((current) => current.map((c) => (c.id === editingId ? { ...c, name } : c)));
      notify('Category updated.');
    } else {
      if (categories.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
        notify('That category already exists.');
        return;
      }
      const cat: Category = { id: makeId(), name };
      if (supabase) {
        try {
          await supabase.from('spending_categories').insert(cat);
        } catch (e) {
          console.warn('Supabase category insert error:', e);
        }
      }
      setCategories((current) => [...current, cat]);
      notify('Category added.');
    }
    setCategoryModal({ open: false, editing: null });
  };

  const deleteCategory = async (id: string): Promise<void> => {
    if (supabase) {
      try {
        await supabase.from('spending_categories').delete().eq('id', id);
      } catch (e) {
        console.warn('Supabase category delete error:', e);
      }
    }
    setCategories((current) => current.filter((c) => c.id !== id));
    notify('Category deleted.');
  };

  const saveStatus = async (name: string, editingId?: string): Promise<void> => {
    if (editingId) {
      if (workStatuses.some((s) => s.name.toLowerCase() === name.toLowerCase() && s.id !== editingId)) {
        notify('That status name is already used.');
        return;
      }
      if (supabase) {
        try {
          await supabase.from('work_statuses').update({ name }).eq('id', editingId);
        } catch (e) {
          console.warn('Supabase status update error:', e);
        }
      }
      setWorkStatuses((current) => current.map((s) => (s.id === editingId ? { ...s, name } : s)));
      notify('Work status updated.');
    } else {
      if (workStatuses.some((s) => s.name.toLowerCase() === name.toLowerCase())) {
        notify('That work status already exists.');
        return;
      }
      const ws: WorkStatus = { id: makeId(), name };
      if (supabase) {
        try {
          await supabase.from('work_statuses').insert(ws);
        } catch (e) {
          console.warn('Supabase status insert error:', e);
        }
      }
      setWorkStatuses((current) => [...current, ws]);
      notify('Work status added.');
    }
    setStatusModal({ open: false, editing: null });
  };

  const deleteStatus = async (id: string): Promise<void> => {
    if (supabase) {
      try {
        await supabase.from('work_statuses').delete().eq('id', id);
      } catch (e) {
        console.warn('Supabase status delete error:', e);
      }
    }
    setWorkStatuses((current) => current.filter((s) => s.id !== id));
    notify('Work status deleted.');
  };

  const saveWorkType = async (data: Partial<WorkType>, editingId?: string): Promise<void> => {
    let nextList: WorkType[];
    if (editingId) {
      nextList = workTypes.map((row) => (row.id === editingId ? { ...row, ...data } : row));
      setWorkTypes(nextList);
      saveToLocalStorage(LOCAL_STORAGE_KEYS.WORK_TYPES, nextList);
      if (supabase) {
        try {
          await supabase.from('work_types').update(data).eq('id', editingId);
        } catch (e) {
          console.warn('Supabase work type update error:', e);
        }
      }
      notify('Work type updated & synced.');
    } else {
      const record: WorkType = {
        id: data.id || makeId(),
        name: data.name!,
        expense: data.expense ?? 0,
        is_active: data.is_active ?? true,
      };
      nextList = [...workTypes, record];
      setWorkTypes(nextList);
      saveToLocalStorage(LOCAL_STORAGE_KEYS.WORK_TYPES, nextList);
      if (supabase) {
        try {
          await supabase.from('work_types').upsert(record);
        } catch (e) {
          console.warn('Supabase work type insert error:', e);
        }
      }
      notify('Work type added & synced.');
    }
  };

  const deleteWorkType = async (id: string): Promise<void> => {
    const nextList = workTypes.filter((row) => row.id !== id);
    setWorkTypes(nextList);
    saveToLocalStorage(LOCAL_STORAGE_KEYS.WORK_TYPES, nextList);
    if (supabase) {
      try {
        await supabase.from('work_types').delete().eq('id', id);
      } catch (e) {
        console.warn('Supabase work type delete error:', e);
      }
    }
    notify('Work type deleted.');
  };

  const downloadBackup = () => {
    const backupData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      appName: 'Al Uzer CRM',
      customers,
      spendings,
      kirkol,
      workTypes,
      categories,
      workStatuses,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Al_Uzer_CRM_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    notify('Offline backup downloaded! Save this file in a safe place.');
  };

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        if (parsed.customers && Array.isArray(parsed.customers)) {
          setCustomers(parsed.customers);
        }
        if (parsed.spendings && Array.isArray(parsed.spendings)) {
          setSpendings(parsed.spendings);
        }
        if (parsed.kirkol && Array.isArray(parsed.kirkol)) {
          setKirkol(parsed.kirkol);
        }
        if (parsed.workTypes && Array.isArray(parsed.workTypes)) {
          setWorkTypes(parsed.workTypes);
        }
        if (parsed.categories && Array.isArray(parsed.categories)) {
          setCategories(parsed.categories);
        }
        if (parsed.workStatuses && Array.isArray(parsed.workStatuses)) {
          setWorkStatuses(parsed.workStatuses);
        }
        notify('Backup restored successfully! All records loaded.');
      } catch (err) {
        notify('Failed to restore: Invalid backup file format.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const navItems: { label: string; page: Page; icon: typeof LayoutDashboard }[] = [
    { label: 'Dashboard', page: 'dashboard', icon: LayoutDashboard },
    { label: 'SMS Reminders', page: 'sms-reminders', icon: Smartphone },
    { label: 'AI Assistant', page: 'ai-assistant', icon: Bot },
    { label: 'Customer Details', page: 'customers', icon: Users },
    { label: 'Spending', page: 'spending', icon: Receipt },
    { label: 'Work Types', page: 'work-types', icon: BriefcaseBusiness },
    { label: 'Categories & Statuses', page: 'categories', icon: ListChecks },
    { label: 'Income & Reports', page: 'income', icon: BarChart3 },
  ];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark"><Sparkles size={18} /></div><div><strong>Al Uzer</strong><span>COMMON SERVICES</span></div></div>
        <div className="workspace"><span className="eyebrow">WORKSPACE</span><button className="workspace-select">Main branch <ChevronDown size={14} /></button></div>
        <nav>{navItems.map(({ label, page: target, icon: Icon }) => <button key={target} className={`nav-item ${page === target ? 'active' : ''}`} onClick={() => setPage(target)}><Icon size={18} /><span>{label}</span>{target === 'customers' && <small>{customers.length}</small>}</button>)}</nav>
        <div className="sidebar-bottom">
          <button className={`nav-item ${page === 'sheets' ? 'active' : ''}`} onClick={() => setPage('sheets')}>
            <FileSpreadsheet size={18} /><span>Google Sheets</span><span className="connected-dot" />
          </button>
          <button className="nav-item" onClick={() => setShowMonthlyReportModal(true)}>
            <FileDown size={18} /><span>Monthly PDF Report</span>
          </button>
          <button className="nav-item" onClick={downloadBackup} title="Download a complete offline backup file of all records">
            <Download size={18} /><span>Backup Data (JSON)</span>
          </button>
          <label className="nav-item" style={{ cursor: 'pointer', margin: 0 }} title="Restore data from an offline backup file">
            <Upload size={18} /><span>Restore Backup</span>
            <input type="file" accept=".json" onChange={handleRestoreFile} style={{ display: 'none' }} />
          </label>
          <div className="profile"><div className="avatar">AK</div><div><strong>Admin account</strong><span>Business owner</span></div><MoreHorizontal size={17} /></div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="mobile-brand"><Menu size={20} /><strong>Al Uzer</strong></div>
          <div className="breadcrumbs"><span>Workspace</span><span>/</span><strong>{navItems.find((item) => item.page === page)?.label ?? (page === 'sheets' ? 'Google Sheets' : 'Dashboard')}</strong></div>
          <div className="top-actions">
            <div className="global-search"><Search size={17} /><input placeholder="Search customers, work types..." value={search} onChange={(event) => setSearch(event.target.value)} /></div>
            <button className="button secondary" style={{ padding: '7px 12px', fontSize: '11px' }} onClick={downloadBackup} title="Download instant offline backup">
              <Download size={14} /> <span>Backup</span>
            </button>
            <button className="button secondary" style={{ padding: '7px 12px', fontSize: '11px' }} onClick={() => setShowMonthlyReportModal(true)} title="Generate Monthly PDF Report">
              <FileDown size={14} /> <span>PDF Report</span>
            </button>
            <button className="icon-button"><Bell size={18} /><i /></button>
            <div className="top-avatar">AK</div>
          </div>
        </header>

        <div className="page-content">
          {page === 'dashboard' && (
            <CRMDashboard
              customers={customers}
              spendings={spendings}
              kirkol={kirkol}
              categories={categories}
              workTypes={workTypes}
              workStatuses={workStatuses}
              onSaveCustomer={saveCustomer}
              onDeleteCustomer={deleteCustomer}
              onAddCustomer={() => setShowCustomerForm(true)}
              onAddKirkol={() => setShowKirkolForm(true)}
              onOpenMonthlyReport={() => setShowMonthlyReportModal(true)}
              onOpenAIAssistant={() => setPage('ai-assistant')}
              onOpenSMSReminders={() => setPage('sms-reminders')}
            />
          )}
          {page === 'customers' && (
            <CustomersPage
              customers={filteredCustomers}
              workTypes={workTypes}
              workStatuses={workStatuses}
              search={search}
              onSearch={setSearch}
              onAdd={() => setShowCustomerForm(true)}
              onEdit={() => { }}
              onDelete={() => { }}
              onSendSMS={(row) => setSendingSMSCustomer(row)}
              saveCustomer={saveCustomer}
              deleteCustomer={deleteCustomer}
            />
          )}
          {page === 'spending' && (
            <SpendingPage
              spendings={spendings}
              categories={categories}
              onAdd={() => setShowSpendingForm(true)}
              saveSpending={saveSpending}
              deleteSpending={deleteSpending}
              onAddCategory={() => setCategoryModal({ open: true, editing: null })}
            />
          )}
          {page === 'work-types' && (
            <WorkTypesPage
              workTypes={workTypes}
              onSaveWorkType={saveWorkType}
              onDeleteWorkType={deleteWorkType}
              setWorkTypes={setWorkTypes}
              notify={notify}
            />
          )}
          {page === 'categories' && (
            <CategoriesAndStatusesPage
              categories={categories}
              workStatuses={workStatuses}
              onAddCategory={(name) => saveCategory(name)}
              onEditCategory={(cat) => setCategoryModal({ open: true, editing: cat })}
              onDeleteCategory={(cat) => deleteCategory(cat.id)}
              onAddStatus={(name) => saveStatus(name)}
              onEditStatus={(ws) => setStatusModal({ open: true, editing: ws })}
              onDeleteStatus={(ws) => deleteStatus(ws.id)}
              notify={notify}
            />
          )}
          {page === 'income' && (
            <Income
              customers={customers}
              spendings={spendings}
              kirkol={kirkol}
              totals={totals}
              onCustomer={() => setShowCustomerForm(true)}
              onSpending={() => setShowSpendingForm(true)}
              onKirkol={() => { setEditingKirkol(null); setShowKirkolForm(true); }}
              onEditKirkol={(item) => { setEditingKirkol(item); setShowKirkolForm(true); }}
              onDeleteKirkol={deleteKirkol}
              onMonthlyReport={() => setShowMonthlyReportModal(true)}
              onNavigate={setPage}
            />
          )}
          {page === 'sheets' && (
            <GoogleSheetsPage
              customers={customers}
              spendings={spendings}
              kirkol={kirkol}
              totals={totals}
              notify={notify}
            />
          )}
          {page === 'sms-reminders' && (
            <SMSDashboardPage
              customers={customers}
              supabase={supabase}
              notify={notify}
            />
          )}
          {page === 'ai-assistant' && (
            <AIAssistantPage
              customers={customers}
              spendings={spendings}
              kirkol={kirkol}
              workTypes={workTypes}
              categories={categories}
              workStatuses={workStatuses}
              totals={totals}
              supabaseConnected={supabase !== null}
              onNavigate={setPage}
              onFilterCustomers={(q) => setSearch(q)}
              onOpenMonthlyReport={() => setShowMonthlyReportModal(true)}
              notify={notify}
            />
          )}
        </div>
      </main>

      {showCustomerForm && (
        <CustomerModal
          workTypes={workTypes}
          workStatuses={workStatuses}
          customers={customers}
          onClose={() => setShowCustomerForm(false)}
          onSubmit={saveCustomer}
        />
      )}
      {showSpendingForm && (
        <SpendingModal
          categories={categories}
          onClose={() => setShowSpendingForm(false)}
          onSubmit={saveSpending}
          onAddCategory={() => setCategoryModal({ open: true, editing: null })}
        />
      )}
      {showKirkolForm && (
        <KirkolModal
          editing={editingKirkol}
          onClose={() => {
            setShowKirkolForm(false);
            setEditingKirkol(null);
          }}
          onSubmit={saveKirkol}
        />
      )}
      {showMonthlyReportModal && (
        <MonthlyReportModal
          customers={customers}
          spendings={spendings}
          kirkol={kirkol}
          onClose={() => setShowMonthlyReportModal(false)}
        />
      )}
      {sendingSMSCustomer && (
        <SendSMSModal
          customer={sendingSMSCustomer}
          onClose={() => setSendingSMSCustomer(null)}
          onSent={notify}
        />
      )}
      {categoryModal.open && (
        <NameModal
          title={categoryModal.editing ? 'Edit category' : 'Add category'}
          label="Category name"
          placeholder="e.g. Rent"
          editing={categoryModal.editing?.name ?? null}
          onClose={() => setCategoryModal({ open: false, editing: null })}
          onSubmit={(name) => saveCategory(name, categoryModal.editing?.id)}
        />
      )}
      {statusModal.open && (
        <NameModal
          title={statusModal.editing ? 'Edit work status' : 'Add work status'}
          label="Status name"
          placeholder="e.g. On Hold"
          editing={statusModal.editing?.name ?? null}
          onClose={() => setStatusModal({ open: false, editing: null })}
          onSubmit={(name) => saveStatus(name, statusModal.editing?.id)}
        />
      )}
      {toast && (
        <div className="toast">
          <Check size={17} />
          {toast}
        </div>
      )}
    </div>
  );
}

function Metric({ icon: Icon, label, value, change, detail, tone, down }: { icon: typeof CircleDollarSign; label: string; value: string; change?: string; detail?: string; tone: string; down?: boolean }) { return <div className="metric-card"><div className={`metric-icon ${tone}`}><Icon size={19} /></div><span className="metric-label">{label}</span><strong className="metric-value">{value}</strong>{change ? <span className={`metric-change ${down ? 'down' : ''}`}><ArrowUpRight size={13} />{change} <em>vs last month</em></span> : <span className="metric-detail">{detail}</span>}</div>; }
function LegendRow({ label, value, color, customHex }: { label: string; value: string; color?: string; customHex?: string }) {
  return (
    <div className="legend-row">
      <i className={`legend-dot ${color || ''}`} style={customHex ? { background: customHex } : undefined} />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Income({
  customers,
  spendings,
  kirkol,
  totals,
  onCustomer,
  onSpending,
  onKirkol,
  onEditKirkol,
  onDeleteKirkol,
  onMonthlyReport,
  onNavigate,
}: {
  customers: CustomerRecord[];
  spendings: Spending[];
  kirkol: Kirkol[];
  totals: TotalsSummary;
  onCustomer: () => void;
  onSpending: () => void;
  onKirkol: () => void;
  onEditKirkol: (item: Kirkol) => void;
  onDeleteKirkol: (id: string) => Promise<void>;
  onMonthlyReport: () => void;
  onNavigate: (page: Page) => void;
}) {
  const [deletingKirkol, setDeletingKirkol] = useState<Kirkol | null>(null);

  const groups = useMemo(() => {
    return Array.from(customers.reduce((map, row) => {
      const current = map.get(row.work_type) ?? { count: 0, total: 0, expense: 0, income: 0 };
      map.set(row.work_type, { count: current.count + 1, total: current.total + row.total_amount, expense: current.expense + row.expense, income: current.income + row.income });
      return map;
    }, new Map<string, { count: number; total: number; expense: number; income: number }>()).entries());
  }, [customers]);

  // 1. Dynamic Bar Graph Data (Calculated from real records for the last 6 months)
  const barChartData = useMemo(() => {
    const now = new Date();
    const monthsList = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = d.getMonth();
      const monthShort = d.toLocaleString('en-IN', { month: 'short' });

      const monthCustomers = customers.filter((c) => {
        if (!c.created_at) return false;
        const cd = new Date(c.created_at);
        return cd.getFullYear() === year && cd.getMonth() === month;
      });
      const monthSpendings = spendings.filter((s) => {
        if (!s.created_at) return false;
        const sd = new Date(s.created_at);
        return sd.getFullYear() === year && sd.getMonth() === month;
      });
      const monthKirkol = kirkol.filter((k) => {
        if (!k.created_at) return false;
        const kd = new Date(k.created_at);
        return kd.getFullYear() === year && kd.getMonth() === month;
      });

      const custIncome = monthCustomers.reduce((sum, r) => sum + (Number(r.income) || 0), 0);
      const kirIncome = monthKirkol.reduce((sum, r) => sum + (Number(r.price) || 0), 0);
      const income = custIncome + kirIncome;

      const custExpense = monthCustomers.reduce((sum, r) => sum + (Number(r.expense) || 0), 0);
      const directSpending = monthSpendings.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
      const expense = custExpense + directSpending;

      monthsList.push({
        label: monthShort,
        fullName: `${d.toLocaleString('en-IN', { month: 'long' })} ${year}`,
        income,
        expense,
      });
    }

    const maxVal = Math.max(...monthsList.map((r) => Math.max(r.income, r.expense)), 5000);
    return { data: monthsList, maxVal };
  }, [customers, spendings, kirkol]);

  // 2. Dynamic Pie/Donut Chart Data (Calculated from real service requests)
  const donutData = useMemo(() => {
    if (!customers.length) {
      return {
        items: [],
        gradient: '#edf3ef',
        total: 0,
      };
    }
    const countMap = new Map<string, number>();
    customers.forEach((c) => {
      countMap.set(c.work_type, (countMap.get(c.work_type) || 0) + 1);
    });
    const sorted = Array.from(countMap.entries()).sort((a, b) => b[1] - a[1]);
    const top4 = sorted.slice(0, 4);
    const othersCount = sorted.slice(4).reduce((sum, [, count]) => sum + count, 0);

    const sliceColors = ['#167c57', '#3b82f6', '#f59e0b', '#8b5cf6', '#64748b'];
    const total = customers.length;

    const items = top4.map(([name, count], index) => ({
      name,
      count,
      pct: Math.round((count / total) * 100),
      color: sliceColors[index % sliceColors.length],
    }));

    if (othersCount > 0) {
      items.push({
        name: 'Other services',
        count: othersCount,
        pct: Math.round((othersCount / total) * 100),
        color: sliceColors[4],
      });
    }

    let currentPct = 0;
    const gradientParts = items.map((item) => {
      const start = currentPct;
      currentPct += (item.count / total) * 100;
      return `${item.color} ${start.toFixed(1)}% ${currentPct.toFixed(1)}%`;
    });

    return {
      items,
      gradient: `conic-gradient(${gradientParts.join(', ')})`,
      total,
    };
  }, [customers]);

  const confirmDeleteKirkol = async (): Promise<void> => {
    if (!deletingKirkol) return;
    await onDeleteKirkol(deletingKirkol.id);
    setDeletingKirkol(null);
  };

  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow accent">OVERVIEW</span>
          <h1>Income & Reports</h1>
          <p>Verified financial metrics with live calculations and breakdown.</p>
        </div>
        <div className="heading-actions">
          <button className="button secondary" onClick={onMonthlyReport}><FileDown size={16} /> Monthly PDF</button>
          <button className="button secondary" onClick={onSpending}><Plus size={16} /> Add spending</button>
          <button className="button kirkol-btn" onClick={onKirkol}><Wand size={16} /> Kirkol</button>
          <button className="button primary" onClick={onCustomer}><Plus size={16} /> Add customer</button>
        </div>
      </div>

      <div className="date-strip">
        <div className="date-range"><span className="calendar-dot" /> Live Financial Breakdown <ChevronDown size={14} /></div>
        <span className="muted">Single Source of Truth Calculations</span>
      </div>

      {/* Verified Core Calculation Summary */}
      <section className="report-summary-grid">
        <div className="report-summary-card">
          <span className="report-summary-label">Total spending</span>
          <strong className="report-summary-value">{formatCurrency(totals.totalSpending)}</strong>
        </div>
        <div className="report-summary-card">
          <span className="report-summary-label">Total income</span>
          <strong className="report-summary-value">{formatCurrency(totals.totalIncome)}</strong>
        </div>
        <div className="report-summary-card" style={{ background: '#eaf6ef', borderColor: '#b2e2c8' }}>
          <span className="report-summary-label" style={{ color: '#167c57', fontWeight: 700 }}>Remaining amount</span>
          <strong className="report-summary-value remaining">{formatCurrency(totals.remainingAmount)}</strong>
        </div>
        <div className="report-summary-card">
          <span className="report-summary-label">Sum of total amount</span>
          <strong className="report-summary-value">{formatCurrency(totals.totalAmount)}</strong>
        </div>
        <div className="report-summary-card kirkol-card">
          <span className="report-summary-label">Total kirkol price</span>
          <strong className="report-summary-value kirkol-text">{formatCurrency(totals.kirkolIncome)}</strong>
        </div>
      </section>

      <section className="metric-grid">
        <Metric icon={CircleDollarSign} label="Total income" value={formatCurrency(totals.totalIncome)} change="12.8%" tone="green" />
        <Metric icon={WalletCards} label="Total spending" value={formatCurrency(totals.totalSpending)} change="4.2%" tone="amber" down />
        <Metric icon={ClipboardList} label="Pending payments" value={formatCurrency(totals.pendingAmount)} detail="Needs collection" tone="orange" />
        <Metric icon={ShoppingBag} label="Pending work" value={String(totals.pendingWorkCount).padStart(2, '0')} detail="Jobs in progress" tone="blue" />
      </section>

      <div className="dashboard-grid">
        {/* Dynamic Monthly Income & Expense Bar Graph */}
        <section className="panel chart-panel">
          <div className="panel-header">
            <div>
              <h2>Income & Expense Overview</h2>
              <p>Live monthly profit vs expenses distribution</p>
            </div>
            <button className="select-button" onClick={onMonthlyReport}><FileDown size={14} /> Download PDF</button>
          </div>
          <div className="chart-legend">
            <span><i className="legend-income" /> Income (Profit)</span>
            <span><i className="legend-expense" /> Expenses</span>
          </div>
          <div className="bar-chart">
            {barChartData.data.map((item) => {
              const incomeHeight = Math.min(Math.max((item.income / barChartData.maxVal) * 100, item.income > 0 ? 6 : 2), 100);
              const expenseHeight = Math.min(Math.max((item.expense / barChartData.maxVal) * 100, item.expense > 0 ? 6 : 2), 100);
              return (
                <div className="bar-group" key={item.label} title={`${item.fullName}\nIncome: ${formatCurrency(item.income)}\nExpense: ${formatCurrency(item.expense)}`}>
                  <div className="bar-stack">
                    <span className="bar income" style={{ height: `${incomeHeight}%` }} />
                    <span className="bar expense" style={{ height: `${expenseHeight}%` }} />
                  </div>
                  <label>{item.label}</label>
                </div>
              );
            })}
          </div>
          <div className="axis">
            <span>₹0</span>
            <span>{formatCurrency(barChartData.maxVal * 0.25)}</span>
            <span>{formatCurrency(barChartData.maxVal * 0.5)}</span>
            <span>{formatCurrency(barChartData.maxVal * 0.75)}</span>
            <span>{formatCurrency(barChartData.maxVal)}</span>
          </div>
        </section>

        {/* Dynamic Work Type Donut / Pie Chart */}
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Work Type Distribution</h2>
              <p>Most requested services based on customer records</p>
            </div>
          </div>
          <div className="donut-wrap">
            <div className="donut" style={{ background: donutData.gradient }}>
              <div>
                <strong>{donutData.total}</strong>
                <span>Total jobs</span>
              </div>
            </div>
            <div className="donut-list">
              {donutData.items.length > 0 ? (
                donutData.items.map((item) => (
                  <LegendRow
                    key={item.name}
                    label={`${item.name} (${item.count})`}
                    value={`${item.pct}%`}
                    customHex={item.color}
                  />
                ))
              ) : (
                <div style={{ color: '#888', fontSize: '12px', padding: '10px 0' }}>No customer records logged yet.</div>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* 3. Dedicated Kirkol (Miscellaneous Counter Sales) Table */}
      <section className="panel table-panel" style={{ marginTop: '18px' }}>
        <div className="panel-header" style={{ padding: '20px 20px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2>Kirkol Work & Price Ledger</h2>
              <span className="work-pill" style={{ background: '#fff0ea', color: '#e8753a', fontWeight: 700 }}>
                {kirkol.length} entries · Total {formatCurrency(totals.kirkolIncome)}
              </span>
            </div>
            <p>Miscellaneous direct counter work, printing, Xerox, and daily counter transactions.</p>
          </div>
          <button className="button kirkol-btn" onClick={onKirkol}>
            <Wand size={15} /> Add Kirkol
          </button>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th style={{ width: '60px' }}>#</th>
                <th>Work description</th>
                <th>Price</th>
                <th>Date</th>
                <th style={{ width: '80px' }} />
              </tr>
            </thead>
            <tbody>
              {kirkol.map((item, idx) => (
                <tr key={item.id}>
                  <td><span className="table-index">{idx + 1}</span></td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: '#e8753a' }}><Wand size={14} /></span>
                      <strong>{item.work}</strong>
                    </div>
                  </td>
                  <td><strong style={{ color: '#167c57' }}>{formatCurrency(item.price)}</strong></td>
                  <td>{formatDate(item.created_at)}</td>
                  <td>
                    <div className="crm-row-actions">
                      <button className="crm-action-btn" onClick={() => onEditKirkol(item)} title="Edit Kirkol">
                        <Pencil size={13} />
                      </button>
                      <button className="crm-action-btn danger" onClick={() => setDeletingKirkol(item)} title="Delete Kirkol">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!kirkol.length && (
            <div className="empty-state">
              <p>No Kirkol entries recorded yet.</p>
              <button className="button kirkol-btn" style={{ marginTop: '8px' }} onClick={onKirkol}>
                <Wand size={15} /> Add first Kirkol entry
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Income by Work Type Table */}
      <section className="panel table-panel" style={{ marginTop: '18px' }}>
        <div className="panel-header" style={{ padding: '20px 20px 0' }}>
          <div>
            <h2>Income by Work Type</h2>
            <p>Aggregated turnover, direct expenses, and profit margins by service.</p>
          </div>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Work type</th>
                <th>Total jobs</th>
                <th>Total amount</th>
                <th>Expense</th>
                <th>Income (Profit)</th>
              </tr>
            </thead>
            <tbody>
              {groups.map(([name, row]) => (
                <tr key={name}>
                  <td><strong>{name}</strong></td>
                  <td>{row.count}</td>
                  <td>{formatCurrency(row.total)}</td>
                  <td>{formatCurrency(row.expense)}</td>
                  <td className="income-value">{formatCurrency(row.income)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!groups.length && <div className="empty-state">Add customer work to create your income summary.</div>}
        </div>
      </section>

      {/* Recent Transactions & Quick Actions */}
      <div className="lower-grid" style={{ marginTop: '18px' }}>
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Recent Transactions</h2>
              <p>Latest customer activity</p>
            </div>
            <button className="text-button" onClick={() => onNavigate('customers')}>View all <ArrowUpRight size={14} /></button>
          </div>
          <div className="transaction-list">
            {customers.slice(0, 4).map((row) => (
              <div className="transaction" key={row.id}>
                <div className="transaction-avatar">{row.customer_name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}</div>
                <div className="transaction-main">
                  <strong>{row.customer_name}</strong>
                  <span>{row.work_type} · {formatDate(row.created_at)}</span>
                </div>
                <div className="transaction-status">
                  <strong>{formatCurrency(row.total_amount)}</strong>
                  <span className={`status ${row.payment_status.toLowerCase()}`}>{row.payment_status}</span>
                </div>
              </div>
            ))}
            {!customers.length && <div className="empty-state" style={{ padding: '20px' }}>No transactions recorded yet.</div>}
          </div>
        </section>

        <section className="panel quick-panel">
          <div className="panel-header">
            <div>
              <h2>Quick Actions</h2>
              <p>Common tasks for your day</p>
            </div>
          </div>
          <button onClick={onCustomer}>
            <span className="quick-icon green-bg"><Users size={17} /></span>
            <span><strong>Add customer work</strong><small>Record a new transaction</small></span>
            <ArrowUpRight size={16} />
          </button>
          <button onClick={onKirkol}>
            <span className="quick-icon orange-bg" style={{ background: '#fff0ea', color: '#e8753a' }}><Wand size={17} /></span>
            <span><strong>Add Kirkol work</strong><small>Record counter Xerox, printouts</small></span>
            <ArrowUpRight size={16} />
          </button>
          <button onClick={onMonthlyReport}>
            <span className="quick-icon blue-bg"><FileDown size={17} /></span>
            <span><strong>Monthly PDF report</strong><small>Download customer & revenue summary</small></span>
            <ArrowUpRight size={16} />
          </button>
          <button onClick={() => onNavigate('sheets')}>
            <span className="quick-icon amber-bg"><FileSpreadsheet size={17} /></span>
            <span><strong>Google Sheets & Workspace</strong><small>Sync data to Google Drive</small></span>
            <ArrowUpRight size={16} />
          </button>
        </section>
      </div>

      {deletingKirkol && (
        <ConfirmDialog
          title="Delete Kirkol entry?"
          message={`"${deletingKirkol.work}" (₹${deletingKirkol.price}) will be permanently removed and income recalculated.`}
          onConfirm={() => void confirmDeleteKirkol()}
          onCancel={() => setDeletingKirkol(null)}
        />
      )}
    </>
  );
}

export default App;
