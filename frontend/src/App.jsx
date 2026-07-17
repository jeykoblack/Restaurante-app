import { useEffect, useMemo, useRef, useState } from 'react';

const API_URL = 'http://46.183.112.122:3001';

function StatCard({ label, value, note }) {
  return (
    <div className="rounded-3xl border border-white/70 bg-white/85 p-5 shadow-[0_12px_30px_rgba(15,23,42,0.05)] backdrop-blur">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
      <p className="mt-2 text-xs text-slate-400">{note}</p>
    </div>
  );
}

function EmptyState({ title, text }) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center">
      <p className="text-base font-semibold text-slate-800">{title}</p>
      <p className="mt-2 text-sm text-slate-500">{text}</p>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-slate-600">{label}</span>
      {children}
    </label>
  );
}

const emptyTableForm = {
  number: '',
  name: '',
  capacity: '4',
  status: 'FREE',
};

const emptyCategoryForm = {
  name: '',
  sortOrder: '0',
};

const emptyProductForm = {
  name: '',
  categoryId: '',
  sku: '',
  description: '',
  price: '',
  taxRate: '0.18',
  preparationTimeMinutes: '15',
  imageUrl: '',
};



function SaaSPanel({ token, onLogout }) {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [resetTarget, setResetTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('TODOS');
  const [resetForm, setResetForm] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    slug: '',
    subdomain: '',
    ruc: '',
    phone: '',
    address: '',
    planType: 'TRIMESTRAL',
    amount: '',
    adminFirstName: '',
    adminLastName: '',
    adminEmail: '',
    adminPassword: '',
    branchName: 'Sucursal Principal',
    branchCode: '',
  });

  const [renewModalOpen, setRenewModalOpen] = useState(false);
const [selectedRestaurantToRenew, setSelectedRestaurantToRenew] = useState(null);
const [renewForm, setRenewForm] = useState({
  plan: 'TRIMESTRAL',
  amount: 150
});

  const fetchRestaurants = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/saas/restaurants`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'No se pudo cargar restaurantes');
      }
      setRestaurants(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Error al cargar restaurantes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchRestaurants();
    }
  }, [token]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const autoFillFromName = (value) => {
    const clean = value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '');

    setForm((prev) => ({
      ...prev,
      name: value,
      slug: prev.slug || clean,
      subdomain: prev.subdomain || clean,
      branchCode: prev.branchCode || `${clean}-main`,
    }));
  };

  const resetCreateForm = () => {
    setForm({
      name: '',
      slug: '',
      subdomain: '',
      ruc: '',
      phone: '',
      address: '',
      planType: 'TRIMESTRAL',
      amount: '',
      adminFirstName: '',
      adminLastName: '',
      adminEmail: '',
      adminPassword: '',
      branchName: 'Sucursal Principal',
      branchCode: '',
    });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        name: form.name,
        slug: form.slug,
        subdomain: form.subdomain,
        ruc: form.ruc || null,
        phone: form.phone || null,
        address: form.address || null,
        logoUrl: null,
        planType: form.planType,
        amount: form.amount ? Number(form.amount) : null,
        startsAt: new Date().toISOString(),
        endsAt:
          form.planType === 'ANUAL'
            ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
            : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        adminFirstName: form.adminFirstName,
        adminLastName: form.adminLastName,
        adminEmail: form.adminEmail,
        adminPassword: form.adminPassword,
        branchName: form.branchName,
        branchCode: form.branchCode,
      };

      const res = await fetch(`${API_URL}/saas/restaurants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'No se pudo crear el restaurante');
      }

      setSuccess('Restaurante creado correctamente.');
      resetCreateForm();
      await fetchRestaurants();
    } catch (err) {
      setError(err.message || 'Error al crear restaurante');
    } finally {
      setSaving(false);
    }
  };

  const getMainAdmin = (restaurant) => {
    if (!restaurant?.users?.length) return null;
    return restaurant.users[0];
  };

  const getMainBranch = (restaurant) => {
    if (!restaurant?.branches?.length) return null;
    return restaurant.branches[0];
  };

  const getLatestSubscription = (restaurant) => {
    if (!restaurant?.subscriptions?.length) return null;
    return restaurant.subscriptions[0];
  };

  const formatDate = (value) => {
    if (!value) return '-';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '-';
    return parsed.toLocaleDateString('es-PE');
  };

  const formatCurrency = (value) => {
    const num = Number(value);
    if (!Number.isFinite(num)) return '-';
    return `S/ ${num.toFixed(2)}`;
  };

  const getRestaurantDomain = (restaurant) => {
    const subdomain = String(restaurant?.subdomain || '').trim();
    if (!subdomain) return '-';
    return subdomain.includes('.') ? subdomain : `${subdomain}.smartmesa.com`;
  };

  const getRestaurantStatus = (restaurant) => {
    const raw = String(restaurant?.status || 'ACTIVE').toUpperCase();
    if (raw === 'SUSPENDED') return 'SUSPENDIDO';
    if (raw === 'INACTIVE') return 'INACTIVO';
    if (raw === 'DELETED') return 'ELIMINADO';
    return 'ACTIVO';
  };

  const getStatusTone = (restaurant) => {
    const status = getRestaurantStatus(restaurant);
    if (status === 'SUSPENDIDO') return 'bg-slate-200 text-slate-700';
    if (status === 'INACTIVO') return 'bg-amber-100 text-amber-700';
    if (status === 'ELIMINADO') return 'bg-rose-100 text-rose-700';
    return 'bg-emerald-100 text-emerald-700';
  };

  const getDaysRemaining = (restaurant) => {
    const subscription = getLatestSubscription(restaurant);
    const endValue = subscription?.endsAt || restaurant?.expiresAt;
    if (!endValue) return null;
    const endDate = new Date(endValue);
    if (Number.isNaN(endDate.getTime())) return null;
    const diff = Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const getRemainingLabel = (restaurant) => {
    const days = getDaysRemaining(restaurant);
    if (days == null) return 'Sin fecha';
    if (days < 0) return `Vencido hace ${Math.abs(days)} día${Math.abs(days) === 1 ? '' : 's'}`;
    if (days === 0) return 'Vence hoy';
    if (days === 1) return 'Vence mañana';
    return `Vence en ${days} días`;
  };

const handleRenewSubscription = async (e) => {
  e.preventDefault();
  
  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    const token = localStorage.getItem('mesa_pro_token'); 

    const response = await fetch(`${apiUrl}/saas/restaurants/${selectedRestaurantToRenew.id}/renew`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        plan: renewForm.plan,
        amount: parseFloat(renewForm.amount) // Aseguramos que sea número
      })
    });

    if (response.ok) {
      // 1. Cierra el modal primero
      setRenewModalOpen(false);
      
      // 2. Refresca los datos del dashboard para que sume el nuevo monto
      // Asegúrate de que esta función esté disponible en este scope
      await fetchRestaurants(); 
      
      // 3. Notifica al usuario
      alert('Suscripción reactivada con éxito');
    } else {
      alert('Error al procesar la renovación');
    }
  } catch (error) {
    console.error("Detalle del error:", error);
    alert("Error real: " + error.message);
  }
};
  const openDetailsModal = (restaurant) => {
    setSelectedRestaurant(restaurant);
    setShowDetailsModal(true);
  };

  const openResetModal = (restaurant) => {
    setResetTarget(restaurant);
    setResetForm({ newPassword: '', confirmPassword: '' });
    setShowResetModal(true);
  };

  const openDeleteModal = (restaurant) => {
    setDeleteTarget(restaurant);
    setDeleteConfirmationText('');
    setShowDeleteModal(true);
  };

  const closeAllModals = () => {
    setShowDetailsModal(false);
    setShowResetModal(false);
    setShowDeleteModal(false);
    setSelectedRestaurant(null);
    setResetTarget(null);
    setDeleteTarget(null);
    setResetForm({ newPassword: '', confirmPassword: '' });
    setDeleteConfirmationText('');
  };

  const handleResetPassword = async () => {
    if (!resetTarget) return;

    if (!resetForm.newPassword || !resetForm.confirmPassword) {
      setError('Completa la nueva contraseña y su confirmación.');
      return;
    }

    if (resetForm.newPassword.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (resetForm.newPassword !== resetForm.confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    const adminUser = getMainAdmin(resetTarget);
    if (!adminUser?.id) {
      setError('No se encontró un usuario administrador para este restaurante.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`${API_URL}/saas/restaurants/${resetTarget.id}/reset-password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: adminUser.id,
          newPassword: resetForm.newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'No se pudo restablecer la contraseña');
      }

      setSuccess('Contraseña restablecida correctamente.');
      closeAllModals();
      await fetchRestaurants();
    } catch (err) {
      setError(err.message || 'Error al restablecer la contraseña');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRestaurant = async () => {
    if (!deleteTarget) return;

    if (deleteConfirmationText !== 'ELIMINAR') {
      setError('Debes escribir ELIMINAR para confirmar.');
      return;
    }

    setDeleting(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`${API_URL}/saas/restaurants/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || 'No se pudo eliminar el restaurante');
      }

      setSuccess('Restaurante eliminado correctamente.');
      closeAllModals();
      await fetchRestaurants();
    } catch (err) {
      setError(err.message || 'Error al eliminar restaurante');
    } finally {
      setDeleting(false);
    }
  };

  const restaurantInDetails = selectedRestaurant || null;
  const detailsAdmin = restaurantInDetails ? getMainAdmin(restaurantInDetails) : null;
  const detailsBranch = restaurantInDetails ? getMainBranch(restaurantInDetails) : null;
  const detailsSubscription = restaurantInDetails ? getLatestSubscription(restaurantInDetails) : null;

  const filteredRestaurants = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return restaurants.filter((restaurant) => {
      const admin = getMainAdmin(restaurant);
      const status = getRestaurantStatus(restaurant);

      const matchesSearch =
        !term ||
        restaurant.name?.toLowerCase().includes(term) ||
        restaurant.slug?.toLowerCase().includes(term) ||
        restaurant.subdomain?.toLowerCase().includes(term) ||
        restaurant.ruc?.toLowerCase().includes(term) ||
        admin?.email?.toLowerCase().includes(term);

      const matchesStatus = statusFilter === 'TODOS' || status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [restaurants, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const active = restaurants.filter((item) => getRestaurantStatus(item) === 'ACTIVO').length;
    const suspended = restaurants.filter((item) => getRestaurantStatus(item) === 'SUSPENDIDO').length;
    const annual = restaurants.filter((item) => {
      const subscription = getLatestSubscription(item);
      const plan = subscription?.planType || item?.planType || '';
      return String(plan).toUpperCase() === 'ANUAL';
    }).length;const monthlyRevenue = restaurants.reduce((acc, restaurant) => {
      if (restaurant.subscriptions && restaurant.subscriptions.length > 0) {
        const totalHistorial = restaurant.subscriptions.reduce((sum, sub) => sum + (Number(sub.amount) || 0), 0);
        return acc + totalHistorial;
      }
      return acc + (Number(restaurant.amount) || 0);
    }, 0);

    return { active, suspended, annual, monthlyRevenue };
  }, [restaurants]);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 shrink-0 border-r border-slate-900/80 bg-slate-950 text-white lg:flex lg:flex-col">
          <div className="border-b border-white/10 p-6">
            <div className="inline-flex items-center gap-2 rounded-md bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              SmartMesa
            </div>
            <h1 className="mt-4 text-3xl font-bold">SaaS Control</h1>
            <p className="mt-2 text-sm text-slate-300">
              Supervisa clientes, accesos y suscripciones sin salir del panel.
            </p>
          </div>

          <div className="space-y-2 p-6 text-sm">
            <div className="rounded-md border border-white/10 bg-white/5 px-4 py-3 font-semibold text-white">
              Dashboard 
            </div>
            <div className="rounded-md px-4 py-3 text-slate-400">Restaurantes</div>
            <div className="rounded-md px-4 py-3 text-slate-400">Suscripciones</div>
            <div className="rounded-md px-4 py-3 text-slate-400">Renovaciones</div>
            <div className="rounded-md px-4 py-3 text-slate-400">Configuración</div>
          </div>

          <div className="mt-auto space-y-4 border-t border-white/10 p-6">
            <div className="rounded-md border border-emerald-500/20 bg-emerald-500/10 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-emerald-300">Estado</p>
              <p className="mt-2 text-2xl font-bold">{stats.active}</p>
              <p className="text-sm text-slate-300">restaurantes activos</p>
            </div>
            <button
              onClick={onLogout}
              className="w-full rounded-md border border-white/15 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/5"
            >
              Cerrar sesión
            </button>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="border-b border-slate-200 bg-white">
            <div className="px-4 py-4 sm:px-6 lg:px-8">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">SmartMesa / Super Admin</p>
                  <h2 className="text-2xl font-bold tracking-tight">Panel de control SaaS</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Administra restaurantes, credenciales y planes desde una sola vista.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar restaurante, slug, RUC o correo..."
                    className="w-full rounded-md border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500 sm:w-80"
                  />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="rounded-md border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500"
                  >
                    <option value="TODOS">Todos</option>
                    <option value="ACTIVO">Activos</option>
                    <option value="SUSPENDIDO">Suspendidos</option>
                    <option value="INACTIVO">Inactivos</option>
                    <option value="ELIMINADO">Eliminados</option>
                  </select>
                  <button
                    onClick={fetchRestaurants}
                    className="rounded-md border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Recargar
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6 p-4 sm:p-6 lg:p-8">
            {error ? (
              <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            ) : null}

            {success ? (
              <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {success}
              </div>
            ) : null}

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Total restaurantes</p>
                <p className="mt-2 text-3xl font-bold">{restaurants.length}</p>
                <p className="mt-1 text-xs text-slate-400">Clientes registrados en la plataforma</p>
              </div>
              <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Activos</p>
                <p className="mt-2 text-3xl font-bold">{stats.active}</p>
                <p className="mt-1 text-xs text-slate-400">Restaurantes operativos</p>
              </div>
              <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Plan anual</p>
                <p className="mt-2 text-3xl font-bold">{stats.annual}</p>
                <p className="mt-1 text-xs text-slate-400">Clientes en suscripción anual</p>
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-950 p-5 text-white shadow-sm">
                <p className="text-sm text-slate-300">Monto registrado</p>
                <p className="mt-2 text-3xl font-bold">{formatCurrency(stats.monthlyRevenue)}</p>
                <p className="mt-1 text-xs text-slate-400">Suma de planes cargados</p>
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_420px]">
              <div className="rounded-md border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="text-xl font-bold">Restaurantes registrados</h3>
                      <p className="text-sm text-slate-500">
                        Vista general de clientes, plan, estado y accesos principales.
                      </p>
                    </div>
                    <div className="rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-600">
                      Mostrando <span className="font-semibold text-slate-900">{filteredRestaurants.length}</span> de{' '}
                      <span className="font-semibold text-slate-900">{restaurants.length}</span>
                    </div>
                  </div>
                </div>

                {loading ? (
                  <div className="px-6 py-10 text-center text-sm text-slate-500">Cargando restaurantes...</div>
                ) : filteredRestaurants.length === 0 ? (
                  <div className="px-6 py-10 text-center text-sm text-slate-500">
                    No se encontraron restaurantes con esos filtros.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-200">
                    {filteredRestaurants.map((restaurant) => {
                      const adminUser = getMainAdmin(restaurant);
                      const latestSubscription = getLatestSubscription(restaurant);

                      return (
                        <div key={restaurant.id} className="px-5 py-5 sm:px-6">
                          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-3">
                                <h4 className="truncate text-lg font-bold text-slate-900">{restaurant.name}</h4>
                                <span className={`rounded-md px-3 py-1 text-xs font-semibold ${getStatusTone(restaurant)}`}>
                                  {getRestaurantStatus(restaurant)}
                                </span>
                                <span className="rounded-md bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                                  {getRemainingLabel(restaurant)}
                                </span>
                              </div>

                              <div className="mt-2 grid gap-2 text-sm text-slate-500 md:grid-cols-2">
                                <div>
                                  Dominio: <span className="font-medium text-slate-700">{getRestaurantDomain(restaurant)}</span>
                                </div>
                                <div>
                                  Plan:{' '}
                                  <span className="font-medium text-slate-700">
                                    {latestSubscription?.planType || restaurant.planType || '-'}
                                  </span>
                                </div>
                                <div>
                                  Admin:{' '}
                                  <span className="font-medium text-slate-700">
                                    {adminUser
                                      ? `${adminUser.firstName || ''} ${adminUser.lastName || ''}`.trim() || '-'
                                      : '-'}
                                  </span>
                                </div>
                                <div>
                                  Correo:{' '}
                                  <span className="font-medium text-slate-700">{adminUser?.email || '-'}</span>
                                </div>
                              </div>

                              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                                <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
                                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">RUC</p>
                                  <p className="mt-1 text-sm font-semibold text-slate-800">{restaurant.ruc || '-'}</p>
                                </div>
                                <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
                                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Inicio</p>
                                  <p className="mt-1 text-sm font-semibold text-slate-800">
                                    {formatDate(latestSubscription?.startsAt || restaurant.startsAt)}
                                  </p>
                                </div>
                                <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
                                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Monto</p>
                                  <p className="mt-1 text-sm font-semibold text-slate-800">
                                    {formatCurrency(latestSubscription?.amount ?? restaurant.amount)}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2 xl:w-[220px] xl:justify-end">
                              <button
                                type="button"
                                onClick={() => openDetailsModal(restaurant)}
                                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                              >
                                Ver info
                              </button>
                              <button
                                type="button"
                                onClick={() => openResetModal(restaurant)}
                                className="rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                              >
                                Cambiar clave
                              </button>
                              
                              <button 
                              type="button"
                              onClick={() => {setSelectedRestaurantToRenew(restaurant);
                              setRenewModalOpen(true);
                              }}
                              className="px-3 py-1 text-sm font-medium text-white bg-green-600 rounded hover:bg-green-700"
                              >
                              Reactivar
                              </button>
               

                              <button
                                type="button"
                                onClick={() => openDeleteModal(restaurant)}
                                className="rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                              >
                                Eliminar
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div className="rounded-md border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-200 px-5 py-4">
                    <h3 className="text-xl font-bold">Nuevo restaurante</h3>
                    <p className="text-sm text-slate-500">
                      Registra negocio, cuenta administradora y plan inicial.
                    </p>
                  </div>

                  <form onSubmit={handleCreate} className="space-y-4 p-5">
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
                      <input className="rounded-md border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500" placeholder="Nombre del negocio" value={form.name} onChange={(e) => autoFillFromName(e.target.value)} />
                      <input className="rounded-md border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500" placeholder="Slug" value={form.slug} onChange={(e) => handleChange('slug', e.target.value)} />
                      <input className="rounded-md border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500" placeholder="Subdominio" value={form.subdomain} onChange={(e) => handleChange('subdomain', e.target.value)} />
                      <input className="rounded-md border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500" placeholder="RUC" value={form.ruc} onChange={(e) => handleChange('ruc', e.target.value)} />
                      <input className="rounded-md border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500" placeholder="Teléfono" value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} />
                      <input className="rounded-md border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500" placeholder="Dirección" value={form.address} onChange={(e) => handleChange('address', e.target.value)} />
                      <select className="rounded-md border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500" value={form.planType} onChange={(e) => handleChange('planType', e.target.value)}>
                        <option value="TRIMESTRAL">TRIMESTRAL</option>
                        <option value="ANUAL">ANUAL</option>
                      </select>
                      <input className="rounded-md border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500" placeholder="Monto del plan" value={form.amount} onChange={(e) => handleChange('amount', e.target.value)} />
                      <input className="rounded-md border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500" placeholder="Nombre sucursal" value={form.branchName} onChange={(e) => handleChange('branchName', e.target.value)} />
                      <input className="rounded-md border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500" placeholder="Código sucursal" value={form.branchCode} onChange={(e) => handleChange('branchCode', e.target.value)} />
                      <input className="rounded-md border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500" placeholder="Nombre admin" value={form.adminFirstName} onChange={(e) => handleChange('adminFirstName', e.target.value)} />
                      <input className="rounded-md border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500" placeholder="Apellido admin" value={form.adminLastName} onChange={(e) => handleChange('adminLastName', e.target.value)} />
                      <input className="rounded-md border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500" placeholder="Correo admin" value={form.adminEmail} onChange={(e) => handleChange('adminEmail', e.target.value)} />
                      <input type="password" className="rounded-md border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500" placeholder="Contraseña admin" value={form.adminPassword} onChange={(e) => handleChange('adminPassword', e.target.value)} />
                    </div>

                    <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                      Aquí después puedes agregar:
                      <span className="font-semibold text-slate-800"> renovaciones, historial de pagos, notas internas y última actividad</span>.
                    </div>

                    <button
                      type="submit"
                      disabled={saving}
                      className="w-full rounded-md bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                    >
                      {saving ? 'Creando...' : 'Crear restaurante'}
                    </button>
                  </form>
                </div>

                <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="text-lg font-bold">Qué más conviene poner aquí</h3>
                  <div className="mt-4 grid gap-3 text-sm text-slate-600">
                    <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3">Historial de pagos por restaurante</div>
                    <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3">Fecha de renovación y días restantes</div>
                    <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3">Notas internas del cliente</div>
                    <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3">Último acceso del administrador</div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>

      {showDetailsModal && restaurantInDetails ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="relative max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-none bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
              <div>
                <h3 className="text-2xl font-bold text-slate-900">Información del restaurante</h3>
                <p className="text-sm text-slate-500">Detalle completo del registro principal.</p>
              </div>
              <button
                type="button"
                onClick={closeAllModals}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cerrar
              </button>
            </div>

            <div className="grid gap-4 p-6 md:grid-cols-2">
              <div className="rounded-md bg-slate-50 p-4"><p className="text-sm text-slate-500">Negocio</p><p className="mt-1 font-semibold">{restaurantInDetails.name || '-'}</p></div>
              <div className="rounded-md bg-slate-50 p-4"><p className="text-sm text-slate-500">Estado</p><p className="mt-1 font-semibold">{getRestaurantStatus(restaurantInDetails)}</p></div>
              <div className="rounded-md bg-slate-50 p-4"><p className="text-sm text-slate-500">Dominio</p><p className="mt-1 font-semibold break-all">{getRestaurantDomain(restaurantInDetails)}</p></div>
              <div className="rounded-md bg-slate-50 p-4"><p className="text-sm text-slate-500">Slug</p><p className="mt-1 font-semibold">{restaurantInDetails.slug || '-'}</p></div>
              <div className="rounded-md bg-slate-50 p-4"><p className="text-sm text-slate-500">Subdominio</p><p className="mt-1 font-semibold">{restaurantInDetails.subdomain || '-'}</p></div>
              <div className="rounded-md bg-slate-50 p-4"><p className="text-sm text-slate-500">RUC</p><p className="mt-1 font-semibold">{restaurantInDetails.ruc || '-'}</p></div>
              <div className="rounded-md bg-slate-50 p-4"><p className="text-sm text-slate-500">Teléfono</p><p className="mt-1 font-semibold">{restaurantInDetails.phone || '-'}</p></div>
              <div className="rounded-md bg-slate-50 p-4 md:col-span-2"><p className="text-sm text-slate-500">Dirección</p><p className="mt-1 font-semibold">{restaurantInDetails.address || '-'}</p></div>
              <div className="rounded-md bg-slate-50 p-4"><p className="text-sm text-slate-500">Sucursal principal</p><p className="mt-1 font-semibold">{detailsBranch?.name || '-'}</p></div>
              <div className="rounded-md bg-slate-50 p-4"><p className="text-sm text-slate-500">Código sucursal</p><p className="mt-1 font-semibold">{detailsBranch?.code || '-'}</p></div>
              <div className="rounded-md bg-slate-50 p-4"><p className="text-sm text-slate-500">Administrador</p><p className="mt-1 font-semibold">{detailsAdmin ? `${detailsAdmin.firstName || ''} ${detailsAdmin.lastName || ''}`.trim() || '-' : '-'}</p></div>
              <div className="rounded-md bg-slate-50 p-4"><p className="text-sm text-slate-500">Correo admin</p><p className="mt-1 font-semibold break-all">{detailsAdmin?.email || '-'}</p></div>
              <div className="rounded-md bg-slate-50 p-4"><p className="text-sm text-slate-500">Plan</p><p className="mt-1 font-semibold">{detailsSubscription?.planType || restaurantInDetails.planType || '-'}</p></div>
              <div className="rounded-md bg-slate-50 p-4"><p className="text-sm text-slate-500">Monto</p><p className="mt-1 font-semibold">{formatCurrency(detailsSubscription?.amount ?? restaurantInDetails.amount)}</p></div>
              <div className="rounded-md bg-slate-50 p-4"><p className="text-sm text-slate-500">Inicio</p><p className="mt-1 font-semibold">{formatDate(detailsSubscription?.startsAt || restaurantInDetails.startsAt)}</p></div>
              <div className="rounded-md bg-slate-50 p-4"><p className="text-sm text-slate-500">Vencimiento</p><p className="mt-1 font-semibold">{formatDate(detailsSubscription?.endsAt || restaurantInDetails.expiresAt)}</p></div>
            </div>
          </div>
        </div>
      ) : null}

      {showResetModal && resetTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-xl rounded-md bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-bold">Restablecer contraseña</h3>
                <p className="mt-1 text-sm text-slate-500">Se actualizará la clave del administrador principal.</p>
              </div>
              <button type="button" onClick={closeAllModals} className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">
                Cerrar
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <div className="rounded-md bg-slate-50 p-4 text-sm">
                <p className="text-slate-500">Restaurante</p>
                <p className="mt-1 font-semibold">{resetTarget.name}</p>
                <p className="mt-1 text-slate-500">{getMainAdmin(resetTarget)?.email || 'Sin correo registrado'}</p>
              </div>

              <Field label="Nueva contraseña">
                <input
                  type="password"
                  value={resetForm.newPassword}
                  onChange={(e) => setResetForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                  className="w-full rounded-md border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
                  placeholder="Nueva contraseña"
                />
              </Field>

              <Field label="Confirmar contraseña">
                <input
                  type="password"
                  value={resetForm.confirmPassword}
                  onChange={(e) => setResetForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                  className="w-full rounded-md border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
                  placeholder="Confirmar contraseña"
                />
              </Field>

              <div className="flex justify-end gap-3">
                <button type="button" onClick={closeAllModals} className="rounded-md border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">
                  Cancelar
                </button>
                <button type="button" onClick={handleResetPassword} disabled={saving} className="rounded-md bg-amber-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
                  {saving ? 'Guardando...' : 'Guardar nueva contraseña'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {showDeleteModal && deleteTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-xl rounded-md bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-bold text-rose-700">Eliminar restaurante</h3>
                <p className="mt-1 text-sm text-slate-500">Esta acción eliminará los datos del restaurante y no se puede deshacer.</p>
              </div>
              <button type="button" onClick={closeAllModals} className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">
                Cerrar
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <p className="text-rose-700">
                Vas a eliminar:{' '}
                {deleteTarget ? (
                  <span className="font-bold">{deleteTarget.name}</span>
                ) : (
                  <span className="font-bold">Restaurante</span>
                )}
              </p>

              <Field label="Escribe ELIMINAR para confirmar">
                <input
                  value={deleteConfirmationText}
                  onChange={(e) => setDeleteConfirmationText(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
                  placeholder="ELIMINAR"
                />
              </Field>

              <div className="flex justify-end gap-3">
                <button type="button" onClick={closeAllModals} className="rounded-md border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleDeleteRestaurant}
                  disabled={deleting || deleteConfirmationText !== 'ELIMINAR'}
                  className="rounded-md bg-rose-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {deleting ? 'Eliminando...' : 'Eliminar definitivamente'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}



{renewModalOpen && selectedRestaurantToRenew && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-graycity-50">
    <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
      
      {/* Encabezado del modal */}
      <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
        <div>
          <h3 className="text-xl font-bold text-gray-900">
            Gestión de Suscripción
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Restaurante: <span className="font-semibold text-gray-700">{selectedRestaurantToRenew.name}</span>
          </p>
        </div>
        <button
          onClick={() => setRenewModalOpen(false)}
          className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          Cerrar
        </button>
      </div>

      {/* Cuerpo dividido en 2 columnas */}
      <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
          
          {/* COLUMNA IZQUIERDA: Formulario */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm h-fit">
            <h4 className="text-base font-semibold text-slate-800 mb-4 border-b pb-2">Registrar Nuevo Pago</h4>
            <form onSubmit={handleRenewSubscription} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nuevo Plan
                </label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                  value={renewForm.plan}
                  onChange={(e) => setRenewForm({...renewForm, plan: e.target.value})}
                  required
                >
                  <option value="MENSUAL">Mensual</option>
                  <option value="TRIMESTRAL">Trimestral</option>
                  <option value="SEMESTRAL">Semestral</option>
                  <option value="ANUAL">Anual</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monto Pagado (S/)
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none"
                  value={renewForm.amount}
                  onChange={(e) => setRenewForm({...renewForm, amount: e.target.value})}
                  required
                  placeholder="Ej. 150.00"
                />
              </div>

              <div className="flex items-center justify-end pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setRenewModalOpen(false)}
                  className="mr-3 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Confirmar Renovación
                </button>
              </div>
            </form>
          </div>

          {/* COLUMNA DERECHA: Historial */}
          <div className="flex flex-col h-full bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4 border-b pb-2 shrink-0">
              <h4 className="text-base font-semibold text-slate-800">Historial de Pagos</h4>
              <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                {selectedRestaurantToRenew.subscriptions?.length || 0} registros
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-3 max-h-[350px]">
              {selectedRestaurantToRenew.subscriptions && selectedRestaurantToRenew.subscriptions.length > 0 ? (
                selectedRestaurantToRenew.subscriptions.map((sub, index) => (
                  <div key={sub.id || index} className="p-3 border border-slate-200 rounded-lg bg-slate-50 flex justify-between items-center transition hover:bg-slate-100">
                    <div>
                      <p className="font-bold text-slate-800">{sub.planType}</p>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                        {new Date(sub.createdAt).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900 text-base">S/ {Number(sub.amount).toFixed(2)}</p>
                      <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mt-1">Pagado</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-slate-500 italic">No hay historial registrado.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

    </div>
  </div>
)}
      
    </div>
  );
}


export default function RestaurantSoftwarePrototype() {
  const [activeView, setActiveView] = useState('dashboard');
  const [selectedTable, setSelectedTable] = useState('Mesa 1');
  const [orderType, setOrderType] = useState('Salón');
  const [paymentMethod, setPaymentMethod] = useState('Yape');
  const [token, setToken] = useState(() => localStorage.getItem('mesa_pro_token') || '');
  const [authUser, setAuthUser] = useState(() => {
    const raw = localStorage.getItem('mesa_pro_user');
    return raw ? JSON.parse(raw) : null;
  });
  const currentRoleName = authUser?.role?.name || '';
const isKitchenUser = currentRoleName === 'COCINA';
const isAdminUser = currentRoleName === 'ADMIN';

  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
  });
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [connectionError, setConnectionError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const [branches, setBranches] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [tables, setTables] = useState([]);
  const [orders, setOrders] = useState([]);
  const [protectedUsers, setProtectedUsers] = useState([]);
  const [protectedRoles, setProtectedRoles] = useState([]);

  const [showTableForm, setShowTableForm] = useState(false);
  const [tableForm, setTableForm] = useState(emptyTableForm);

  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [categoryForm, setCategoryForm] = useState(emptyCategoryForm);

  const [showProductForm, setShowProductForm] = useState(false);
  const [productForm, setProductForm] = useState(emptyProductForm);
  const [editingProductId, setEditingProductId] = useState(null);

  const [productSearch, setProductSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');

  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryCategoryFilter, setInventoryCategoryFilter] = useState('ALL');


const [showCustomerForm, setShowCustomerForm] = useState(false);
const [customerForm, setCustomerForm] = useState({
  documentNumber: '',
  firstName: '',
  lastNamePaternal: '',
  lastNameMaternal: '',
});
const [isSearchingDni, setIsSearchingDni] = useState(false);

const [editingPaymentId, setEditingPaymentId]= useState(null);
const [paymentEditForm, setPaymentEditForm]= useState({
  method:'YAPE',
  amount:'',
});

const [receiptType, setReceiptType] = useState('BOLETA_SIMPLE');
const [cashierCustomerForm, setCashierCustomerForm] = useState({
  documentNumber: '',
  firstName: '',
  lastNamePaternal: '',
  lastNameMaternal: '',
});
const [isSearchingCashierDni, setIsSearchingCashierDni] = useState(false);
const [selectedCustomerIdForPayment, setSelectedCustomerIdForPayment] = useState(null);

const getLocalDataString = () => {
const now = new Date();
const oofset = now.getTimezoneOffset();
const local = new Date(now.getTime() -oofset * 60000)
return local.toISOString().slice(0, 10);
};

const todayString = getLocalDataString();
const [cashierTab, setCashierTab] = useState('quick');
const [selectedDeliveryOrderId, setSelectedDeliveryOrderId] = useState('');
const [paymentDateFilter, setPaymentDateFilter] = useState(todayString);


const [businessConfig, setBusinessConfig] = useState({
  businessName: '', 
  ruc: '',
  address: '',
  phone: '',
  logoUrl: '', 
});

const [users, setUsers] = useState([]);
const [userForm, setUserForm] = useState({
  firstName: '',
  email: '',
  password: '',
  role: 'COCINA',
});

const[logoFile, setLogoFile] = useState(null);
const [productImageFile, setProductImageFile] = useState(null);

const [kitchenOrders, setKitchenOrders] = useState([]);
const [kitchenLoading, setKitchenLoading] = useState(false);

const loadKitchenOrders = async () => {
  try {
    setKitchenLoading(true);

    const currentToken = token || localStorage.getItem('mesa_pro_token');

    if (!currentToken) {
      setKitchenOrders([]);
      setKitchenLoading(false);
      return;
    }

    const rows = await fetchJson('/kitchen/orders', {
      headers: {
        Authorization: `Bearer ${currentToken}`,
      },
    });

    console.log('KITCHEN ORDERS:', rows);
    setKitchenOrders(Array.isArray(rows) ? rows : []);
    setConnectionError('');
  } catch (error) {
    console.error('KITCHEN ERROR:', error);
    setConnectionError(error.message || 'No se pudo cargar cocina.');
    setKitchenOrders([]);
  } finally {
    setKitchenLoading(false);
  }
};

const updateKitchenItemStatus = async (itemId, kitchenStatus) => {
  try {
    const latestToken = localStorage.getItem('mesa_pro_token');

    await fetchJson(`/kitchen/items/${itemId}/status`, {
      method: 'PATCH',
      headers: latestToken
        ? { Authorization: `Bearer ${latestToken}` }
        : {},
      body: JSON.stringify({ kitchenStatus }),
    });

    await loadKitchenOrders();
  } catch (error) {
    console.error('KITCHEN STATUS ERROR:', error);
    setConnectionError(error.message || 'No se pudo actualizar cocina.');
  }
};




const handleLookupCashierDni = async () => {
  const dni = cashierCustomerForm.documentNumber.trim();

  if (!/^\d{8}$/.test(dni)) {
    setConnectionError('El DNI debe tener 8 dígitos.');
    return;
  }

  setIsSearchingCashierDni(true);
  setConnectionError('');

  try {
    const data = await fetchJson(`/clients/lookup/dni/${dni}`, {
      method: 'GET',
      headers: protectedHeaders,
    });

    setCashierCustomerForm({
      documentNumber: data.documentNumber || dni,
      firstName: data.firstName || '',
      lastNamePaternal: data.lastNamePaternal || '',
      lastNameMaternal: data.lastNameMaternal || '',
    });

    setMessage('DNI consultado correctamente en caja.');
  } catch (error) {
    setConnectionError(error.message);
  } finally {
    setIsSearchingCashierDni(false);
  }
};


const handleCreateCashierCustomer = async () => {
  if (!/^\d{8}$/.test(cashierCustomerForm.documentNumber)) {
    setConnectionError('DNI inválido.');
    return null;
  }

  try {
    const customer = await fetchJson('/customers', {
      method: 'POST',
      headers: protectedHeaders,
      body: JSON.stringify({
        documentNumber: cashierCustomerForm.documentNumber,
        firstName: cashierCustomerForm.firstName,
        lastNamePaternal: cashierCustomerForm.lastNamePaternal,
        lastNameMaternal: cashierCustomerForm.lastNameMaternal,
      }),
    });

    await loadProtectedData(token);
    return customer.id;
  } catch (error) {
    if ((error.message || '').includes('Ya existe un cliente con ese DNI')) {
      const existing = customers.find(
        (item) => item.documentNumber === cashierCustomerForm.documentNumber
      );
      return existing?.id || null;
    }

    setConnectionError(error.message);
    return null;
  }
};

const handleCreateSystemUser = async () => {
  try {
    setIsSaving(true);
    setConnectionError('');

    if (!userForm.firstName.trim()) {
      throw new Error('Ingresa el nombre del usuario');
    }

    if (!userForm.email.trim()) {
      throw new Error('Ingresa el correo del usuario');
    }

    if (!userForm.password.trim() || userForm.password.trim().length < 6) {
      throw new Error('La contraseña debe tener al menos 6 caracteres');
    }

    const selectedRole = protectedRoles.find(
      (role) => String(role.name || '').toUpperCase() === String(userForm.role || '').toUpperCase()
    );

    if (!selectedRole) {
      throw new Error('No se encontró el rol seleccionado');
    }

    const response = await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        branchId: authUser?.branchId || authUser?.branch?.id,
        roleId: selectedRole.id,
        firstName: userForm.firstName.trim(),
        lastName: '',
        email: userForm.email.trim().toLowerCase(),
        password: userForm.password.trim(),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'No se pudo crear el usuario');
    }

    setUserForm({
      firstName: '',
      email: '',
      password: '',
      role: 'COCINA',
    });

    await loadProtectedData(token);
    setMessage('Usuario creado correctamente.');
  } catch (error) {
    console.error(error);
    setConnectionError(error.message || 'Error al crear usuario');
  } finally {
    setIsSaving(false);
  }
};





const [customers, setCustomers]= useState([]);








const handleStartEditPayment = (payment) => {
  setEditingPaymentId(payment.id);
  setPaymentEditForm({
    method: payment.method || 'YAPE',
    amount: payment.amount ?? '',
  });
};

const handleSavePaymentEdit = async (paymentId) => {
  setIsSaving(true);
  try {
    await fetchJson(`/payments/${paymentId}`, {
      method: 'PATCH',
      headers: protectedHeaders,
      body: JSON.stringify({
        method: paymentEditForm.method,
        amount: Number(paymentEditForm.amount),
      }),
    });

    setEditingPaymentId(null);
    await loadProtectedData(token);
    setMessage('Pago actualizado correctamente.');
  } catch (error) {
    setConnectionError(error.message || 'Error al actualizar pago');
  } finally {
    setIsSaving(false);
  }
};

const handleDeletePayment = async (payment) => {
  const confirmed = window.confirm(`¿Eliminar el pago ${payment.orderCode || payment.id}?`);
  if (!confirmed) return;

  setIsSaving(true);
  try {
    await fetchJson(`/payments/${payment.id}`, {
      method: 'DELETE',
      headers: protectedHeaders,
    });

    await loadProtectedData(token);
    setMessage('Pago eliminado correctamente.');
  } catch (error) {
    setConnectionError(error.message || 'Error al eliminar pago');
  } finally {
    setIsSaving(false);
  }
};

/** FUNCION PARA IMPRIMIR */
const handlePrintReceipt = (payment) => {
  const order =
    orderList.find((item) => item.id === payment.orderId) ||
    payment.order ||
    null;

  if (!order) {
    setConnectionError('No se encontró la orden para imprimir.');
    return;
  }

  const restaurantName =
    businessConfig.businessName ||
    businessConfig.name ||
    'SmartMesa Restaurante';

  const restaurantRuc = businessConfig.ruc || '';
  const restaurantAddress = businessConfig.address || '';
  const restaurantPhone = businessConfig.phone || '';
  const restaurantLogo = businessConfig.logoUrl || '';

  const tableLabel =
  order.table?.label ||
  order.table?.name ||
  (order.table?.number ? `Mesa ${order.table.number}` : '') ||
  order.tableName ||
  order.tableLabel ||
  order.customerLabel ||
  payment.table?.label ||
  payment.table?.name ||
  (payment.table?.number ? `Mesa ${payment.table.number}` : '') ||
  payment.tableName ||
  payment.tableLabel ||
  selectedTable ||
  'Sin mesa';

  const customerName =
    order.customer?.fullName ||
    payment.customer?.fullName ||
    (payment.receiptType === 'BOLETA_SIMPLE' ? 'Cliente varios' : '');

  const items = Array.isArray(order.items) ? order.items : [];

  const itemsHtml = items.length
    ? items
        .map((item) => {
          const productName =
            item.productNameSnapshot ||
            item.product?.name ||
            item.product?.title ||
            item.productSnapshot?.name ||
            item.productSnapshot?.title ||
            item.snapshot?.name ||
            item.snapshot?.title ||
            item.menuItem?.name ||
            item.menuItem?.title ||
            item.inventoryItem?.name ||
            item.inventoryItem?.title ||
            item.orderProduct?.name ||
            item.orderProduct?.title ||
            item.item?.name ||
            item.item?.title ||
            item.name ||
            item.productName ||
            item.title ||
            item.description ||
            'Producto';

          const qty = Number(item.qty || item.quantity || 1);

          const lineTotal = Number(
            item.total ??
              item.subtotal ??
              Number(item.unitPrice || item.price || 0) * qty
          );

          return `
            <tr>
              <td style="padding:4px 0; font-size:12px;">
                ${productName} x${qty}
              </td>
              <td style="padding:4px 0; font-size:12px; text-align:right;">
                S/ ${lineTotal.toFixed(2)}
              </td>
            </tr>
          `;
        })
        .join('')
    : `
      <tr>
        <td style="padding:4px 0; font-size:12px;">Producto</td>
        <td style="padding:4px 0; font-size:12px; text-align:right;">
          S/ ${Number(payment.amount || order.total || 0).toFixed(2)}
        </td>
      </tr>
    `;

  const paymentLabel =
    payment.method === 'YAPE'
      ? 'Yape'
      : payment.method === 'CARD'
      ? 'Tarjeta'
      : payment.method === 'CASH'
      ? 'Efectivo'
      : payment.method || 'Efectivo';

  const printDate = new Date(
    payment.createdAt || order.updatedAt || order.createdAt || Date.now()
  ).toLocaleString();

  const receiptHtml = `
    <html>
      <head>
        <title>Comprobante ${order.orderNumber || payment.orderCode || ''}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 16px;
            color: #000;
          }
          .ticket {
            width: 320px;
            margin: 0 auto;
          }
          .center {
            text-align: center;
          }
          .logo {
            text-align: center;
            margin-bottom: 10px;
          }
          .logo img {
            max-width: 90px;
            max-height: 90px;
            object-fit: contain;
          }
          .title {
            font-size: 22px;
            font-weight: bold;
            margin-bottom: 6px;
          }
          .subtext {
            font-size: 12px;
            margin: 2px 0;
          }
          .line {
            border-top: 1px dashed #000;
            margin: 10px 0;
          }
          .row {
            display: flex;
            justify-content: space-between;
            gap: 12px;
            font-size: 13px;
            margin: 4px 0;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          .total {
            font-size: 20px;
            font-weight: bold;
          }
          @media print {
            body {
              padding: 0;
            }
            .ticket {
              width: 100%;
            }
          }
        </style>
      </head>
      <body>
        <div class="ticket">
          ${
            restaurantLogo
              ? `
            <div class="logo">
              <img src="${restaurantLogo}" alt="Logo negocio" />
            </div>
          `
              : ''
          }

          <div class="center title">${restaurantName}</div>

          ${
            restaurantRuc
              ? `<div class="center subtext">RUC: ${restaurantRuc}</div>`
              : ''
          }

          ${
            restaurantAddress
              ? `<div class="center subtext">${restaurantAddress}</div>`
              : ''
          }

          ${
            restaurantPhone
              ? `<div class="center subtext">Tel: ${restaurantPhone}</div>`
              : ''
          }

          <div class="line"></div>

          <div class="row">
            <strong>${order.orderNumber || payment.orderCode || 'ORDEN'}</strong>
            <span>${printDate}</span>
          </div>

          <div class="row">
            <span>Mesa:</span>
            <span>${tableLabel}</span>
          </div>

          ${
            customerName
              ? `
            <div class="row">
              <span>Cliente:</span>
              <span>${customerName}</span>
            </div>
          `
              : ''
          }

          <div class="line"></div>

          <table>
            <thead>
              <tr>
                <th style="text-align:left; font-size:12px; padding-bottom:6px;">Detalle</th>
                <th style="text-align:right; font-size:12px; padding-bottom:6px;">Precio</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="line"></div>

          <div class="row">
            <span>Método de pago:</span>
            <span>${paymentLabel}</span>
          </div>

          <div class="row total">
            <span>Total:</span>
            <span>S/ ${Number(payment.amount || order.total || 0).toFixed(2)}</span>
          </div>

          <div class="line"></div>

          <div class="center" style="margin-top:18px; font-size:15px;">
            Gracias por su compra
          </div>
        </div>
      </body>
    </html>
  `;

  const printWindow = window.open('', '_blank', 'width=420,height=700');
  if (!printWindow) {
    setConnectionError('No se pudo abrir la ventana de impresión.');
    return;
  }

  printWindow.document.open();
  printWindow.document.write(receiptHtml);
  printWindow.document.close();
  printWindow.focus();

  setTimeout(() => {
    printWindow.print();
  }, 500);
};
/**FUNCION PARA IMPRIMIR */


const handleLookupDni = async () => {
  const dni = customerForm.documentNumber.trim();

  if (!/^\d{8}$/.test(dni)) {
    setConnectionError('El DNI debe tener 8 dígitos.');
    return;
  }

  setIsSearchingDni(true);
  setConnectionError('');

  try {
    const data = await fetchJson(`/clients/lookup/dni/${dni}`, {
      method: 'GET',
      headers: protectedHeaders,
    });

    setCustomerForm((prev) => ({
      ...prev,
      documentNumber: data.documentNumber || prev.documentNumber,
      firstName: data.firstName || '',
      lastNamePaternal: data.lastNamePaternal || '',
      lastNameMaternal: data.lastNameMaternal || '',
    }));

    setMessage('DNI consultado correctamente.');
  } catch (error) {
    setConnectionError(error.message);
  } finally {
    setIsSearchingDni(false);
  }
};

  const panelCard =
    'rounded-3xl border border-slate-200 bg-white/90 backdrop-blur p-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)]';
  const inputClass =
    'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none';

  const allNav = [
    { 
      key: 'dashboard', 
      label: 'Dashboard',
      icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
    },
    { 
      key: 'pos', 
      label: 'Punto de venta',
      icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clipRule="evenodd" /></svg>
    },
    { 
      key: 'tables', 
      label: 'Mesas',
      icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 4a3 3 0 00-3 3v6a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H5zm-1 9v-1h5v2H5a1 1 0 01-1-1zm7 1h4a1 1 0 001-1v-1h-5v2zm0-4h5V8a1 1 0 00-1-1h-4v3zM4 8h5v3H4V8z" clipRule="evenodd" /></svg>
    },
    { 
      key: 'kitchen', 
      label: 'Cocina',
      icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.79-.61 1.731-.82 2.66l-.044.197c-.046.196-.105.58-.134.95-.024.31-.053.73-.053 1.202v.032c0 .326.046.586.09.76.044.174.072.247.114.364.043.117.127.326.295.542.167.215.42.443.81.443.391 0 .643-.228.81-.443.168-.216.252-.425.295-.542.042-.117.07-.19.114-.364.044-.174.09-.434.09-.76v-.032c0-.472-.029-.892-.053-1.202-.029-.37-.088-.754-.134-.95l-.044-.197c-.21-.93-.486-1.87-.82-2.66-.167-.403-.356-.786-.57-1.116-.208-.322-.477-.65-.822-.88zM6 10a4 4 0 008 0c0-.82-.218-1.584-.59-2.245-.25-.434-.555-.838-.888-1.2A2.99 2.99 0 0113 7.5c0 1.22-.767 2.257-1.83 2.76A1.996 1.996 0 0110 11a2 2 0 01-1.17-.38A2.992 2.992 0 018.83 7.5c0-.66.21-1.27.56-1.76a7.48 7.48 0 00-1.07 1.246A3.992 3.992 0 006 10z" clipRule="evenodd" /></svg>
    },
    { 
      key: 'cashier', 
      label: 'Caja',
      icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
    },
    { 
      key: 'inventory', 
      label: 'Inventario',
      icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" /><path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
    },
    { 
      key: 'customers', 
      label: 'Clientes',
      icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" /></svg>
    },
    { 
      key: 'reports', 
      label: 'Reportes',
      icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" /></svg>
    },
    { 
      key: 'settings', 
      label: 'Configuración',
      icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg>
    },
  ];

const nav = isKitchenUser
  ? [{ key: 'kitchen', label: 'Cocina' }]
  : allNav;

  const sectionTitle = {
    dashboard: 'Vista general del negocio',
    pos: 'Punto de venta y registro de pedidos',
    tables: 'Gestión de mesas y consumo',
    kitchen: 'Comandas y estado de preparación',
    cashier: 'Caja, cobros y comprobantes',
    inventory: 'Control de productos e insumos',
    customers: 'Clientes y operación comercial',
    reports: 'Indicadores y desempeño',
    settings: 'Configuración del sistema',
  };

  const badgeClass = (status) => {
    const map = {
      Pendiente: 'bg-amber-100 text-amber-800 border-amber-200',
      Confirmado: 'bg-blue-100 text-blue-800 border-blue-200',
      Pagado: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      Libre: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      Ocupada: 'bg-rose-100 text-rose-800 border-rose-200',
      Reservada: 'bg-violet-100 text-violet-800 border-violet-200',
      Limpieza: 'bg-sky-100 text-sky-800 border-sky-200',
      Disponible: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      'No disponible': 'bg-slate-100 text-slate-800 border-slate-200',
      Yape: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200',
      Efectivo: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      Tarjeta: 'bg-slate-100 text-slate-800 border-slate-200',
      ADMIN: 'bg-slate-100 text-slate-800 border-slate-200',
      CAJA: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      MOZO: 'bg-blue-100 text-blue-800 border-blue-200',
      SUPERVISOR: 'bg-violet-100 text-violet-800 border-violet-200',
    };
    return map[status] || 'bg-slate-100 text-slate-700 border-slate-200';
  };

 const fetchJson = async (path, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const currentToken = token || localStorage.getItem('mesa_pro_token');

  if (currentToken) {
    headers.Authorization = `Bearer ${currentToken}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Error en la solicitud');
  }

  return data;
};

  const protectedHeaders = token ? { Authorization: `Bearer ${token}` } : {};


  const loadBusinessSetting = async (branchId) => {
  try {
    const response = await fetch(`http://localhost:3001/settings/business/${branchId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (data) {
      setBusinessConfig({
        businessName: data.businessName || '',
        ruc: data.ruc || '',
        address: data.address || '',
        phone: data.phone || '',
        logoUrl: data.logoUrl || '',
      });
    }
  } catch (error) {
    console.error('Error cargando configuración negocio:', error);
  }
};



const loadProtectedData = async (currentToken) => {
  setIsLoadingData(true);
  setConnectionError('');

  try {
    const currentUser = authUser || JSON.parse(localStorage.getItem('mesa_pro_user') || 'null');
    const currentBranchId = currentUser?.branchId || currentUser?.branch?.id || null;

if (currentBranchId) {
  await loadBusinessSetting(currentBranchId);
}
    const roleName =
      currentUser?.role?.name ||
      currentUser?.role?.code ||
      currentUser?.role ||
      '';

    const normalizedRole = String(roleName).toUpperCase();

    if (normalizedRole === 'COCINA' || normalizedRole === 'KITCHEN') {
      const [tableRows, orderRows] = await Promise.all([
        fetchJson('/tables', {
          headers: { Authorization: `Bearer ${currentToken}` },
        }),
        fetchJson('/orders', {
          headers: { Authorization: `Bearer ${currentToken}` },
        }),
      ]);

      setTables(Array.isArray(tableRows) ? tableRows : []);
      setOrders(Array.isArray(orderRows) ? orderRows : []);
      setBranches([]);
      setCategories([]);
      setProducts([]);
      setProtectedUsers([]);
      setCustomers([]);

      if (
        Array.isArray(tableRows) &&
        tableRows.length &&
        !tableRows.some((t) => `Mesa ${t.number}` === selectedTable)
      ) {
        setSelectedTable(`Mesa ${tableRows[0].number}`);
      }

      return;
    }

 const [
  branchRows,
  categoryRows,
  productRows,
  tableRows,
  orderRows,
  userRows,
  customerRows,
  roleRows,
] = await Promise.all([
  fetchJson('/branches', {
    headers: { Authorization: `Bearer ${currentToken}` },
  }),
  fetchJson('/categories', {
    headers: { Authorization: `Bearer ${currentToken}` },
  }),
  fetchJson('/products', {
    headers: { Authorization: `Bearer ${currentToken}` },
  }),
  fetchJson('/tables', {
    headers: { Authorization: `Bearer ${currentToken}` },
  }),
  fetchJson('/orders', {
    headers: { Authorization: `Bearer ${currentToken}` },
  }),
  fetchJson('/users', {
    headers: { Authorization: `Bearer ${currentToken}` },
  }),
  fetchJson('/customers', {
    headers: { Authorization: `Bearer ${currentToken}` },
  }),
  fetchJson('/roles', {
    headers: { Authorization: `Bearer ${currentToken}` },
  }),
]);

setProtectedRoles(Array.isArray(roleRows) ? roleRows : []);

    setBranches(Array.isArray(branchRows) ? branchRows : []);
    setCategories(Array.isArray(categoryRows) ? categoryRows : []);
    setProducts(Array.isArray(productRows) ? productRows : []);
    setTables(Array.isArray(tableRows) ? tableRows : []);
    setOrders(Array.isArray(orderRows) ? orderRows : []);
    setProtectedUsers(Array.isArray(userRows) ? userRows : []);
    setCustomers(Array.isArray(customerRows) ? customerRows : []);

    if (
      Array.isArray(tableRows) &&
      tableRows.length &&
      !tableRows.some((t) => `Mesa ${t.number}` === selectedTable)
    ) {
      setSelectedTable(`Mesa ${tableRows[0].number}`);
    }
  } catch (error) {
    setConnectionError(error.message || 'Error cargando datos');
  } finally {
    setIsLoadingData(false);
  }
};
 const hasLoadedRef = useRef(false);

useEffect(() => {
  if (token && !hasLoadedRef.current) {
    hasLoadedRef.current = true;
    loadProtectedData(token);
  }
}, [token]);

useEffect(() => {
  if (!token) return;
  if (activeView !== 'kitchen') return;

  loadKitchenOrders();

  const interval = setInterval(() => {
    loadKitchenOrders();
  }, 5000);

  return () => clearInterval(interval);
}, [token, activeView]);


/* FUNCIONES DE COCINA */






const handleLogin = async (event) => {
  event.preventDefault();
  setIsLoggingIn(true);
  setLoginError('');

  try {
    localStorage.removeItem('mesa_pro_token');
    localStorage.removeItem('mesa_pro_user');

    const data = await fetchJson('/auth/login', {
      method: 'POST',
      body: JSON.stringify(loginForm),
    });

    localStorage.setItem('mesa_pro_token', data.token);
    localStorage.setItem('mesa_pro_user', JSON.stringify(data.user));

    setToken(data.token);
    setAuthUser(data.user);
    setKitchenOrders([]);
    setConnectionError('');
  } catch (error) {
    console.error('LOGIN ERROR:', error);
    setLoginError(error.message || 'Error al iniciar sesión');
  } finally {
    setIsLoggingIn(false);
  }
};

  const handleLogout = () => {
  setToken('');
  setAuthUser(null);
  setKitchenOrders([]);
  setConnectionError('');
  localStorage.removeItem('mesa_pro_token');
  localStorage.removeItem('mesa_pro_user');
};

  const mappedTables = useMemo(
    () =>
      tables.map((table) => ({
        ...table,
        label: `Mesa ${table.number}`,
        statusLabel:
          table.status === 'FREE'
            ? 'Libre'
            : table.status === 'OCCUPIED'
            ? 'Ocupada'
            : table.status === 'RESERVED'
            ? 'Reservada'
            : table.status === 'CLEANING'
            ? 'Limpieza'
            : 'Inactiva',
      })),
    [tables]
  );

  const mappedProducts = useMemo(
    () =>
      products.map((item) => ({
        ...item,
        stockLabel: item.availableForSale ? 'Disponible' : 'No disponible',
        categoryLabel: item.category?.name || 'Sin categoría',
        priceNumber: Number(item.price || 0),
      })),
    [products]
  );

  const filteredProducts = useMemo(() => {
    return mappedProducts.filter((item) => {
      const matchCategory = selectedCategoryFilter === 'ALL' || item.categoryId === selectedCategoryFilter;
      const search = productSearch.trim().toLowerCase();
      const matchSearch =
        !search ||
        item.name.toLowerCase().includes(search) ||
        item.categoryLabel.toLowerCase().includes(search);
      return matchCategory && matchSearch;
    });
  }, [mappedProducts, selectedCategoryFilter, productSearch]);

  const orderList = useMemo(
    () =>
      orders.map((order) => ({
        ...order,
        customerLabel: order.table ? `Mesa ${order.table.number}` : order.customer?.fullName || 'Cliente general',
        channelLabel:
          order.channel === 'SALON'
            ? 'Salón'
            : order.channel === 'DELIVERY'
            ? 'Delivery'
            : order.channel === 'PICKUP'
            ? 'Recojo'
            : order.channel,
        totalLabel: `S/ ${Number(order.total || 0).toFixed(2)}`,
      })),
    [orders]
  );

  const selectedTableObj = useMemo(
    () => mappedTables.find((t) => t.label === selectedTable) || null,
    [mappedTables, selectedTable]
  );

  const currentOrderEntity = useMemo(() => {
    if (!selectedTableObj) return null;
    return orderList.find((order) => order.tableId === selectedTableObj.id && order.status !== 'PAID') || null;
  }, [orderList, selectedTableObj]);

  const currentOrder = useMemo(() => {
  if (!currentOrderEntity) return [];

  const rows = Array.isArray(currentOrderEntity.items)
    ? currentOrderEntity.items
    : [];

  const grouped = new Map();

  rows.forEach((row) => {
    const productId = row.productId || row.id;
    const note = row.notes || '';
    const key = `${productId}-${note}`;

    const qty = Number(row.qty || 0);
    const price = Number(row.unitPrice || 0);

    if (!grouped.has(key)) {
      grouped.set(key, {
        id: row.id,
        productId,
        item: row.productNameSnapshot || 'Producto',
        qty,
        note,
        price,
      });
    } else {
      const existing = grouped.get(key);
      existing.qty += qty;
    }
  });

  return Array.from(grouped.values());
}, [currentOrderEntity]);

  const subtotal = currentOrder.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.qty || 0), 0 );
  const total = subtotal;


const paymentRows = useMemo(() => {
  const safeOrders = Array.isArray(orderList) ? orderList : [];

  return safeOrders.flatMap((order) => {
    const orderPayments = Array.isArray(order.payments) ? order.payments : [];

    return orderPayments.map((payment) => ({
      ...payment,
      orderId: payment.orderId || order.id,
      order,
      customer: payment.customer || order.customer || null,
      receiptType: payment.receiptType || order.receiptType || null,
    }));
  });
}, [orderList]);
  
  



const paymentList = useMemo(() => {
  return paymentRows
    .filter((payment) => {
      if (!paymentDateFilter) return true;

      const sourceDate = payment.createdAt || payment.paidAt;
      if (!sourceDate) return false;

      const paymentDate = new Date(sourceDate);
      const localDate = new Date(
        paymentDate.getTime() - paymentDate.getTimezoneOffset() * 60000
      )
        .toISOString()
        .slice(0, 10);

      return localDate === paymentDateFilter;
    })
    .map((payment) => {
      const order = orderList.find((item) => item.id === payment.orderId);

      return {
        id: payment.id,
        orderId: payment.orderId,
        orderCode:
          order?.orderNumber ||
          payment.order?.orderNumber ||
          payment.payment_code ||
          'ORD-SIN-CODIGO',
        type: order?.orderType || payment.order?.orderType || 'Salón',
        paidAt: new Date(payment.createdAt).toLocaleString(),
        createdAt: payment.createdAt,
        method: payment.method,
        total: `S/ ${Number(payment.amount || 0).toFixed(2)}`,
        amount: Number(payment.amount || 0),
        customer: payment.customer || order?.customer || null,
        receiptType: payment.receiptType || order?.receiptType || null,
        order,
      };
    });
}, [paymentRows, orderList, paymentDateFilter]);

const deliveryPendingOrders = useMemo(() => {
  return (Array.isArray(orderList) ? orderList : [])
    .filter((order) => {
      const orderType = String(order.orderType || '').toUpperCase();
      const hasPayments = Array.isArray(order.payments) && order.payments.length > 0;

      return orderType === 'DELIVERY' && order.status !== 'PAID' && !hasPayments;
    })
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
}, [orderList]);

const selectedDeliveryOrder = useMemo(() => {
  if (!selectedDeliveryOrderId) {
    return deliveryPendingOrders[0] || null;
  }

  return (
    deliveryPendingOrders.find((order) => order.id === selectedDeliveryOrderId) || null
  );
}, [deliveryPendingOrders, selectedDeliveryOrderId]);

useEffect(() => {
  if (!deliveryPendingOrders.length) {
    setSelectedDeliveryOrderId('');
    return;
  }

  const exists = deliveryPendingOrders.some(
    (order) => order.id === selectedDeliveryOrderId
  );

  if (!exists) {
    setSelectedDeliveryOrderId(deliveryPendingOrders[0].id);
  }
}, [deliveryPendingOrders, selectedDeliveryOrderId]);

const selectedCashierOrder =
  cashierTab === 'delivery' ? selectedDeliveryOrder : currentOrderEntity;

const selectedCashierItems = useMemo(() => {
  if (!selectedCashierOrder) return [];

  const rows = Array.isArray(selectedCashierOrder.items)
    ? selectedCashierOrder.items
    : [];

  const grouped = new Map();

  rows.forEach((row) => {
    const productId = row.productId || row.id;
    const note = row.notes || '';
    const key = `${productId}-${note}`;

    const qty = Number(row.qty || 0);
    const price = Number(row.unitPrice || 0);

    if (!grouped.has(key)) {
      grouped.set(key, {
        id: row.id,
        productId,
        item: row.productNameSnapshot || 'Producto',
        qty,
        note,
        price,
      });
    } else {
      const existing = grouped.get(key);
      existing.qty += qty;
    }
  });

  return Array.from(grouped.values());
}, [selectedCashierOrder]);

const selectedCashierSubtotal = selectedCashierItems.reduce(
  (sum, item) => sum + Number(item.price || 0) * Number(item.qty || 0),
  0
);

const selectedCashierTotal =
  Number(selectedCashierOrder?.total || 0) || selectedCashierSubtotal;



const customersData = useMemo(() => {
  return customers.map((customer) => ({
    id: customer.id,
    name: customer.fullName || 'Cliente',
    documentNumber: customer.documentNumber || '-',
  }));
}, [customers]);



  const occupiedTables = useMemo(
    () => mappedTables.filter((table) => table.status === 'OCCUPIED'),
    [mappedTables]
  );

  const roleGroups = useMemo(() => {
    const grouped = protectedUsers.reduce((acc, user) => {
      const roleName = user.role?.name || 'Sin rol';
      acc[roleName] = (acc[roleName] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(grouped).map(([name, users]) => ({
      name,
      users,
      access:
        name === 'ADMIN'
          ? 'Control total del sistema'
          : name === 'CAJA'
          ? 'Cobros y pagos'
          : name === 'MOZO'
          ? 'Mesas y pedidos'
          : name === 'SUPERVISOR'
          ? 'Supervisión operativa'
          : 'Acceso configurado',
    }));
  }, [protectedUsers]);

  const stats = useMemo(() => {
    const totalSales = orders.reduce((acc, order) => acc + Number(order.total || 0), 0);
    const occupied = tables.filter((table) => table.status === 'OCCUPIED').length;
    const avgTicket = orders.length ? totalSales / orders.length : 0;
    return [
      { label: 'Ventas registradas', value: `S/ ${totalSales.toFixed(2)}`, note: `${orders.length} pedidos cargados` },
      {
        label: 'Pedidos activos',
        value: String(orders.filter((o) => o.status !== 'PAID').length),
        note: `${orders.length} pedidos totales`,
      },
      {
        label: 'Mesas ocupadas',
        value: `${occupied} / ${tables.length || 0}`,
        note: tables.length ? `${Math.round((occupied / tables.length) * 100)}% ocupación` : 'Sin mesas',
      },
      {
        label: 'Ticket promedio',
        value: `S/ ${avgTicket.toFixed(2)}`,
        note: authUser ? `Usuario: ${authUser.firstName}` : 'Sin sesión',
      },
    ];
  }, [orders, tables, authUser]);

  const setMessage = (text) => {
    setActionMessage(text);
    setTimeout(() => setActionMessage(''), 2500);
  };

const handleCreateOrder = async () => {
  if (!selectedTableObj || !authUser) return;

  if (currentOrderEntity) {
    setActionMessage('Esta mesa ya tiene un pedido activo.');
    return;
  }

  setIsSaving(true);

  try {
    await fetchJson('/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token || localStorage.getItem('mesa_pro_token')}`,
      },
      body: JSON.stringify({
        branchId: authUser.branchId,
        tableId: selectedTableObj.id,
        waiterId: authUser.id,
        orderType: 'DINE_IN',
        channel: 'SALON',
        guestsCount: selectedTableObj.capacity,
        notes: `Pedido creado desde interfaz para ${selectedTableObj.label}`,
      }),
    });

    await loadProtectedData(token);
    setActiveView('pos');
    setMessage('Pedido creado correctamente.');
  } catch (error) {
    setConnectionError(error.message);
  } finally {
    setIsSaving(false);
  }
};
const handleAddProduct = async (product) => {
    if (!currentOrderEntity) {
      setActionMessage('Primero crea un pedido para la mesa seleccionada.');
      return;
    }

    setIsSaving(true);
    try {
      // 1. Buscamos si el producto ya está en el carrito visual
      const existingItem = currentOrder.find(
        (item) => item.productId === product.id && item.note === ''
      );

      if (existingItem) {
        // 2. Si ya existe, actualizamos ESA fila sumándole 1
        await fetchJson(`/order-items/${existingItem.id}`, {
          method: 'PATCH',
          headers: protectedHeaders,
          body: JSON.stringify({
            qty: existingItem.qty + 1,
            notes: '',
          }),
        });
      } else {
        // 3. Si NO existe, creamos el registro por primera vez
        await fetchJson(`/orders/${currentOrderEntity.id}/items`, {
          method: 'POST',
          headers: protectedHeaders,
          body: JSON.stringify({
            productId: product.id,
            qty: 1,
            notes: '',
            discountAmount: 0,
          }),
        });
      }

      await loadProtectedData(token);
      setMessage(`${product.name} agregado al pedido.`);
    } catch (error) {
      setConnectionError(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const updateOrderItemQty = async (itemId, newQty, note = '') => {
    if (!currentOrderEntity) {
      setActionMessage('No hay pedido activo para esta mesa.');
      return;
    }

    setIsSaving(true);
    try {
      if (newQty <= 0) {
        await fetchJson(`/order-items/${itemId}`, {
          method: 'DELETE',
          headers: protectedHeaders,
        });

        await loadProtectedData(token);
        setMessage('Item eliminado del pedido.');
        return;
      }

      await fetchJson(`/order-items/${itemId}`, {
        method: 'PATCH',
        headers: protectedHeaders,
        body: JSON.stringify({
          qty: Number(newQty),
          notes: note || '',
        }),
      });

      await loadProtectedData(token);
      setMessage('Cantidad actualizada.');
    } catch (error) {
      setConnectionError(error.message);
    } finally {
      setIsSaving(false);
    }
  };

const handlePayCurrentOrder = async () => {
  const orderToPay = selectedCashierOrder;

  if (!orderToPay) {
    setActionMessage('No hay pedido activo para cobrar.');
    return;
  }

  setIsSaving(true);

  try {
    let customerIdToSend = selectedCustomerIdForPayment;

    if (receiptType === 'BOLETA' && !customerIdToSend) {
      customerIdToSend = await handleCreateCashierCustomer();
    }

    if (receiptType === 'BOLETA' && !customerIdToSend) {
      setIsSaving(false);
      return;
    }

    await fetchJson(`/orders/${orderToPay.id}/pay`, {
      method: 'PATCH',
      headers: protectedHeaders,
      body: JSON.stringify({
        method:
          paymentMethod === 'Yape'
            ? 'YAPE'
            : paymentMethod === 'Tarjeta'
            ? 'CARD'
            : 'CASH',
        amount: Number(orderToPay.total || selectedCashierTotal || 0),
        createdById: authUser.id,
        customerId: receiptType === 'BOLETA' ? customerIdToSend : null,
      }),
    });

    setCashierCustomerForm({
      documentNumber: '',
      firstName: '',
      lastNamePaternal: '',
      lastNameMaternal: '',
    });
    setSelectedCustomerIdForPayment(null);

    await loadProtectedData(token);
    setMessage('Pedido cobrado correctamente.');
    setConnectionError('');
  } catch (error) {
    setConnectionError(error.message || 'Error al cobrar pedido');
  } finally {
    setIsSaving(false);
  }
};

const handleDeleteCurrentOrder = async () => {
  const orderToDelete = selectedCashierOrder;

  if (!orderToDelete) {
    setActionMessage('No hay pedido activo para eliminar.');
    return;
  }

  const confirmed = window.confirm(`¿Eliminar el pedido ${orderToDelete.orderNumber}?`);
  if (!confirmed) return;

  setIsSaving(true);
  try {
    await fetchJson(`/orders/${orderToDelete.id}`, {
      method: 'DELETE',
      headers: protectedHeaders,
    });

    await loadProtectedData(token);
    setMessage('Pedido eliminado correctamente.');
  } catch (error) {
    setConnectionError(error.message);
  } finally {
    setIsSaving(false);
  }
};

  const handleCreateTable = async (event) => {
    event.preventDefault();
    if (!authUser?.branchId) return;

    setIsSaving(true);
    try {
      await fetchJson('/tables', {
        method: 'POST',
        headers: protectedHeaders,
        body: JSON.stringify({
          branchId: authUser.branchId,
          number: Number(tableForm.number),
          name: tableForm.name || `Mesa ${tableForm.number}`,
          capacity: Number(tableForm.capacity),
          status: tableForm.status,
        }),
      });
      setTableForm(emptyTableForm);
      setShowTableForm(false);
      await loadProtectedData(token);
      setMessage('Mesa creada correctamente.');
    } catch (error) {
      setConnectionError(error.message);
    } finally {
      setIsSaving(false);
    }
  };
  /* ELIMINAR MESAS*/
const handleDeleteTable = async (tableId) => {
  const ok = window.confirm('¿Seguro que deseas eliminar esta mesa?');
  if (!ok) return;

  try {
    setIsSaving(true);

    const response = await fetch(`http://localhost:3001/tables/${tableId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const text = await response.text();
    let data = {};

    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      throw new Error('La respuesta del backend no fue JSON. Revisa si reiniciaste el backend.');
    }

    if (!response.ok) {
      throw new Error(data.error || 'No se pudo eliminar la mesa');
    }

    await loadProtectedData(token);
    setSelectedTable(null);
  } catch (error) {
    console.error(error);
    alert(error.message || 'Error al eliminar la mesa');
  } finally {
    setIsSaving(false);
  }
};

 /* ELIMINAR MESA ARRIBAS*/

  const handleCreateCategory = async (event) => {
    event.preventDefault();
    if (!authUser?.branchId) return;

    setIsSaving(true);
    try {
      await fetchJson('/categories', {
        method: 'POST',
        headers: protectedHeaders,
        body: JSON.stringify({
          branchId: authUser.branchId,
          name: categoryForm.name,
          sortOrder: Number(categoryForm.sortOrder || 0),
        }),
      });
      setCategoryForm(emptyCategoryForm);
      setShowCategoryForm(false);
      await loadProtectedData(token);
      setMessage('Categoría creada correctamente.');
    } catch (error) {
      setConnectionError(error.message);
    } finally {
      setIsSaving(false);
    }
  };

const handleCreateProduct = async (event) => {
  event.preventDefault();
  if (!authUser?.branchId) return;

  setIsSaving(true);

  try {
    let uploadedImageUrl = productForm.imageUrl || null;

    // 1. Subir la imagen si el usuario seleccionó una nueva
    if (productImageFile) {
      const formData = new FormData();
      formData.append('image', productImageFile);

      const uploadResponse = await fetch(`${API_URL}/products/upload-image`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const uploadData = await uploadResponse.json();

      if (!uploadResponse.ok) {
        throw new Error(uploadData.error || 'No se pudo subir la imagen');
      }

      // Guardamos la URL real que devolvió el backend
      uploadedImageUrl = uploadData.fileUrl; 
    }

    // 2. Si estamos EDITANDO un producto
    if (editingProductId) {
      await fetchJson(`/products/${editingProductId}`, {
        method: 'PATCH',
        headers: protectedHeaders,
        body: JSON.stringify({
          categoryId: productForm.categoryId || null,
          sku: productForm.sku || null,
          name: productForm.name,
          description: productForm.description || null,
          price: Number(productForm.price),
          taxRate: Number(productForm.taxRate || 0.18),
          preparationTimeMinutes: Number(productForm.preparationTimeMinutes || 15),
          availableForSale: true,
          imageUrl: uploadedImageUrl, // ✅ CORREGIDO: Antes decía iimageUrl: item.imageUrl
        }),
      });

      setEditingProductId(null);
      setProductForm(emptyProductForm);
      setProductImageFile(null);
      setShowProductForm(false);
      await loadProtectedData(token);
      setMessage('Producto actualizado correctamente.');
      return;
    }

    // 3. Si estamos CREANDO un producto nuevo
    await fetchJson('/products', {
      method: 'POST',
      headers: protectedHeaders,
      body: JSON.stringify({
        branchId: authUser.branchId,
        categoryId: productForm.categoryId || null,
        sku: productForm.sku || null,
        name: productForm.name,
        description: productForm.description || null,
        price: Number(productForm.price),
        taxRate: Number(productForm.taxRate || 0.18),
        preparationTimeMinutes: Number(productForm.preparationTimeMinutes || 15),
        imageUrl: uploadedImageUrl, // ✅ CORREGIDO: Antes decía imageUrl: item.imageUrl
      }),
    });

    setProductForm(emptyProductForm);
    setProductImageFile(null);
    setShowProductForm(false);
    await loadProtectedData(token);
    setMessage('Producto creado correctamente.');
  } catch (error) {
    setConnectionError(error.message);
  } finally {
    setIsSaving(false);
  }
};

  const startEditProduct = (item) => {
  setEditingProductId(item.id);
  setProductForm({
    name: item.name || '',
    categoryId: item.categoryId || '',
    sku: item.sku || '',
    description: item.description || '',
    price: item.priceNumber || item.price || '',
    taxRate: item.taxRate || '0.18',
    preparationTimeMinutes: item.preparationTimeMinutes || '15',
    imageUrl: item.imageUrl || '',
  });

  setProductImageFile(null);
  setShowProductForm(true);
  setMessage('Edición cargada en el formulario.');
};

  const cancelEditProduct = () => {
    setEditingProductId(null);
    setProductForm(emptyProductForm);
    setShowProductForm(false);
  };

  const handleDeleteProduct = async (product) => {
    const confirmed = window.confirm(`¿Eliminar ${product.name}?`);
    if (!confirmed) return;

    setIsSaving(true);
    try {
      await fetchJson(`/products/${product.id}`, {
        method: 'DELETE',
        headers: protectedHeaders,
      });

      await loadProtectedData(token);
      setMessage('Producto eliminado correctamente.');
    } catch (error) {
      setConnectionError(error.message);
    } finally {
      setIsSaving(false);
    }
  };


  const handleUploadBusinessLogo = async () => {
  try {
    if (!logoFile) {
      alert('Primero selecciona un archivo');
      return;
    }

    const formData = new FormData();
    formData.append('logo', logoFile);

    const response = await fetch('http://localhost:3001/settings/business/upload-logo', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'No se pudo subir el logo');
    }

    setBusinessConfig((prev) => ({
      ...prev,
      logoUrl:data.fileUrl,
    }));

    alert('Logo subido correctamente');
  } catch (error) {
    console.error(error);
    alert(error.message || 'Error al subir logo');
  }
};

  const handleSaveBusinessConfig = async () => {
  try {
    setIsSaving(true);

    const response = await fetch('http://localhost:3001/settings/business', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        branchId: authUser?.branchId || authUser?.branch?.id,
        businessName: businessConfig.businessName,
        ruc: businessConfig.ruc,
        address: businessConfig.address,
        phone: businessConfig.phone,
        logoUrl: businessConfig.logoUrl,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'No se pudo guardar la configuración');
    }

    alert('Datos del negocio guardados correctamente');
  } catch (error) {
    console.error(error);
    alert(error.message || 'Error al guardar configuración');
  } finally {
    setIsSaving(false);
  }
};

 const handleCreateCustomer = async (event) => {
  event.preventDefault();

  setIsSaving(true);
  try {
    await fetchJson('/customers', {
      method: 'POST',
      headers: protectedHeaders,
      body: JSON.stringify({
        documentNumber: customerForm.documentNumber,
        firstName: customerForm.firstName,
        lastNamePaternal: customerForm.lastNamePaternal,
        lastNameMaternal: customerForm.lastNameMaternal,
      }),
    });

    setCustomerForm({
      documentNumber: '',
      firstName: '',
      lastNamePaternal: '',
      lastNameMaternal: '',
    });

    await loadProtectedData(token);
    setMessage('Cliente guardado correctamente.');
  } catch (error) {
    setConnectionError(error.message);
  } finally {
    setIsSaving(false);
  }
};

  const handleDeleteCustomer = async (customer) => {
  const confirmed = window.confirm(`¿Eliminar a ${customer.name}?`);
  if (!confirmed) return;

  setIsSaving(true);
  try {
    await fetchJson(`/customers/${customer.id}`, {
      method: 'DELETE',
      headers: protectedHeaders,
    });

    await loadProtectedData(token);
    setMessage('Cliente eliminado correctamente.');
  } catch (error) {
    setConnectionError(error.message);
  } finally {
    setIsSaving(false);
  }
};

const renderDashboard = () => {
  const activeOrders = orders.filter((order) => order.status !== 'PAID').length;

  const tableTotal = tables.length;
  const occupiedTables = tables.filter((table) =>
    ['OCCUPIED', 'Ocupada', 'OCUPADA'].includes(table.status)
  ).length;
  const freeTables = tables.filter((table) =>
    ['FREE', 'Libre', 'LIBRE'].includes(table.status)
  ).length;
  const reservedTables = tables.filter((table) =>
    ['RESERVED', 'Reservada', 'RESERVADA'].includes(table.status)
  ).length;

  const salonOrders = orderList.filter((order) =>
    String(order.channelLabel || order.channel || '').toLowerCase().includes('sal')
  ).length;
  const deliveryOrders = orderList.filter((order) =>
    String(order.channelLabel || order.channel || '').toLowerCase().includes('delivery')
  ).length;
  const whatsappOrders = orderList.filter((order) =>
    String(order.channelLabel || order.channel || '').toLowerCase().includes('whatsapp')
  ).length;

  const chartTotal = Number(reportMetrics.salesToday || 0);
  const chartPoints = [0, 4, 8, 13, 19, 28, 36, 48, 58, 65, 72, 79, 84, 90, 96, 100];

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-4 gap-4">
        <div className={panelCard}>
          <p className="text-sm text-slate-500">Ventas del día</p>
          <p className="mt-2 text-2xl font-bold">
            S/ {Number(reportMetrics.salesToday || 0).toFixed(2)}
          </p>
          <p className="mt-2 text-xs text-slate-400">Ingresos registrados hoy</p>
        </div>

        <div className={panelCard}>
          <p className="text-sm text-slate-500">Pedidos del día</p>
          <p className="mt-2 text-2xl font-bold">{reportMetrics.ordersToday || 0}</p>
          <p className="mt-2 text-xs text-slate-400">Pedidos cobrados hoy</p>
        </div>

        <div className={panelCard}>
          <p className="text-sm text-slate-500">Ticket promedio</p>
          <p className="mt-2 text-2xl font-bold">
            S/ {Number(reportMetrics.ticketToday || 0).toFixed(2)}
          </p>
          <p className="mt-2 text-xs text-slate-400">Promedio por pedido</p>
        </div>

        <div className={panelCard}>
          <p className="text-sm text-slate-500">Pedidos activos</p>
          <p className="mt-2 text-2xl font-bold">{activeOrders}</p>
          <p className="mt-2 text-xs text-slate-400">En proceso</p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-12">
        <div className={`${panelCard} xl:col-span-5`}>
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Ventas</h3>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500">
              Hoy
            </span>
          </div>

          <div className="mt-6 h-56">
            <svg viewBox="0 0 520 220" className="h-full w-full">
              {[40, 80, 120, 160].map((y) => (
                <line
                  key={y}
                  x1="0"
                  y1={y}
                  x2="520"
                  y2={y}
                  stroke="#e2e8f0"
                  strokeWidth="1"
                />
              ))}

              <polyline
                fill="none"
                stroke="#0f172a"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={chartPoints
                  .map((value, index) => {
                    const x = (index / (chartPoints.length - 1)) * 520;
                    const y = 190 - value * 1.45;
                    return `${x},${y}`;
                  })
                  .join(' ')}
              />

              <circle cx="330" cy="74" r="6" fill="#0f172a" />
            </svg>
          </div>

          <div className="mt-2 flex justify-between text-xs text-slate-400">
            <span>00:00</span>
            <span>08:00</span>
            <span>16:00</span>
            <span>24:00</span>
          </div>
        </div>

        <div className={`${panelCard} xl:col-span-4`}>
          <h3 className="text-xl font-semibold">Estado de mesas</h3>

          <div className="mt-6 flex flex-col items-center justify-center gap-5">
            <div
              className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full"
              style={{
                background: `conic-gradient(#0f172a 0 ${tableTotal ? (occupiedTables / tableTotal) * 100 : 0}%, #64748b 0 ${tableTotal ? ((occupiedTables + freeTables) / tableTotal) * 100 : 0}%, #cbd5e1 0 100%)`,
              }}
            >
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-center">
                <div>
                  <p className="text-2xl font-bold">{tableTotal}</p>
                  <p className="text-xs text-slate-400">Mesas</p>
                </div>
              </div>
            </div>

            <div className="mt-6 grid w-full grid-cols-1 gap-3 text-center sm:grid-cols-3">
              <div className="min-w-0 rounded-2xl bg-slate-50 px-2 py-3">
  <p className="text-lg font-bold text-slate-900">{freeTables}</p>
  <p className="mt-1 text-xs text-slate-500">Disponibles</p>
</div>
              <div className="min-w-0 rounded-2xl bg-slate-50 px-2 py-3">
  <p className="text-lg font-bold text-slate-900">{occupiedTables}</p>
  <p className="mt-1 text-xs text-slate-500">Ocupadas</p>
</div>
              <div className="min-w-0 rounded-2xl bg-slate-50 px-2 py-3">
  <p className="text-lg font-bold text-slate-900">{reservedTables}</p>
  <p className="mt-1 text-xs text-slate-500">Reservadas</p>
</div>
            </div>
          </div>
        </div>

          <div className={`${panelCard} xl:col-span-3`}>
          <h3 className="text-xl font-semibold">Canales de venta</h3>

          <div className="mt-6 flex items-center gap-6">
            <div
              className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full"
              style={{
                background: `conic-gradient(#0f172a 0 ${orderList.length ? (salonOrders / orderList.length) * 100 : 0}%, #64748b 0 ${orderList.length ? ((salonOrders + deliveryOrders) / orderList.length) * 100 : 0}%, #cbd5e1 0 100%)`,
              }}
            >
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-center">
                <div>
                  <p className="text-2xl font-bold">{orderList.length}</p>
                  <p className="text-xs text-slate-400">Pedidos</p>
                </div>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <p className="text-slate-600">
                <span className="font-bold text-slate-900">{salonOrders}</span> salón
              </p>
              <p className="text-slate-600">
                <span className="font-bold text-slate-900">{deliveryOrders}</span> delivery
              </p>
              <p className="text-slate-600">
                <span className="font-bold text-slate-900">{whatsappOrders}</span> WhatsApp
              </p>
            </div>
          </div>
        </div>
      </section>

    <section className="grid gap-6 xl:grid-cols-12">
      <div className={`${panelCard} xl:col-span-8`}>
        <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-2xl font-bold tracking-tight">Pedidos recientes</h3>
            <p className="mt-1 text-sm text-slate-500">
              Últimos movimientos del restaurante
            </p>
          </div>

          <button
            type="button"
            onClick={() => setActiveView('cashier')}
            className="text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            Ver todos
          </button>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-[12px] uppercase tracking-[0.18em] text-slate-400">
                <th className="py-3 pr-4 font-semibold">Pedido</th>
                <th className="py-3 pr-4 font-semibold">Cliente</th>
                <th className="py-3 pr-4 font-semibold">Canal</th>
                <th className="py-3 pr-4 font-semibold">Estado</th>
                <th className="py-3 text-right font-semibold">Total</th>
              </tr>
            </thead>

            <tbody>
              {orderList.length ? (
                orderList.slice(0, 6).map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-slate-100 last:border-b-0"
                  >
                    <td className="py-4 pr-4">
                      <p className="font-semibold text-slate-900">
                        {order.orderNumber}
                      </p>
                    </td>

                    <td className="py-4 pr-4">
                      <p className="font-medium text-slate-700">
                        {order.customerLabel ||
                          order.customer?.fullName ||
                          'Sin referencia'}
                      </p>
                    </td>

                    <td className="py-4 pr-4">
                      <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                        {order.channelLabel || order.channel || '-'}
                      </span>
                    </td>

                    <td className="py-4 pr-4">
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${badgeClass(
                          order.status === 'PAID'
                            ? 'Pagado'
                            : order.status === 'CONFIRMED'
                            ? 'Confirmado'
                            : 'Pendiente'
                        )}`}
                      >
                        {order.status === 'PAID'
                          ? 'Pagado'
                          : order.status === 'CONFIRMED'
                          ? 'Confirmado'
                          : 'Pendiente'}
                      </span>
                    </td>

                    <td className="py-4 text-right font-semibold text-slate-900">
                      S/ {Number(order.total || 0).toFixed(2)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="py-10">
                    <EmptyState
                      title="Sin pedidos registrados"
                      text="Todavía no hay pedidos para mostrar."
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-6 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2 xl:grid-cols-4">
          <div>
            <p className="text-xs text-slate-400">Pedidos registrados</p>
            <p className="mt-1 text-lg font-bold">{orderList.length}</p>
          </div>

          <div>
            <p className="text-xs text-slate-400">Comensales atendidos</p>
            <p className="mt-1 text-lg font-bold">
              {orderList.reduce((sum, order) => sum + Number(order.guests || order.people || 0), 0)}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-400">Tiempo promedio de atención</p>
            <p className="mt-1 text-lg font-bold">18 min</p>
          </div>

          <div>
            <p className="text-xs text-slate-400">Ventas por hora pico</p>
            <p className="mt-1 text-lg font-bold">12:00 - 14:00</p>
          </div>
        </div>
      </div>

      <div className="space-y-6 xl:col-span-4">
        <div className={panelCard}>
          <div>
            <h3 className="text-xl font-semibold">Métodos de pago</h3>
            <p className="mt-1 text-sm text-slate-500">
              Distribución de ingresos
            </p>
          </div>

          <div className="mt-5 space-y-4">
            {reportMetrics.paymentByMethod.length ? (
              reportMetrics.paymentByMethod.slice(0, 4).map((item) => {
                const maxTotal = reportMetrics.paymentByMethod[0]?.total || 1;
                const percentage = Math.max(
                  10,
                  Math.round((Number(item.total || 0) / maxTotal) * 100)
                );

                return (
                  <div key={item.method}>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-800">
                        {item.method}
                      </p>
                      <p className="text-sm font-bold text-slate-900">
                        S/ {Number(item.total || 0).toFixed(2)}
                      </p>
                    </div>

                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-slate-900"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <EmptyState
                title="Sin pagos"
                text="Todavía no hay pagos para mostrar."
              />
            )}
          </div>
        </div>

        <div className={panelCard}>
          <div>
            <h3 className="text-xl font-semibold">Productos más vendidos</h3>
            <p className="mt-1 text-sm text-slate-500">Ranking del día</p>
          </div>

          <div className="mt-5 space-y-3">
            {reportMetrics.topProducts.length ? (
              reportMetrics.topProducts.slice(0, 5).map((product, index) => (
                <div
                  key={`${product.name}-${index}`}
                  className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3 last:border-b-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-800">
                      {product.name}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Producto vendido
                    </p>
                  </div>

                  <p className="text-sm font-semibold text-slate-500">
                    {product.qty} vendidos
                  </p>
                </div>
              ))
            ) : (
              <EmptyState
                title="Sin productos"
                text="Todavía no hay productos vendidos."
              />
            )}
          </div>
        </div>
      </div>
    </section>
   </div>
  );
};




  const renderPOS = () => (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <div className="space-y-6">
        <div className={panelCard}>
          <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h3 className="text-xl font-semibold">Punto de venta</h3>
              <p className="text-sm text-slate-500">
                Catálogo compacto para trabajar con muchos productos desde una sola vista.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {['Salón', 'Delivery', 'Recojo'].map((type) => (
                <button
                  key={type}
                  onClick={() => setOrderType(type)}
                  className={`rounded-2xl px-4 py-2 text-sm font-medium ${
                    orderType === type ? 'bg-slate-950 text-white' : 'border border-slate-200 bg-white'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4 grid gap-3 xl:grid-cols-[1fr_auto]">
            <input
              className={inputClass}
              placeholder="Buscar plato, bebida o categoría"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
            />

            <select
              className={inputClass}
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            >
              <option value="ALL">Todas las categorías</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategoryFilter('ALL')}
              className={`rounded-full px-4 py-2 text-sm font-medium ${
                selectedCategoryFilter === 'ALL' ? 'bg-slate-950 text-white' : 'border border-slate-200 bg-white'
              }`}
            >
              Todo
            </button>

            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategoryFilter(category.id)}
                className={`rounded-full px-4 py-2 text-sm font-medium ${
                  selectedCategoryFilter === category.id ? 'bg-slate-950 text-white' : 'border border-slate-200 bg-white'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-5 xl:grid-cols-2 2xl:grid-cols-3">
  {filteredProducts.map((item) => (
    <div
      key={item.id}
      className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
    >
      <div className="h-40 bg-slate-100">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            Sin imagen
          </div>
        )}
      </div>

      <div className="p-4">
        <p className="min-h-[72px] text-lg font-semibold text-slate-900">
          {item.name}
        </p>

        <p className="mt-1 text-sm text-slate-500">
          {item.categoryLabel}
        </p>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-xl font-bold text-slate-900">
            S/ {item.priceNumber.toFixed(2)}
          </p>

          <button
            type="button"
            onClick={() => handleAddProduct(item)}
            className="rounded-2xl bg-slate-950 px-3 py-2 text-xs font-semibold text-white hover:opacity-90 shrink-0"
          >
            Agregar
          </button>
        </div>
      </div>
    </div>
  ))}

  {!filteredProducts.length && (
    <div className="col-span-full">
      <EmptyState title="Sin resultados" text="No hay productos que coincidan con ese filtro." />
    </div>
  )}
</div>
        </div>
      </div>

      <div className="space-y-6">
        <div className={`${panelCard} sticky top-6`}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-slate-500">Pedido actual</p>
              <h4 className="text-lg font-bold">{selectedTable}</h4>
            </div>

            <select
              value={selectedTable}
              onChange={(e) => setSelectedTable(e.target.value)}
              className="w-40 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              {mappedTables.map((table) => (
                <option key={table.id}>{table.label}</option>
              ))}
            </select>
          </div>

          {currentOrderEntity ? (
            <p className="mb-3 text-sm text-emerald-700">Pedido activo: {currentOrderEntity.orderNumber}</p>
          ) : (
            <p className="mb-3 text-sm text-amber-700">No existe pedido para esta mesa.</p>
          )}

          <div className="max-h-[360px] space-y-3 overflow-y-auto pr-1">
            {currentOrder.map((row) => (
              <div key={row.id} className="rounded-2xl border border-slate-200 bg-white p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{row.item}</p>
                    <p className="mt-1 text-xs text-slate-500">{row.note || 'Sin observaciones'}</p>
                  </div>
                  <p className="text-sm font-semibold">x{row.qty}</p>
                </div>

                <div className="mt-3 flex items-center justify-between gap-3">
                  <div className="text-sm text-slate-500">S/ {row.price.toFixed(2)} c/u</div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateOrderItemQty(row.id, Math.max(row.qty - 1, 0), row.note)}
                      className="h-8 w-8 rounded-full border border-slate-200 text-sm font-bold"
                    >
                      -
                    </button>

                    <span className="min-w-8 text-center text-sm font-semibold">{row.qty}</span>

                    <button
                      onClick={() => updateOrderItemQty(row.id, row.qty + 1, row.note)}
                      className="h-8 w-8 rounded-full border border-slate-200 text-sm font-bold"
                    >
                      +
                    </button>

                    <button
                      onClick={() => updateOrderItemQty(row.id, 0, row.note)}
                      className="rounded-xl border border-rose-200 px-3 py-2 text-xs font-medium text-rose-600"
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {!currentOrder.length && <EmptyState title="Sin items" text="Crea un pedido y agrega productos." />}
          </div>

          <div className="mt-6  border-t border-slate-200 pt-4">
              <div className="flex items-center justify-between text-x1 font-bold text-slate-900">
                <span>Total</span>
                <span>S/ {Number(total || 0).toFixed(2)}</span>
              </div>
              </div>
            </div>
</div>
    </div>  
  );

const renderTables = () => (
  <div className="space-y-6">
    <div className={panelCard}>
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-2xl font-bold text-slate-900">Mapa de mesas</h3>
          <p className="mt-1 text-sm text-slate-500">
            Crea mesas y selecciona una para abrir pedido.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={() => setShowTableForm((v) => !v)}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            {showTableForm ? 'Ocultar formulario' : 'Nueva mesa'}
          </button>

          <button
            onClick={handleCreateOrder}
            disabled={isSaving || !selectedTableObj}
            className="rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            Crear pedido para mesa
          </button>
        </div>
      </div>

      {showTableForm && (
        <form
          onSubmit={handleCreateTable}
          className="mb-6 grid gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-5 md:grid-cols-2 xl:grid-cols-4"
        >
          <Field label="Número de mesa">
            <input
              className={inputClass}
              value={tableForm.number}
              onChange={(e) => setTableForm((p) => ({ ...p, number: e.target.value }))}
              required
            />
          </Field>

          <Field label="Nombre">
            <input
              className={inputClass}
              value={tableForm.name}
              onChange={(e) => setTableForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Mesa terraza"
            />
          </Field>

          <Field label="Capacidad">
            <input
              className={inputClass}
              value={tableForm.capacity}
              onChange={(e) => setTableForm((p) => ({ ...p, capacity: e.target.value }))}
              required
            />
          </Field>

          <Field label="Estado inicial">
            <select
              className={inputClass}
              value={tableForm.status}
              onChange={(e) => setTableForm((p) => ({ ...p, status: e.target.value }))}
            >
              <option value="FREE">Libre</option>
              <option value="RESERVED">Reservada</option>
              <option value="CLEANING">Limpieza</option>
              <option value="DISABLED">Inactiva</option>
            </select>
          </Field>

          <div className="flex justify-end gap-3 md:col-span-2 xl:col-span-4">
            <button
              type="button"
              onClick={() => {
                setTableForm(emptyTableForm);
                setShowTableForm(false);
              }}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              Guardar mesa
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {mappedTables.map((table) => {
          const isSelected = selectedTable === table.label;
          const isOccupied =
            String(table.statusLabel || '').toLowerCase() === 'ocupada';

          return (
            <button
              key={table.id}
              onClick={() => {
                setSelectedTable(table.label);
                setActiveView('pos');
              }}
              className={`rounded-3xl border p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-lg ${
                isSelected
                  ? 'border-slate-900 bg-slate-50 shadow-md'
                  : isOccupied
                  ? 'border-rose-200 bg-rose-50/50 hover:border-rose-300'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-xl font-bold text-slate-900">{table.label}</h4>
                  <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">
                    Mesa disponible para atención
                  </p>
                </div>

                <span
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${badgeClass(table.statusLabel)}`}
                >
                  {table.statusLabel}
                </span>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-slate-50 px-3 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Capacidad
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {table.capacity} personas
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 px-3 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Área
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {table.diningArea?.name || 'General'}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-2">
  <span className="text-xs text-slate-500">
    Toca para abrir punto de venta
  </span>

  <div className="flex items-center gap-2">
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        handleDeleteTable(table.id);
      }}
      className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:bg-rose-100"
    >
      Eliminar
    </button>

    <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
      Abrir
    </span>
  </div>
</div>
            </button>
          );
        })}
      </div>
    </div>
  </div>
);

const renderKitchenStatusLabel = (status) => {
  switch (status) {
    case 'PENDING':
      return 'Pendiente';
    case 'PREPARING':
      return 'En preparación';
    case 'READY':
      return 'Listo';
    case 'SERVED':
      return 'Entregado';
    default:
      return status || 'Sin estado';
  }
};

const renderKitchenStatusBadgeClass = (status) => {
  switch (status) {
    case 'PENDING':
      return 'bg-amber-50 text-amber-700 border border-amber-200';
    case 'PREPARING':
      return 'bg-slate-900 text-white border border-slate-900';
    case 'READY':
      return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    case 'SERVED':
      return 'bg-blue-50 text-blue-700 border border-blue-200';
    default:
      return 'bg-slate-100 text-slate-600 border border-slate-200';
  }
};

const renderKitchenActionButton = (item) => {
  if (item.kitchenStatus === 'PENDING') {
    return (
      <button
        onClick={() => updateKitchenItemStatus(item.id, 'PREPARING')}
        className="rounded-xl bg-slate-900 px-3 py-.1.5 text-sm font-semibold text-white transition hover:opacity-90"
      >
        En preparación
      </button>
    );
  }

  if (item.kitchenStatus === 'PREPARING') {
    return (
      <button
        onClick={() => updateKitchenItemStatus(item.id, 'READY')}
        className="rounded-xl bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:opacity-90"
      >
        Marcar listo
      </button>
    );
  }

  if (item.kitchenStatus === 'READY') {
    return (
      <button
        onClick={() => updateKitchenItemStatus(item.id, 'SERVED')}
        className="rounded-xl bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:opacity-90"
      >
        Entregado
      </button>
    );
  }

  return (
    <span className="inline-flex rounded-xl bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-500">
      Entregado
    </span>
  );
};

const renderKitchen = () => (
  <div className="space-y-5">
    <div className={panelCard}>
      <h2 className="text-2xl font-bold text-slate-900">Módulo de cocina</h2>
      <p className="mt-1 text-sm text-slate-500">
        Pedidos enviados desde punto de venta.
      </p>
    </div>

    {kitchenLoading ? (
      <div className={panelCard}>
        <p className="text-sm text-slate-500">Cargando pedidos...</p>
      </div>
    ) : kitchenOrders.length === 0 ? (
      <div className={panelCard}>
        <p className="text-lg font-semibold text-slate-700">Sin pedidos pendientes</p>
        <p className="mt-1 text-sm text-slate-500">
          Aquí aparecerán los pedidos enviados a cocina.
        </p>
      </div>
    ) : (
      <div className="space-y-4">
        {[...kitchenOrders]
             .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
             .map((order) => (
          <div
            key={order.id}
            className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-[0_12px_30px_rgba(15,23,42,0.05)] backdrop-blur"
          >
            <div className="mb-4 flex flex-col gap-3 border-b border-slate-100 pb-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-2xl font-bold text-slate-900">
                  {order.orderNumber}
                </h3>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                  <span>{order.tableName ? `Mesa: ${order.tableName}` : 'Sin mesa'}</span>
                  <span>•</span>
                  <span>{new Date(order.createdAt).toLocaleString()}</span>
                </div>
              </div>

              <div className="inline-flex w-fit rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
                {order.orderType}
              </div>
            </div>

            <div className="grid grip-cols-1 gap-3 xl:grid-cols-2">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-base font-semibold text-slate-900">
                          {item.productName}
                        </p>
                        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-700 border border-slate-200">
                          x{item.qty}
                        </span>
                      </div>

                      <p className="mt-1 text-sm text-slate-500">
                        {item.notes?.trim() ? item.notes : 'Sin observaciones'}
                      </p>

                      <div className="mt-2">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${renderKitchenStatusBadgeClass(item.kitchenStatus)}`}
                        >
                          {renderKitchenStatusLabel(item.kitchenStatus)}
                        </span>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center justify-start md:justify-end">
                      {renderKitchenActionButton(item)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);



const renderCashier = () => (
  <div className="space-y-6">
    <div className="flex flex-wrap gap-2">
      {[
        ['quick', 'Cobro rápido'],
        ['delivery', 'Delivery pendientes'],
        ['payments', 'Pagos registrados'],
      ].map(([value, label]) => (
        <button
          key={value}
          type="button"
          onClick={() => setCashierTab(value)}
          className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
            cashierTab === value
              ? 'bg-slate-950 text-white'
              : 'border border-slate-200 bg-white text-slate-700'
          }`}
        >
          {label}
        </button>
      ))}
    </div>

    {cashierTab === 'quick' ? (
      <div className="grid gap-6 xl:grid-cols-12">
        <div className={`${panelCard} xl:col-span-7`}>
          <h3 className="text-xl font-semibold">Detalle del pedido</h3>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
            {currentOrderEntity ? (
              <>
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <p className="text-sm text-slate-500">Pedido actual</p>
                    <p className="text-lg font-semibold">
                      {currentOrderEntity.orderNumber || 'Sin código'}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Mesa: {selectedTable || 'Sin mesa'}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-slate-500">Total</p>
                    <p className="text-2xl font-bold">
                      S/ {Number(currentOrderEntity?.total || total || 0).toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {currentOrder.length ? (
                    currentOrder.map((item) => (
                      <div
                        key={`${item.productId}-${item.note}-${item.id}`}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold">{item.item}</p>
                            <p className="mt-1 text-sm text-slate-500">
                              Cantidad: {item.qty}
                            </p>
                            {item.note ? (
                              <p className="mt-1 text-sm text-amber-700">
                                Obs: {item.note}
                              </p>
                            ) : null}
                          </div>

                          <div className="text-right">
                            <p className="text-sm text-slate-500">
                              S/ {Number(item.price || 0).toFixed(2)} c/u
                            </p>
                            <p className="mt-1 font-semibold">
                              S/ {(Number(item.price || 0) * Number(item.qty || 0)).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <EmptyState
                      title="Sin productos"
                      text="La mesa seleccionada no tiene items cargados."
                    />
                  )}
                </div>

                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Subtotal</span>
                    <span className="font-medium">
                      S/ {Number(subtotal || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-base font-semibold">
                    <span>Total</span>
                    <span>S/ {Number(currentOrderEntity?.total || total || 0).toFixed(2)}</span>
                  </div>
                </div>
              </>
            ) : (
              <EmptyState
                title="Sin pedido activo"
                text="Selecciona una mesa con pedido para revisar y cobrar."
              />
            )}
          </div>
        </div>

        <div className={`${panelCard} xl:col-span-5`}>
          <h3 className="text-xl font-semibold">Cobro rápido</h3>

          <div className="mt-4 space-y-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm text-slate-500">Mesa seleccionada</p>

              <select
                value={selectedTable}
                onChange={(e) => setSelectedTable(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
              >
                {(occupiedTables.length ? occupiedTables : mappedTables).map((table) => (
                  <option key={table.id} value={table.label}>
                    {table.label}
                  </option>
                ))}
              </select>

              <p className="mt-2 text-sm text-slate-500">
                {currentOrderEntity ? currentOrderEntity.orderNumber : 'Sin pedido activo'}
              </p>

              <p className="mt-3 text-2xl font-bold">
                S/ {Number(currentOrderEntity?.total || 0).toFixed(2)}
              </p>

              <div className="mt-4 space-y-3">
                <p className="text-sm font-medium text-slate-700">Comprobante</p>

                <div className="flex flex-wrap gap-2">
                  {[
                    ['BOLETA', 'Boleta'],
                    ['BOLETA_SIMPLE', 'Boleta simple'],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => {
                        setReceiptType(value);
                        if (value !== 'BOLETA') {
                          setCashierCustomerForm({
                            documentNumber: '',
                            firstName: '',
                            lastNamePaternal: '',
                            lastNameMaternal: '',
                          });
                          setSelectedCustomerIdForPayment(null);
                        }
                      }}
                      className={`rounded-2xl px-3 py-2 text-xs font-medium ${
                        receiptType === value
                          ? 'bg-slate-950 text-white'
                          : 'border border-slate-200 bg-white text-slate-700'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {receiptType === 'BOLETA' && (
                  <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <input
                      className={inputClass}
                      placeholder="DNI"
                      value={cashierCustomerForm.documentNumber}
                      onChange={(e) =>
                        setCashierCustomerForm((prev) => ({
                          ...prev,
                          documentNumber: e.target.value.replace(/\D/g, '').slice(0, 8),
                        }))
                      }
                    />

                    <button
                      type="button"
                      onClick={handleLookupCashierDni}
                      disabled={isSearchingCashierDni}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium"
                    >
                      {isSearchingCashierDni ? 'Buscando...' : 'Buscar DNI'}
                    </button>

                    <input
                      className={inputClass}
                      placeholder="Nombres"
                      value={cashierCustomerForm.firstName}
                      onChange={(e) =>
                        setCashierCustomerForm((prev) => ({
                          ...prev,
                          firstName: e.target.value,
                        }))
                      }
                    />

                    <input
                      className={inputClass}
                      placeholder="Apellido paterno"
                      value={cashierCustomerForm.lastNamePaternal}
                      onChange={(e) =>
                        setCashierCustomerForm((prev) => ({
                          ...prev,
                          lastNamePaternal: e.target.value,
                        }))
                      }
                    />

                    <input
                      className={inputClass}
                      placeholder="Apellido materno"
                      value={cashierCustomerForm.lastNameMaternal}
                      onChange={(e) =>
                        setCashierCustomerForm((prev) => ({
                          ...prev,
                          lastNameMaternal: e.target.value,
                        }))
                      }
                    />
                  </div>
                )}
              </div>

              <div className="mt-4">
                <p className="text-sm font-medium text-slate-700">
                  Seleccionar método de pago
                </p>

                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                >
                  <option value="Yape">Yape</option>
                  <option value="Efectivo">Efectivo</option>
                  <option value="Tarjeta">Tarjeta</option>
                </select>
              </div>

              <button
                onClick={handlePayCurrentOrder}
               disabled={isSaving || !selectedDeliveryOrder}
                className="mt-4 w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                Cobrar pedido actual
              </button>

              <button
                onClick={handleDeleteCurrentOrder}
                disabled={isSaving || !currentOrderEntity}
                className="mt-3 w-full rounded-2xl border border-rose-200 px-4 py-3 text-sm font-semibold text-rose-600 disabled:opacity-60"
              >
                Eliminar pedido actual
              </button>
            </div>
          </div>
        </div>
      </div>
    ) : cashierTab === 'delivery' ? (
      <div className="grid gap-6 xl:grid-cols-12">
        <div className={`${panelCard} xl:col-span-7`}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-semibold">Delivery pendientes</h3>
              <p className="text-sm text-slate-500">
                Pedidos delivery o WhatsApp listos para cobrar
              </p>
            </div>

            <select
              value={selectedDeliveryOrderId}
              onChange={(e) => setSelectedDeliveryOrderId(e.target.value)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
            >
              {deliveryPendingOrders.map((order) => (
                <option key={order.id} value={order.id}>
                  {order.orderNumber}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
            {selectedDeliveryOrder ? (
              <>
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <p className="text-sm text-slate-500">Pedido delivery</p>
                    <p className="text-lg font-semibold">
                      {selectedDeliveryOrder.orderNumber || 'Sin código'}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Canal: {selectedDeliveryOrder.channel || 'DELIVERY'}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Cliente: {selectedDeliveryOrder.customer?.fullName || 'Cliente no registrado'}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Nota: {selectedDeliveryOrder.notes || 'Sin referencia'}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-slate-500">Total</p>
                    <p className="text-2xl font-bold">
                      S/ {Number(selectedCashierTotal || 0).toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {selectedCashierItems.length ? (
                    selectedCashierItems.map((item) => (
                      <div
                        key={`${item.productId}-${item.note}-${item.id}`}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold">{item.item}</p>
                            <p className="mt-1 text-sm text-slate-500">
                              Cantidad: {item.qty}
                            </p>
                            {item.note ? (
                              <p className="mt-1 text-sm text-amber-700">
                                Obs: {item.note}
                              </p>
                            ) : null}
                          </div>

                          <div className="text-right">
                            <p className="text-sm text-slate-500">
                              S/ {Number(item.price || 0).toFixed(2)} c/u
                            </p>
                            <p className="mt-1 font-semibold">
                              S/ {(Number(item.price || 0) * Number(item.qty || 0)).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <EmptyState
                      title="Sin productos"
                      text="Este pedido delivery no tiene items cargados."
                    />
                  )}
                </div>

                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Subtotal</span>
                    <span className="font-medium">
                      S/ {Number(selectedCashierSubtotal || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-base font-semibold">
                    <span>Total</span>
                    <span>S/ {Number(selectedCashierTotal || 0).toFixed(2)}</span>
                  </div>
                </div>
              </>
            ) : (
              <EmptyState
                title="Sin delivery pendiente"
                text="No hay pedidos delivery pendientes por cobrar."
              />
            )}
          </div>
        </div>

        <div className={`${panelCard} xl:col-span-5`}>
          <h3 className="text-xl font-semibold">Cobro delivery</h3>

          <div className="mt-4 space-y-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm text-slate-500">Pedido seleccionado</p>
              <p className="mt-2 text-lg font-semibold">
                {selectedDeliveryOrder?.orderNumber || 'Sin pedido'}
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Total a cobrar
              </p>
              <p className="mt-1 text-2xl font-bold">
  S/ {Number(selectedCashierTotal || 0).toFixed(2)}
</p>

              <div className="mt-4 space-y-3">
                <p className="text-sm font-medium text-slate-700">Comprobante</p>

                <div className="flex flex-wrap gap-2">
                  {[
                    ['BOLETA', 'Boleta'],
                    ['BOLETA_SIMPLE', 'Boleta simple'],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => {
                        setReceiptType(value);
                        if (value !== 'BOLETA') {
                          setCashierCustomerForm({
                            documentNumber: '',
                            firstName: '',
                            lastNamePaternal: '',
                            lastNameMaternal: '',
                          });
                          setSelectedCustomerIdForPayment(null);
                        }
                      }}
                      className={`rounded-2xl px-3 py-2 text-xs font-medium ${
                        receiptType === value
                          ? 'bg-slate-950 text-white'
                          : 'border border-slate-200 bg-white text-slate-700'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {receiptType === 'BOLETA' && (
                  <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <input
                      className={inputClass}
                      placeholder="DNI"
                      value={cashierCustomerForm.documentNumber}
                      onChange={(e) =>
                        setCashierCustomerForm((prev) => ({
                          ...prev,
                          documentNumber: e.target.value.replace(/\D/g, '').slice(0, 8),
                        }))
                      }
                    />

                    <button
                      type="button"
                      onClick={handleLookupCashierDni}
                      disabled={isSearchingCashierDni}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium"
                    >
                      {isSearchingCashierDni ? 'Buscando...' : 'Buscar DNI'}
                    </button>

                    <input
                      className={inputClass}
                      placeholder="Nombres"
                      value={cashierCustomerForm.firstName}
                      onChange={(e) =>
                        setCashierCustomerForm((prev) => ({
                          ...prev,
                          firstName: e.target.value,
                        }))
                      }
                    />

                    <input
                      className={inputClass}
                      placeholder="Apellido paterno"
                      value={cashierCustomerForm.lastNamePaternal}
                      onChange={(e) =>
                        setCashierCustomerForm((prev) => ({
                          ...prev,
                          lastNamePaternal: e.target.value,
                        }))
                      }
                    />

                    <input
                      className={inputClass}
                      placeholder="Apellido materno"
                      value={cashierCustomerForm.lastNameMaternal}
                      onChange={(e) =>
                        setCashierCustomerForm((prev) => ({
                          ...prev,
                          lastNameMaternal: e.target.value,
                        }))
                      }
                    />
                  </div>
                )}
              </div>

              <div className="mt-4">
                <p className="text-sm font-medium text-slate-700">
                  Seleccionar método de pago
                </p>

                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                >
                  <option value="Yape">Yape</option>
                  <option value="Efectivo">Efectivo</option>
                  <option value="Tarjeta">Tarjeta</option>
                </select>
              </div>

              <button
                onClick={handlePayCurrentOrder}
                disabled={isSaving || !selectedDeliveryOrder}
                className="mt-4 w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                Cobrar delivery
              </button>

              <button
                onClick={handleDeleteCurrentOrder}
                disabled={isSaving || !selectedDeliveryOrder}
                className="mt-3 w-full rounded-2xl border border-rose-200 px-4 py-3 text-sm font-semibold text-rose-600 disabled:opacity-60"
              >
                Eliminar pedido delivery
              </button>
            </div>
          </div>
        </div>
      </div>
    ) : (
      <div className={panelCard}>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h3 className="text-xl font-semibold">Pagos registrados</h3>

          <input
            type="date"
            value={paymentDateFilter}
            onChange={(e) => setPaymentDateFilter(e.target.value)}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
          />
        </div>

        <div className="mt-4 space-y-3">
          {paymentList.length ? (
            paymentList.map((payment) => (
              <div key={payment.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{payment.orderCode}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {payment.method} · {payment.paidAt}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold">
                      {payment.receiptType || 'BOLETA_SIMPLE'}
                    </p>
                    <p className="mt-3 text-2xl font-bold">{payment.total}</p>
                  </div>
                </div>

                <div className="mt-3 flex justify-end gap-2">
                  <button
                    onClick={() => handlePrintReceipt(payment)}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium"
                  >
                    Imprimir
                  </button>
                  <button
                    onClick={() => handleStartEditPayment(payment)}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDeletePayment(payment)}
                    className="rounded-xl border border-rose-200 px-3 py-2 text-xs font-medium text-rose-600"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              title="Sin pagos"
              text="Todavía no hay pagos registrados."
            />
          )}
        </div>
      </div>
    )}
  </div>
);

 
  
const inventoryCategoryOptions = [
  { id: 'ALL', name: 'Todos' },
  ...categories.map((category) => ({
    id: category.id,
    name: category.name,
  })),
];



const renderInventory = () => (
  <div className="space-y-6">
    <div className={panelCard}>
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-2xl font-bold text-slate-900">Inventario comercial</h3>
          <p className="mt-1 text-sm text-slate-500">
            Crea categorías y productos desde la web
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={() => setShowCategoryForm((v) => !v)}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            {showCategoryForm ? 'Ocultar categoría' : 'Nueva categoría'}
          </button>

          <button
            onClick={() => setShowProductForm((v) => !v)}
            className="rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            {showProductForm ? 'Ocultar producto' : 'Nuevo producto'}
          </button>
        </div>
      </div>

      {showCategoryForm && (
        <form
          onSubmit={handleCreateCategory}
          className="mb-6 grid gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-5 md:grid-cols-2"
        >
          <Field label="Nombre de categoría">
            <input
              className={inputClass}
              value={categoryForm.name}
              onChange={(e) => setCategoryForm((p) => ({ ...p, name: e.target.value }))}
              required
            />
          </Field>

          <Field label="Orden">
            <input
              className={inputClass}
              value={categoryForm.sortOrder}
              onChange={(e) => setCategoryForm((p) => ({ ...p, sortOrder: e.target.value }))}
            />
          </Field>

          <div className="flex justify-end gap-3 md:col-span-2">
            <button
              type="button"
              onClick={() => {
                setCategoryForm(emptyCategoryForm);
                setShowCategoryForm(false);
              }}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              Guardar categoría
            </button>
          </div>
        </form>
      )}

      {showProductForm && (
        <form
          onSubmit={handleCreateProduct}
          className="mb-6 grid gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-5 md:grid-cols-2 xl:grid-cols-3"
        >
          <Field label="Nombre">
            <input
              className={inputClass}
              value={productForm.name}
              onChange={(e) => setProductForm((p) => ({ ...p, name: e.target.value }))}
              required
            />
          </Field>

          <Field label="Categoría">
            <select
              className={inputClass}
              value={productForm.categoryId}
              onChange={(e) => setProductForm((p) => ({ ...p, categoryId: e.target.value }))}
            >
              <option value="">Sin categoría</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="SKU">
            <input
              className={inputClass}
              value={productForm.sku}
              onChange={(e) => setProductForm((p) => ({ ...p, sku: e.target.value }))}
            />
          </Field>

          <Field label="Descripción">
            <input
              className={inputClass}
              value={productForm.description}
              onChange={(e) => setProductForm((p) => ({ ...p, description: e.target.value }))}
            />
          </Field>

          <Field label="Precio">
            <input
              className={inputClass}
              value={productForm.price}
              onChange={(e) => setProductForm((p) => ({ ...p, price: e.target.value }))}
              required
            />
          </Field>

          <Field label="Imagen referencial">
  <label className="flex h-[46px] cursor-pointer items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-500 transition hover:border-slate-300 hover:bg-slate-50">
    <span className="truncate">
      {productImageFile ? productImageFile.name : 'Seleccionar imagen'}
    </span>

    <span className="shrink-0 rounded-xl bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white">
      Elegir
    </span>

    <input
      type="file"
      accept="image/png,image/jpeg,image/webp"
      className="hidden"
      onChange={(e) => setProductImageFile(e.target.files?.[0] || null)}
    />
  </label>
</Field>

 

          <Field label="IGV">
            <input
              className={inputClass}
              value={productForm.taxRate}
              onChange={(e) => setProductForm((p) => ({ ...p, taxRate: e.target.value }))}
            />
          </Field>

          <Field label="Preparación (min)">
            <input
              className={inputClass}
              value={productForm.preparationTimeMinutes}
              onChange={(e) =>
                setProductForm((p) => ({ ...p, preparationTimeMinutes: e.target.value }))
              }
            />
          </Field>

          <div className="flex justify-end gap-3 md:col-span-2 xl:col-span-3">
            <button
              type="button"
              onClick={cancelEditProduct}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {editingProductId ? 'Guardar cambios' : 'Guardar producto'}
            </button>
          </div>
        </form>
      )}

      <div className="mb-5 rounded-3xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="w-full lg:max-w-md">
            <input
              className={inputClass}
              placeholder="Buscar producto..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
            />
          </div>

          <div className="text-sm text-slate-500">
            Mostrando <span className="font-semibold text-slate-700">{filteredProducts.length}</span>{' '}
            producto(s)
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelectedCategoryFilter('ALL')}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              selectedCategoryFilter === 'ALL'
                ? 'bg-slate-900 text-white'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            Todos
          </button>

          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setSelectedCategoryFilter(category.id)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                String(selectedCategoryFilter) === String(category.id)
                  ? 'bg-slate-900 text-white'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-slate-500">
              <th className="py-3 pr-4">Producto</th>
              <th className="py-3 pr-4">Categoría</th>
              <th className="py-3 pr-4">Precio</th>
              <th className="py-3 pr-4">Estado</th>
              <th className="py-3 pr-4 text-right">Acción</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((item) => (
              <tr key={item.id} className="border-b border-slate-50">
                <td className="py-3 pr-4 font-medium">{item.name}</td>
                <td className="py-3 pr-4">{item.categoryLabel}</td>
                <td className="py-3 pr-4">S/ {item.priceNumber.toFixed(2)}</td>
                <td className="py-3 pr-4">
                  <span
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${badgeClass(item.stockLabel)}`}
                  >
                    {item.stockLabel}
                  </span>
                </td>
                <td className="py-3 pr-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => startEditProduct(item)}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium"
                    >
                      Editar
                    </button>

                    <button
                      onClick={() => handleDeleteProduct(item)}
                      className="rounded-xl border border-rose-200 px-3 py-2 text-xs font-medium text-rose-600"
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {filteredProducts.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-sm text-slate-500">
                  No se encontraron productos con ese filtro.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);
  

 const renderCustomers = () => (
  <div className="space-y-6">
    <div className={panelCard}>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">Clientes</h3>
          <p className="text-sm text-slate-500">
            Registro básico de clientes para futuras ventas.
          </p>
        </div>

        <button
          onClick={() => setShowCustomerForm((v) => !v)}
          className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-medium text-white"
        >
          {showCustomerForm ? 'Ocultar formulario' : 'Nuevo cliente'}
        </button>
      </div>

      {showCustomerForm && (
        <form
          onSubmit={handleCreateCustomer}
          className="mb-6 grid gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-5 md:grid-cols-2 xl:grid-cols-4"
        >
          <Field label="DNI">
            <input
              className={inputClass}
              value={customerForm.documentNumber}
              onChange={(e) =>
                setCustomerForm((p) => ({
                  ...p,
                  documentNumber: e.target.value.replace(/\D/g, '').slice(0, 8),
                }))
              }
              placeholder="76148349"
              required
            />
          </Field>

          <div className="flex items-end">
            <button
              type="button"
              onClick={handleLookupDni}
              disabled={isSearchingDni}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium disabled:opacity-60"
            >
              {isSearchingDni ? 'Buscando DNI...' : 'Buscar DNI'}
            </button>
          </div>

          <Field label="Nombres">
            <input
              className={inputClass}
              value={customerForm.firstName}
              onChange={(e) =>
                setCustomerForm((p) => ({
                  ...p,
                  firstName: e.target.value,
                }))
              }
              required
            />
          </Field>

          <Field label="Apellido paterno">
            <input
              className={inputClass}
              value={customerForm.lastNamePaternal}
              onChange={(e) =>
                setCustomerForm((p) => ({
                  ...p,
                  lastNamePaternal: e.target.value,
                }))
              }
              required
            />
          </Field>

          <Field label="Apellido materno">
            <input
              className={inputClass}
              value={customerForm.lastNameMaternal}
              onChange={(e) =>
                setCustomerForm((p) => ({
                  ...p,
                  lastNameMaternal: e.target.value,
                }))
              }
              required
            />
          </Field>

          <div className="md:col-span-2 xl:col-span-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={() =>
                setCustomerForm({
                  documentNumber: '',
                  firstName: '',
                  lastNamePaternal: '',
                  lastNameMaternal: '',
                })
              }
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium"
            >
              Limpiar
            </button>

            <button
              type="submit"
              className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white"
            >
              Guardar cliente
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {customersData.length ? (
          customersData.map((customer) => (
            <div key={customer.id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{customer.name}</p>
                  <p className="mt-1 text-sm text-slate-500">DNI: {customer.documentNumber}</p>
                </div>

                <button
                  onClick={() => handleDeleteCustomer(customer)}
                  className="rounded-xl border border-rose-200 px-3 py-2 text-xs font-medium text-rose-600"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))
        ) : (
          <EmptyState
            title="Sin clientes registrados"
            text="Todavía no hay clientes registrados."
          />
        )}
      </div>
    </div>
  </div>
);

const getStartOfToday = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

const getStartOfWeek = () => {
  const now = new Date();
  const day = now.getDay(); // 0 domingo, 1 lunes...
  const diff = day === 0 ? 6 : day - 1; // semana desde lunes
  const monday = new Date(now);
  monday.setDate(now.getDate() - diff);
  return new Date(monday.getFullYear(), monday.getMonth(), monday.getDate());
};

const getStartOfMonth = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
};

const normalizeAmount = (value) => Number(value || 0);

const normalizeMethodLabel = (method) => {
  if (method === 'YAPE') return 'Yape';
  if (method === 'CASH') return 'Efectivo';
  if (method === 'CARD') return 'Tarjeta';
  return method || '-';
};

/* metricas  **/
const reportMetrics = useMemo(() => {
  const todayStart = getStartOfToday();
  const weekStart = getStartOfWeek();
  const monthStart = getStartOfMonth();

  const paidOrders = orderList.filter(
    (order) =>
      order.status === 'PAID' ||
      order.status === 'COMPLETED' ||
      Number(order.total || 0) > 0
  );

  const paymentsSource = paymentRows.map((payment) => ({
    ...payment,
    parsedAmount: normalizeAmount(payment.amount),
    parsedDate: new Date(payment.createdAt || payment.paidAt || Date.now()),
  }));

  const paymentsToday = paymentsSource.filter(
    (payment) => payment.parsedDate >= todayStart
  );

  const paymentsWeek = paymentsSource.filter(
    (payment) => payment.parsedDate >= weekStart
  );

  const paymentsMonth = paymentsSource.filter(
    (payment) => payment.parsedDate >= monthStart
  );

  const salesToday = paymentsToday.reduce(
    (sum, payment) => sum + payment.parsedAmount,
    0
  );

  const salesWeek = paymentsWeek.reduce(
    (sum, payment) => sum + payment.parsedAmount,
    0
  );

  const salesMonth = paymentsMonth.reduce(
    (sum, payment) => sum + payment.parsedAmount,
    0
  );

  const ordersToday = paidOrders.filter((order) => {
    const date = new Date(order.updatedAt || order.createdAt || Date.now());
    return date >= todayStart;
  });

  const ordersWeek = paidOrders.filter((order) => {
    const date = new Date(order.updatedAt || order.createdAt || Date.now());
    return date >= weekStart;
  });

  const ordersMonth = paidOrders.filter((order) => {
    const date = new Date(order.updatedAt || order.createdAt || Date.now());
    return date >= monthStart;
  });

  const ticketToday = ordersToday.length ? salesToday / ordersToday.length : 0;
  const ticketWeek = ordersWeek.length ? salesWeek / ordersWeek.length : 0;
  const ticketMonth = ordersMonth.length ? salesMonth / ordersMonth.length : 0;

  const paymentByMethodMap = paymentsSource.reduce((acc, payment) => {
    const key = normalizeMethodLabel(payment.method);
    acc[key] = (acc[key] || 0) + payment.parsedAmount;
    return acc;
  }, {});

  const paymentByMethod = Object.entries(paymentByMethodMap)
    .map(([method, total]) => ({
      method,
      total,
    }))
    .sort((a, b) => b.total - a.total);

  const productMap = {};

  orderList.forEach((order) => {
    const items = Array.isArray(order.items) ? order.items : [];

    items.forEach((item) => {
      const name =
        item.productNameSnapshot ||
        item.product?.name ||
        item.menuItem?.name ||
        item.inventoryItem?.name ||
        item.name ||
        'Producto';

      const qty = Number(item.qty || 0);
      const total = Number(item.total || item.subtotal || 0);

      if (!productMap[name]) {
        productMap[name] = {
          name,
          qty: 0,
          total: 0,
        };
      }

      productMap[name].qty += qty;
      productMap[name].total += total;
    });
  });

  const topProducts = Object.values(productMap)
    .sort((a, b) => {
      if (b.qty !== a.qty) return b.qty - a.qty;
      return b.total - a.total;
    })
    .slice(0, 10);

  return {
    salesToday,
    salesWeek,
    salesMonth,
    ordersToday: ordersToday.length,
    ordersWeek: ordersWeek.length,
    ordersMonth: ordersMonth.length,
    ticketToday,
    ticketWeek,
    ticketMonth,
    paymentByMethod,
    topProducts,
  };
}, [orderList, paymentRows]);

  const renderReports = () => (
  <div className="space-y-6">
    <div className="grid gap-4 md:grid-cols-3">
      <div className={panelCard}>
        <p className="text-sm text-slate-500">Ventas brutas del día</p>
        <h3 className="mt-2 text-3xl font-semibold">
          S/ {reportMetrics.salesToday.toFixed(2)}
        </h3>
      </div>

      <div className={panelCard}>
        <p className="text-sm text-slate-500">Ventas brutas de la semana</p>
        <h3 className="mt-2 text-3xl font-semibold">
          S/ {reportMetrics.salesWeek.toFixed(2)}
        </h3>
      </div>

      <div className={panelCard}>
        <p className="text-sm text-slate-500">Ventas brutas del mes</p>
        <h3 className="mt-2 text-3xl font-semibold">
          S/ {reportMetrics.salesMonth.toFixed(2)}
        </h3>
      </div>
    </div>

    <div className="grid gap-4 md:grid-cols-3">
      <div className={panelCard}>
        <p className="text-sm text-slate-500">Pedidos del día</p>
        <h3 className="mt-2 text-3xl font-semibold">{reportMetrics.ordersToday}</h3>
      </div>

      <div className={panelCard}>
        <p className="text-sm text-slate-500">Pedidos de la semana</p>
        <h3 className="mt-2 text-3xl font-semibold">{reportMetrics.ordersWeek}</h3>
      </div>

      <div className={panelCard}>
        <p className="text-sm text-slate-500">Pedidos del mes</p>
        <h3 className="mt-2 text-3xl font-semibold">{reportMetrics.ordersMonth}</h3>
      </div>
    </div>

    <div className="grid gap-4 md:grid-cols-3">
      <div className={panelCard}>
        <p className="text-sm text-slate-500">Ticket promedio del día</p>
        <h3 className="mt-2 text-3xl font-semibold">
          S/ {reportMetrics.ticketToday.toFixed(2)}
        </h3>
      </div>

      <div className={panelCard}>
        <p className="text-sm text-slate-500">Ticket promedio de la semana</p>
        <h3 className="mt-2 text-3xl font-semibold">
          S/ {reportMetrics.ticketWeek.toFixed(2)}
        </h3>
      </div>

      <div className={panelCard}>
        <p className="text-sm text-slate-500">Ticket promedio del mes</p>
        <h3 className="mt-2 text-3xl font-semibold">
          S/ {reportMetrics.ticketMonth.toFixed(2)}
        </h3>
      </div>
    </div>

    <div className="grid gap-6 xl:grid-cols-2">
      <div className={panelCard}>
        <div className="mb-4">
          <h3 className="text-xl font-semibold">Métodos de pago</h3>
          <p className="text-sm text-slate-500">
            Distribución acumulada de cobros registrados.
          </p>
        </div>

        {reportMetrics.paymentByMethod.length ? (
          <div className="space-y-3">
            {reportMetrics.paymentByMethod.map((item) => (
              <div
                key={item.method}
                className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3"
              >
                <span className="font-medium text-slate-700">{item.method}</span>
                <span className="font-semibold">
                  S/ {item.total.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Sin pagos"
            text="Todavía no hay pagos registrados para mostrar."
          />
        )}
      </div>

      <div className={panelCard}>
        <div className="mb-4">
          <h3 className="text-xl font-semibold">Productos más vendidos</h3>
          <p className="text-sm text-slate-500">
            Ranking por cantidad vendida e ingreso generado.
          </p>
        </div>

        {reportMetrics.topProducts.length ? (
          <div className="space-y-3">
            {reportMetrics.topProducts.map((product, index) => (
              <div
                key={`${product.name}-${index}`}
                className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3"
              >
                <div>
                  <p className="font-medium text-slate-700">{product.name}</p>
                  <p className="text-sm text-slate-500">
                    {product.qty} vendidos
                  </p>
                </div>
                <span className="font-semibold">
                  S/ {product.total.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Sin productos"
            text="Todavía no hay productos vendidos para mostrar."
          />
        )}
      </div>
    </div>
  </div>
);

  const renderSettings = () => (
  <div className="space-y-6">

    {/* CONFIGURACIÓN NEGOCIO */}
    <div className={panelCard}>
      <h3 className="text-xl font-bold mb-4">Datos del negocio</h3>

      <div className="grid gap-4 md:grid-cols-2">
        <input
  className={inputClass}
  placeholder="Nombre del negocio"
  value={businessConfig.businessName}
  onChange={(e) =>
    setBusinessConfig({ ...businessConfig, businessName: e.target.value })
  }
/>

        <input
          className={inputClass}
          placeholder="RUC"
          value={businessConfig.ruc}
          onChange={(e) => setBusinessConfig({...businessConfig, ruc: e.target.value})}
        />

        <input
          className={inputClass}
          placeholder="Dirección"
          value={businessConfig.address}
          onChange={(e) => setBusinessConfig({...businessConfig, address: e.target.value})}
        />

        <input
          className={inputClass}
          placeholder="Teléfono"
          value={businessConfig.phone}
          onChange={(e) => setBusinessConfig({...businessConfig, phone: e.target.value})}
        />
           
        <input
  className={inputClass}
  placeholder="URL del logo"
  value={businessConfig.logoUrl}
  onChange={(e) => setBusinessConfig({ ...businessConfig, logoUrl: e.target.value })}
/>

{businessConfig.logoUrl ? (
  <div className="mt-4">
    <p className="mb-2 text-sm text-slate-500">Vista previa del logo</p>
    <img
      src={businessConfig.logoUrl}
      alt="Logo del negocio"
      className="h-20 w-auto rounded-xl border border-slate-200 bg-white p-2"
    />
  </div>
) : null}

<div className="mt-3 flex flex-col gap-3">
  <input
    type="file"
    accept="image/png,image/jpeg,image/jpg,image/webp"
    onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600"
  />

  <button
    type="button"
    onClick={handleUploadBusinessLogo}
    className="w-fit rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium"
  >
    Subir logo desde PC
  </button>
</div>

      </div>

      <div className="mt-4">
  <button
    onClick={handleSaveBusinessConfig}
    className="bg-slate-900 text-white px-4 py-2 rounded-xl"
  >
    Guardar datos
  </button>
</div>
    </div>

    {/* USUARIOS */}
    <div className={panelCard}>
      <h3 className="text-xl font-bold mb-4">Usuarios del sistema</h3>

      <div className="grid gap-4 md:grid-cols-4 mb-4">
  <input
    className={inputClass}
    placeholder="Nombre"
    value={userForm.firstName}
    onChange={(e) => setUserForm({ ...userForm, firstName: e.target.value })}
  />

  <input
    className={inputClass}
    placeholder="Correo"
    value={userForm.email}
    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
  />

  <input
    type="password"
    className={inputClass}
    placeholder="Contraseña"
    value={userForm.password}
    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
  />

  <select
    className={inputClass}
    value={userForm.role}
    onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
  >
    {protectedRoles
      .filter((role) => !['SUPER_ADMIN'].includes(String(role.name || '').toUpperCase()))
      .map((role) => (
        <option key={role.id} value={String(role.name || '').toUpperCase()}>
          {role.name}
        </option>
      ))}
  </select>
</div>

<button
  type="button"
  onClick={handleCreateSystemUser}
  disabled={isSaving}
  className="bg-emerald-600 text-white px-4 py-2 rounded-xl mb-4 disabled:opacity-60"
>
  {isSaving ? 'Creando...' : 'Crear usuario'}
</button>

      <div className="space-y-2">
        {protectedUsers.map((user) => (
          <div
            key={user.id}
            className="flex justify-between items-center border p-3 rounded-xl"
          >
            <div>
             <div className="font-semibold">
  {[user.firstName, user.lastName].filter(Boolean).join(' ') || 'Sin nombre'}
</div>
<div className="text-sm text-slate-500">{user.email || 'Sin correo'}</div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs bg-slate-200 px-2 py-1 rounded">
                {user.role?.name || 'Sin rol'}
              </span>

              <button
  type="button"
  disabled
  className="text-slate-400 text-sm cursor-not-allowed"
>
  Eliminar
</button>
            </div>
          </div>
        ))}
      </div>
    </div>

  </div>
);


const getSafeActiveView = () => {
  if (isKitchenUser) return 'kitchen';
  return activeView;
};

const safeActiveView = getSafeActiveView();

const renderContent = () => {
  if (safeActiveView === 'dashboard') return renderDashboard();
  if (safeActiveView === 'pos') return renderPOS();
  if (safeActiveView === 'tables') return renderTables();
  if (safeActiveView === 'kitchen') return renderKitchen();
  if (safeActiveView === 'cashier') return renderCashier();
  if (safeActiveView === 'inventory') return renderInventory();
  if (safeActiveView === 'customers') return renderCustomers();
  if (safeActiveView === 'reports') return renderReports();
  if (safeActiveView === 'settings') return renderSettings();
  return renderDashboard();
};

  if (authUser?.isSuperAdmin) {
    return <SaaSPanel token={token} onLogout={handleLogout} />;
  }

  if (!token || !authUser) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#0f172a,_#020617)] p-6 text-white">
        <div className="mx-auto grid min-h-[90vh] max-w-6xl items-center gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            <div className="inline-flex rounded-2xl bg-white/10 px-3 py-1 text-xs font-semibold tracking-[0.24em] text-slate-300 uppercase">
              SmartMesa
            </div>
            <div>
              <h1 className="text-5xl font-bold leading-tight">Software de restaurante .</h1>
              <p className="mt-4 max-w-xl text-lg text-slate-300">
                sesión con tu usuario del sistema para cargar sucursales, productos, mesas, pedidos y usuarios
                directamente desde tu API en locInicia alhost.
              </p>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white p-8 text-slate-900 shadow-2xl">
            <div className="mb-6">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Iniciar sesión</p>
              <h2 className="mt-2 text-3xl font-bold">Accede al panel</h2>
            </div>
<form className="space-y-4" onSubmit={handleLogin}>
  {/* Bloque del Correo electrónico */}
  <div>
    <span className="text-sm font-medium text-slate-300 block mb-1">
      Correo electrónico
    </span>
    <input
      type="email"
      placeholder="ejemplo@restaurante.com"
      value={loginForm.email}
      onChange={(e) => setLoginForm((prev) => ({ ...prev, email: e.target.value }))}
      className={inputClass}
    />
  </div>

  {/* Bloque de la Contraseña */}
  <div>
    <span className="text-sm font-medium text-slate-300 block mb-1">
      Contraseña
    </span>
    <div className="relative">
      <input
        type={showLoginPassword ? 'text' : 'password'}
        placeholder="••••••••••••"
        value={loginForm.password}
        onChange={(e) => setLoginForm((prev) => ({ ...prev, password: e.target.value }))}
        className={`${inputClass} pr-20`}
      />
      <button
        type="button"
        onClick={() => setShowLoginPassword((prev) => !prev)}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500 hover:text-slate-700"
      >
        {showLoginPassword ? 'Ocultar' : 'Ver'}
      </button>
    </div>
  </div>

              {loginError ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {loginError}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                {isLoggingIn ? 'Ingresando...' : 'Entrar al sistema'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#f8fafc,_#e2e8f0)] text-slate-900">
      <div className="flex min-h-screen">
<aside 
          className={`hidden shrink-0 border-r border-white/50 bg-slate-950 text-white lg:flex lg:flex-col transition-all duration-300 ease-in-out ${
            isSidebarCollapsed ? 'w-20' : 'w-72'
          }`}
        >
          {/* Cabecera del Sidebar */}
          <div className={`border-b border-slate-800 p-6 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
            {!isSidebarCollapsed && (
              <div className="overflow-hidden">
                <div className="inline-flex rounded-2xl bg-white/10 px-3 py-1 text-xs font-semibold tracking-[0.24em] text-slate-300 uppercase">
                  SmartMesa
                </div>
                <h1 className="mt-4 text-3xl font-bold">SmartMesa</h1>
              </div>
            )}
            
            {/* Botón de las 3 rayitas (Hamburguesa) */}
            <button 
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition text-slate-300 hover:text-white"
              title={isSidebarCollapsed ? "Expandir menú" : "Contraer menú"}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </button>
          </div>

          {/* Navegación */}
          <nav className="flex-1 p-4 overflow-y-auto overflow-x-hidden">
            <div className="space-y-2">
              {nav.map((item) => (
                <button
                  key={item.key}
                  onClick={() => setActiveView(item.key)}
                  title={isSidebarCollapsed ? item.label : ""}
                  className={`w-full flex items-center rounded-2xl py-3 text-sm font-medium transition-all ${
                    activeView === item.key 
                      ? 'bg-white text-slate-950 shadow-sm' 
                      : 'text-slate-300 hover:bg-slate-900'
                  } ${isSidebarCollapsed ? 'justify-center px-0' : 'px-4 justify-start'}`}
                >
                  {/* Ícono Sólido del menú */}
<div className={`flex items-center justify-center shrink-0 ${isSidebarCollapsed ? '' : 'mr-3'} w-7 h-7 rounded-md ${
  activeView === item.key ? 'bg-slate-200 text-slate-900' : 'bg-white/10 text-white'
}`}>
  {item.icon}
</div>
                  
                  {/* Texto (solo si está expandido) */}
                  {!isSidebarCollapsed && (
                    <span className="truncate">{item.label}</span>
                  )}
                </button>
              ))}
            </div>
          </nav>

          {/* Pie del Sidebar (Usuario y Sesión) */}
          <div className="border-t border-slate-800 p-4">
            {isSidebarCollapsed ? (
              <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center font-bold text-lg shadow-lg border border-white/10">
                  {authUser.firstName.charAt(0)}
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-400/10 rounded-lg transition"
                  title="Cerrar sesión"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                  </svg>
                </button>
              </div>
            ) : (
              <div className="rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 p-4 shadow-lg overflow-hidden">
                <p className="text-sm font-semibold truncate">Sesión activa</p>
                <p className="mt-1 text-xs text-slate-400 truncate">
                  {authUser.firstName} {authUser.lastName} · {authUser.role?.name}
                </p>

                <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-2xl bg-white/5 p-3 overflow-hidden">
                    <p className="text-slate-400 truncate">Sucursal</p>
                    <p className="mt-1 font-semibold truncate">{authUser.branch?.code || 'PRINCIPAL'}</p>
                  </div>
                  <div className="rounded-2xl bg-white/5 p-3 overflow-hidden">
                    <p className="text-slate-400 truncate">Usuarios</p>
                    <p className="mt-1 font-semibold truncate">{protectedUsers.length}</p>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="mt-4 w-full rounded-2xl border border-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/5 flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </aside>

        <main className="flex-1">
          <header className="border-b border-white/60 bg-white/70 px-5 py-4 backdrop-blur lg:px-8">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-bold">Software de Restaurante</h2>
                <p className="text-sm text-slate-500">{sectionTitle[activeView]}</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <input
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none"
                  placeholder="Buscar pedido, cliente o mesa"
                />
                <button
                  onClick={handleCreateOrder}
                  disabled={isSaving}
                  className="rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white shadow-sm disabled:opacity-60"
                >
                  Nuevo pedido
                </button>
                <button className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium">
                  Imprimir comanda
                </button>
              </div>
            </div>
          </header>

          <div className="space-y-6 p-5 lg:p-8">
            {connectionError ? (
              <div className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
                {connectionError}
              </div>
            ) : null}

            {actionMessage ? (
              <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">
                {actionMessage}
              </div>
            ) : null}

            {isLoadingData ? (
              <div className="rounded-3xl border border-sky-200 bg-sky-50 px-5 py-4 text-sm text-sky-700">
                Cargando datos del backend...
              </div>
            ) : null}

            {renderContent()}
          </div>
        </main>


        
      </div>
    </div>
  );
}