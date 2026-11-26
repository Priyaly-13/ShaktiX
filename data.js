/**
 * REPLATE — Client Store, Backend API Client, Theme Manager & Food Safety Helpers
 */

window.ReplateStore = (() => {
  const TOKEN_KEY = 'replate_auth_token_v2';
  const THEME_KEY = 'replate_theme_v2';

  const INDIAN_DISHES = [
    'Kadhi Chawal',
    'Rajma Chawal',
    'Chole Bhature',
    'Dal Rice',
    'Veg Biryani',
    'Samosa',
    'Poha',
    'Idli',
    'Gulab Jamun',
    'Jalebi'
  ];

  function getSavedTheme() {
    try {
      const t = localStorage.getItem(THEME_KEY);
      return t === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  }

  function applyTheme(theme) {
    const clean = theme === 'dark' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', clean);
    try {
      localStorage.setItem(THEME_KEY, clean);
    } catch {}
    state.theme = clean;
  }

  function getSavedToken() {
    try {
      return localStorage.getItem(TOKEN_KEY) || '';
    } catch {
      return '';
    }
  }

  function saveToken(token) {
    state.token = token || '';
    try {
      if (token) localStorage.setItem(TOKEN_KEY, token);
      else localStorage.removeItem(TOKEN_KEY);
    } catch {}
  }

  const configuredApiBase = (() => {
    try {
      if (typeof window.REPLATE_API_BASE === 'string' && window.REPLATE_API_BASE.trim()) {
        return window.REPLATE_API_BASE.trim().replace(/\/+$/, '');
      }
      const meta = document.querySelector('meta[name="replate-api-base"]');
      if (meta && meta.content && meta.content.trim()) {
        return meta.content.trim().replace(/\/+$/, '');
      }
      const saved = localStorage.getItem('replate_api_base');
      if (saved && saved.trim()) {
        return saved.trim().replace(/\/+$/, '');
      }
    } catch {}
    if (
      window.location.protocol === 'file:' ||
      ['5500', '5501', '5502'].includes(window.location.port)
    ) {
      return 'http://localhost:5050';
    }
    return '';
  })();

  const API_BASE = configuredApiBase;

  function resolveAssetPath(assetPath) {
    if (!assetPath) return 'images/fallback-food.jpg';
    const raw = String(assetPath).trim();
    if (/^(https?:|data:|blob:)/i.test(raw)) return raw;
    const clean = raw.replace(/^\/+/, '');
    if (clean.startsWith('uploads/') && API_BASE) {
      return `${API_BASE}/${clean}`;
    }
    return clean;
  }

  function getFoodImage(foodName, customPhotoUrl) {
    if (customPhotoUrl) return resolveAssetPath(customPhotoUrl);
    const n = String(foodName || '').toLowerCase();
    if (n.includes('kadhi')) return 'images/kadhi-chawal.jpg';
    if (n.includes('rajma')) return 'images/rajma-chawal.svg';
    if (n.includes('chole') || n.includes('bhature') || n.includes('chana')) return 'images/chole-bhature.svg';
    if (n.includes('dal') || n.includes('daal') || n.includes('khichdi') || n.includes('tadka')) return 'images/dal-rice.jpg';
    if (n.includes('biryani') || n.includes('pulao')) return 'images/veg-biryani.jpg';
    if (n.includes('samosa') || n.includes('kachori') || n.includes('pakora')) return 'images/samosa.svg';
    if (n.includes('poha') || n.includes('upma')) return 'images/poha.svg';
    if (n.includes('idli') || n.includes('dosa') || n.includes('vada') || n.includes('sambar')) return 'images/idli.jpg';
    if (n.includes('gulab') || n.includes('jamun') || n.includes('laddu') || n.includes('halwa')) return 'images/gulab-jamun.jpg';
    if (n.includes('jalebi') || n.includes('imarti')) return 'images/jalebi.svg';
    return 'images/fallback-food.jpg';
  }

  function getFallbackFoodSvgDataUrl(foodName = 'Fresh Meal') {
    const label = String(foodName || 'Fresh Meal')
      .replace(/[<>&"']/g, '')
      .slice(0, 26);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="320" viewBox="0 0 480 320"><rect width="480" height="320" fill="#FAF7F0"/><circle cx="385" cy="70" r="64" fill="#DCE8D5" opacity="0.75"/><circle cx="95" cy="255" r="56" fill="#F5DDE2" opacity="0.75"/><ellipse cx="240" cy="222" rx="116" ry="20" fill="#E8D8C5" opacity="0.65"/><path d="M142 152H338C333 192 296 218 240 218C184 218 147 192 142 152Z" fill="#FFFFFF" stroke="#45483B" stroke-width="3"/><path d="M168 152C176 122 204 106 240 106C276 106 304 122 312 152" fill="#DCE8D5" stroke="#7B8154" stroke-width="3"/><path d="M206 88C206 78 214 72 214 62" stroke="#C78F9B" stroke-width="3" stroke-linecap="round"/><path d="M240 84C240 74 248 68 248 58" stroke="#7B8154" stroke-width="3" stroke-linecap="round"/><path d="M274 88C274 78 282 72 282 62" stroke="#C78F9B" stroke-width="3" stroke-linecap="round"/><text x="240" y="274" text-anchor="middle" font-family="Georgia, serif" font-size="22" fill="#45483B">${label}</text></svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }

  const state = {
    theme: getSavedTheme(),
    token: getSavedToken(),
    activeView: 'landing', // 'landing' | 'login' | 'register' | 'dashboard' | 'donations' | 'matches' | 'pickups' | 'impact' | 'notifications' | 'settings' | 'admin'
    authMode: 'login',
    impactPeriod: 'month',
    donationFilter: 'All',
    donationStatusFilter: 'All',
    notifFilter: 'All',
    searchQuery: '',
    user: null,
    donations: [],
    matches: [],
    pickups: [],
    notifications: [],
    safetyLogs: [],
    users: [],
    impactData: {
      week: { meals: 468, kg: 184, co2: 460, ngos: 9, series: [] },
      month: { meals: 1842, kg: 736, co2: 412, ngos: 16, series: [] },
      year: { meals: 14280, kg: 3240, co2: 7840, ngos: 28, series: [] }
    }
  };

  applyTheme(state.theme);

  async function api(path, options = {}) {
    const headers = { ...(options.headers || {}) };
    if (options.body && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }
    if (state.token) {
      headers['Authorization'] = `Bearer ${state.token}`;
    }

    const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
    let res;
    try {
      res = await fetch(url, {
        ...options,
        headers
      });
    } catch {
      const err = new Error('Cannot reach the REPLATE backend server. Start server.ps1 and open http://localhost:5050.');
      err.status = 0;
      throw err;
    }

    const data = await res.json().catch(() => ({
      ok: false,
      error: 'Server returned invalid response. Make sure server.ps1 is running (http://localhost:5050) instead of a static server alone.'
    }));
    if (!res.ok) {
      const err = new Error(data.error || 'Request failed');
      err.status = res.status;
      err.payload = data;
      throw err;
    }
    return data;
  }

  async function loadPublicSummary() {
    try {
      const data = await api('/api/public/summary');
      if (data.featuredDonations) state.donations = data.featuredDonations;
      if (data.impactData) state.impactData = data.impactData;
    } catch {}
  }

  async function syncWorkspace() {
    if (!state.token) return false;
    try {
      const data = await api('/api/state');
      state.user = data.user;
      state.donations = data.donations || [];
      state.matches = data.matches || [];
      state.pickups = data.pickups || [];
      state.notifications = data.notifications || [];
      state.impactData = data.impactData || state.impactData;
      state.safetyLogs = data.safetyLogs || [];
      state.users = data.users || [];
      return true;
    } catch {
      saveToken('');
      state.user = null;
      return false;
    }
  }

  async function login(loginId, password) {
    const data = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ loginId, password })
    });
    saveToken(data.token);
    state.user = data.user;
    await syncWorkspace();
    return data.user;
  }

  async function register(payload) {
    const data = await api('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    saveToken(data.token);
    state.user = data.user;
    await syncWorkspace();
    return data.user;
  }

  async function logout() {
    try {
      await api('/api/auth/logout', { method: 'POST' });
    } catch {}
    saveToken('');
    state.user = null;
    state.donations = [];
    state.matches = [];
    state.pickups = [];
    state.notifications = [];
    state.safetyLogs = [];
    state.users = [];
    await loadPublicSummary();
  }

  async function createDonation(payload) {
    const data = await api('/api/donations', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    await syncWorkspace();
    return data;
  }

  async function deleteDonation(id) {
    await api(`/api/donations/${encodeURIComponent(id)}`, { method: 'DELETE' });
    await syncWorkspace();
  }

  async function respondToMatch(id, action) {
    await api(`/api/matches/${encodeURIComponent(id)}/${action}`, { method: 'POST' });
    await syncWorkspace();
  }

  async function updatePickupStatus(id, status) {
    await api(`/api/pickups/${encodeURIComponent(id)}/status`, {
      method: 'POST',
      body: JSON.stringify({ status })
    });
    await syncWorkspace();
  }

  async function markNotificationRead(id = '') {
    await api('/api/notifications/read', {
      method: 'POST',
      body: JSON.stringify({ id })
    });
    await syncWorkspace();
  }

  async function saveSettings(payload) {
    const data = await api('/api/settings', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    state.user = data.user;
    await syncWorkspace();
  }

  function getState() {
    return state;
  }

  function setField(fn) {
    fn(state);
  }

  return {
    INDIAN_DISHES,
    getState,
    setField,
    applyTheme,
    getFoodImage,
    getFallbackFoodSvgDataUrl,
    loadPublicSummary,
    syncWorkspace,
    login,
    register,
    logout,
    createDonation,
    deleteDonation,
    respondToMatch,
    updatePickupStatus,
    markNotificationRead,
    saveSettings
  };
})();
