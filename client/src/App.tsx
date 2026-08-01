import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar, TabType } from './components/Sidebar';
import { DashboardView } from './pages/DashboardView';
import { SuppliersView } from './pages/SuppliersView';
import { PurchasesView } from './pages/PurchasesView';
import { DispatchesView } from './pages/DispatchesView';
import { LossesView } from './pages/LossesView';
import { AlertsView } from './pages/AlertsView';
import { ProductsView } from './pages/ProductsView';
import { TeamView } from './pages/TeamView';
import { LoginView } from './pages/LoginView';

import {
  Supplier,
  Product,
  Category,
  Purchase,
  Batch,
  Dispatch,
  Loss,
  DashboardMetrics,
  Department,
  Requester,
  User
} from './types';

export function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('nutri_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [recentDispatches, setRecentDispatches] = useState<Dispatch[]>([]);
  const [recentPurchases, setRecentPurchases] = useState<Purchase[]>([]);
  const [expiringBatches, setExpiringBatches] = useState<Batch[]>([]);
  const [losses, setLosses] = useState<Loss[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [requesters, setRequesters] = useState<Requester[]>([]);

  const handleLoginSuccess = (user: User, token: string) => {
    localStorage.setItem('nutri_user', JSON.stringify(user));
    localStorage.setItem('nutri_token', token);
    setCurrentUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem('nutri_user');
    localStorage.removeItem('nutri_token');
    setCurrentUser(null);
  };

  const fetchDashboard = async () => {
    try {
      const res = await fetch('/api/dashboard');
      if (res.ok) {
        const data = await res.json();
        setMetrics(data.metrics);
        setRecentDispatches(data.recentDispatches || []);
        setRecentPurchases(data.recentPurchases || []);
      }
    } catch (err) {
      console.error('Erro ao carregar dashboard', err);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const res = await fetch('/api/suppliers');
      if (res.ok) setSuppliers(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      if (res.ok) setProducts(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) setCategories(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPurchases = async () => {
    try {
      const res = await fetch('/api/purchases');
      if (res.ok) setPurchases(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBatches = async () => {
    try {
      const res = await fetch('/api/batches');
      if (res.ok) {
        const data = await res.json();
        setBatches(data);
        setExpiringBatches(data.filter((b: Batch) => b.urgency !== 'OK'));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLosses = async () => {
    try {
      const res = await fetch('/api/losses');
      if (res.ok) setLosses(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await fetch('/api/departments');
      if (res.ok) setDepartments(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRequesters = async () => {
    try {
      const res = await fetch('/api/requesters');
      if (res.ok) setRequesters(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const loadAll = () => {
    if (!currentUser) return;
    fetchDashboard();
    fetchSuppliers();
    fetchProducts();
    fetchCategories();
    fetchPurchases();
    fetchBatches();
    fetchLosses();
    fetchDepartments();
    fetchRequesters();
  };

  useEffect(() => {
    if (currentUser) {
      loadAll();
    }
  }, [currentUser]);

  // Mandatory Authentication Guard
  if (!currentUser) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  const totalAlertCount = (metrics?.expiredCount || 0) + (metrics?.criticalCount || 0);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header
        alertCount={totalAlertCount}
        onNavigateAlerts={() => setActiveTab('alerts')}
        isMobileMenuOpen={isMobileMenuOpen}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      <div className="flex-1 max-w-7xl w-full mx-auto flex flex-col md:flex-row">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          alertCount={totalAlertCount}
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
          onLogout={handleLogout}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              metrics={metrics}
              recentDispatches={recentDispatches}
              recentPurchases={recentPurchases}
              expiringBatches={expiringBatches}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === 'fefo-dispatch' && (
            <DispatchesView departments={departments} requesters={requesters} onRefreshAll={loadAll} />
          )}

          {activeTab === 'purchases' && (
            <PurchasesView
              suppliers={suppliers}
              products={products}
              categories={categories}
              purchases={purchases}
              onRefresh={loadAll}
            />
          )}

          {activeTab === 'suppliers' && (
            <SuppliersView suppliers={suppliers} onRefresh={loadAll} />
          )}

          {activeTab === 'team' && (
            <TeamView departments={departments} requesters={requesters} onRefresh={loadAll} />
          )}

          {activeTab === 'losses' && (
            <LossesView losses={losses} batches={batches} onRefreshAll={loadAll} />
          )}

          {activeTab === 'alerts' && (
            <AlertsView onNavigate={setActiveTab} />
          )}

          {activeTab === 'products' && (
            <ProductsView products={products} categories={categories} onRefresh={loadAll} />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
