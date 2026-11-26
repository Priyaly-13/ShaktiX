/**
 * REPLATE — Main Application Controller, Role Dashboards & Auth Flows
 */

(() => {
  const { icons, botanicalSprig, organicHeroBlob } = window.ReplateVisuals;
  const Store = window.ReplateStore;

  const root = document.getElementById('app-root');
  const modalRoot = document.getElementById('modal-root');
  const toastRoot = document.getElementById('toast-root');

  let mobileSidebarOpen = false;
  let showLoginPassword = false;
  let showRegisterPassword = false;
  let donatePhotoDataUrl = '';
  let donatePhotoName = '';
  let donateSafetyError = '';
  let authError = '';

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatLocalDatetimeInput(dateObj) {
    const pad = (n) => String(n).padStart(2, '0');
    return `${dateObj.getFullYear()}-${pad(dateObj.getMonth() + 1)}-${pad(dateObj.getDate())}T${pad(dateObj.getHours())}:${pad(dateObj.getMinutes())}`;
  }

  function showToast(message, isError = false) {
    const el = document.createElement('div');
    el.className = 'toast';
    if (isError) el.style.borderLeftColor = 'var(--error-text)';
    el.innerHTML = `<span style="color:${isError ? 'var(--error-text)' : 'var(--olive)'}; display:flex;">${isError ? icons.shield : icons.check}</span><span>${escapeHtml(message)}</span>`;
    toastRoot.appendChild(el);
    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(6px)';
      el.style.transition = 'opacity 0.2s, transform 0.2s';
      setTimeout(() => el.remove(), 220);
    }, 3200);
  }

  function renderThemeToggle(state) {
    const isDark = state.theme === 'dark';
    return `
      <button type="button" class="theme-toggle-btn" data-action="toggle-theme" aria-label="Switch color theme">
        ${isDark ? icons.sun : icons.moon}
        <span>${isDark ? 'Light Mode' : 'Dark Mode'}</span>
      </button>
    `;
  }

  function getNavItemsForRole(role) {
    const base = [
      { id: 'dashboard', label: 'Dashboard', icon: icons.dashboard },
      { id: 'donations', label: 'Donations', icon: icons.donations },
      { id: 'matches', label: 'NGO Matches', icon: icons.matches },
      { id: 'pickups', label: 'Pickups', icon: icons.pickups },
      { id: 'impact', label: 'Impact', icon: icons.impact },
      { id: 'notifications', label: 'Notifications', icon: icons.notifications },
      { id: 'settings', label: 'Settings', icon: icons.settings }
    ];
    if (role === 'admin') {
      base.splice(1, 0, { id: 'admin', label: 'Admin Control', icon: icons.shield });
    }
    return base;
  }

  function getViewMeta(state) {
    const name = state.user ? state.user.name : 'ShaktiX';
    const role = state.user ? state.user.role : 'donor';
    const roleDashSub = {
      donor: 'Share extra food and track NGO pickups easily.',
      ngo: 'View matched meals and confirm food pickups for your kitchen.',
      volunteer: 'See your assigned food pickups and update delivery status.',
      admin: 'Manage donors, NGOs, volunteers, and food safety checks.'
    };

    const meta = {
      dashboard: {
        title: `Hello, ${name}`,
        subtitle: roleDashSub[role] || roleDashSub.donor
      },
      admin: {
        title: 'Admin Control Panel',
        subtitle: 'All users, food safety logs, donations, and pickups in one place.'
      },
      donations: {
        title: 'Food Donations',
        subtitle: 'Fresh Indian dishes and custom food donations ready to share.'
      },
      matches: {
        title: 'NGO Matches',
        subtitle: 'Simple matches based on distance, meal count, and pickup time.'
      },
      pickups: {
        title: 'Upcoming Pickups',
        subtitle: 'Track volunteer pickups from Scheduled to Completed.'
      },
      impact: {
        title: 'Our Impact',
        subtitle: 'See how many meals were shared and how much food was saved.'
      },
      notifications: {
        title: 'Notifications',
        subtitle: 'Updates on NGO matches, pickups, and food safety checks.'
      },
      settings: {
        title: 'Account Settings',
        subtitle: 'Update your profile, address, and alert settings.'
      }
    };
    return meta[state.activeView] || meta.dashboard;
  }

  function navigateTo(viewId) {
    const state = Store.getState();
    const publicViews = ['landing', 'login', 'register'];
    if (!publicViews.includes(viewId) && !state.user) {
      Store.setField((s) => {
        s.activeView = 'login';
      });
      history.replaceState(null, '', '#login');
      render();
      return;
    }

    if (viewId === 'admin' && state.user && state.user.role !== 'admin') {
      showToast('Only Admin accounts can open Admin Control.', true);
      viewId = 'dashboard';
    }

    Store.setField((s) => {
      s.activeView = viewId;
    });
    mobileSidebarOpen = false;
    if (window.location.hash !== `#${viewId}`) {
      history.replaceState(null, '', `#${viewId}`);
    }
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function syncFromHash() {
    const hash = window.location.hash.replace('#', '').trim();
    const valid = ['landing', 'login', 'register', 'dashboard', 'admin', 'donations', 'matches', 'pickups', 'impact', 'notifications', 'settings'];
    if (valid.includes(hash)) {
      Store.setField((s) => {
        s.activeView = hash;
      });
    }
  }

  function getStatusBadgeClass(status) {
    if (status === 'Matched' || status === 'Accepted' || status === 'Completed' || status === 'Approved') return 'badge-olive';
    if (status === 'On the Way' || status === 'Pending' || status === 'Available') return 'badge-blush';
    if (status === 'Cancelled' || status === 'Rejected' || status === 'Expired') return 'badge-error';
    return 'badge-beige';
  }

  /* ========================================================================
     LANDING PAGE (Simple English + Matching Indian Food Photos + Dark Mode)
     ======================================================================== */
  function renderLandingPage(state) {
    const totalMeals = (state.impactData.year && state.impactData.year.meals ? state.impactData.year.meals : 14280).toLocaleString();
    const featuredDonations = (state.donations || []).slice(0, 3);
    const isLoggedIn = Boolean(state.user);

    return `
      <div class="landing-wrapper">
        <header class="landing-nav">
          <div class="landing-nav-inner">
            <div class="brand-lockup" data-action="go" data-view="landing">
              <div class="brand-mark">${icons.logoLeaf}</div>
              <div>
                <div class="brand-title">REPLATE</div>
                <div class="brand-sub">Share Extra Food</div>
              </div>
            </div>

            <nav class="landing-links" aria-label="Main Links">
              <a href="#how-it-works">How It Works</a>
              <a href="#food-today">Food Today</a>
              <a href="#our-impact">Impact</a>
            </nav>

            <div class="landing-actions">
              ${renderThemeToggle(state)}
              ${
                isLoggedIn
                  ? `<button class="btn btn-primary btn-pill" data-action="go" data-view="dashboard">
                      Open Dashboard ${icons.arrowRight}
                    </button>`
                  : `<button class="btn btn-secondary btn-pill" data-action="go" data-view="register">
                      Register
                    </button>
                    <button class="btn btn-primary btn-pill" data-action="go" data-view="login">
                      Login ${icons.arrowRight}
                    </button>`
              }
            </div>
          </div>
        </header>

        <!-- Hero Section -->
        <section class="hero-section">
          <div>
            <div class="hero-eyebrow">
              <span class="hero-eyebrow-dot"></span>
              Share Fresh Extra Food With Local Shelters
            </div>
            <h1 class="hero-title">
              Turn extra <em>home-cooked</em> meals into dinner for someone nearby.
            </h1>
            <p class="hero-subtitle">
              REPLATE helps kitchens, restaurants, and families donate extra Indian meals like Kadhi Chawal, Rajma Chawal, and Poha to trusted nearby NGOs with easy volunteer pickups.
            </p>
            <div class="hero-cta-row">
              <button class="btn btn-primary btn-lg btn-pill" data-action="go" data-view="${isLoggedIn ? 'dashboard' : 'login'}">
                ${isLoggedIn ? 'Go to Dashboard' : 'Login to Donate'} ${icons.arrowRight}
              </button>
              <button class="btn btn-secondary btn-lg btn-pill" data-action="go" data-view="${isLoggedIn ? 'donations' : 'register'}">
                ${isLoggedIn ? 'See Available Food' : 'Create Free Account'}
              </button>
            </div>

            <div class="hero-trust-strip">
              <div>
                <div class="hero-stat-value">${totalMeals}+</div>
                <div class="hero-stat-label">Meals shared this year</div>
              </div>
              <div>
                <div class="hero-stat-value">96%</div>
                <div class="hero-stat-label">Matched in under 18 mins</div>
              </div>
              <div>
                <div class="hero-stat-value">28</div>
                <div class="hero-stat-label">Trusted local NGOs</div>
              </div>
            </div>
          </div>

          <div class="hero-collage">
            ${organicHeroBlob}
            <div class="collage-col">
              <div class="pin-card">
                <div class="food-photo-frame compact" style="margin-bottom:12px;">
                  <img class="food-photo-img" src="${Store.getFoodImage('Kadhi Chawal')}" alt="Kadhi Chawal" />
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                  <span class="badge badge-olive">Matched</span>
                  <span style="font-size:0.78rem; color:var(--charcoal-muted);">5:30 PM Pickup</span>
                </div>
                <h3 style="font-size:1.15rem; margin-bottom:4px;">Kadhi Chawal</h3>
                <p style="font-size:0.84rem; color:var(--charcoal-muted);">45 meals · Willowbrook Kitchen</p>
              </div>

              <div class="pin-card pin-card-blush">
                <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:8px;">
                  <span style="font-size:0.76rem; text-transform:uppercase; letter-spacing:0.1em; font-weight:600;">Food Saved This Month</span>
                  ${icons.sparkles}
                </div>
                <div style="font-family:var(--font-serif); font-size:2.1rem; line-height:1.05; margin-bottom:6px;">1,842 Meals</div>
                <p style="font-size:0.84rem; color:var(--charcoal-muted);">Fresh food shared safely across 16 local shelters.</p>
              </div>
            </div>

            <div class="collage-col collage-col-offset">
              <div class="pin-card pin-card-sage">
                <div style="margin-bottom:8px;">${botanicalSprig(105)}</div>
                <span class="badge" style="background:var(--white); color:var(--olive); margin-bottom:10px;">Best NGO Match</span>
                <h3 style="font-size:1.18rem; margin-bottom:6px;">Saffron Table Shelter</h3>
                <p style="font-size:0.85rem; color:var(--charcoal-muted); margin-bottom:12px;">1.4 km away · Ready for 55 meals of Rajma Chawal.</p>
                <button class="btn btn-primary btn-sm btn-pill" data-action="go" data-view="${isLoggedIn ? 'matches' : 'login'}">See Match</button>
              </div>

              <div class="pin-card">
                <div class="food-photo-frame compact" style="margin-bottom:12px;">
                  <img class="food-photo-img" src="${Store.getFoodImage('Veg Biryani')}" alt="Veg Biryani" />
                </div>
                <span class="badge badge-blush" style="margin-bottom:6px;">Fresh &amp; Safe</span>
                <h3 style="font-size:1.12rem; margin-bottom:4px;">Veg Biryani</h3>
                <p style="font-size:0.84rem; color:var(--charcoal-muted);">20 kg · 60 people served</p>
              </div>
            </div>
          </div>
        </section>

        <!-- How It Works -->
        <section id="how-it-works" class="landing-section">
          <div class="section-header-center">
            <span class="section-kicker">Simple 3-Step Flow</span>
            <h2 class="section-title">How REPLATE works</h2>
            <p class="section-desc">
              Easy steps for donors, NGOs, and volunteers to share food safely.
            </p>
          </div>

          <div class="steps-grid-3">
            <div class="card card-ivory card-interactive">
              <div class="step-number-pill">1</div>
              <h3 style="font-size:1.3rem; margin-bottom:8px;">Add Extra Food</h3>
              <p style="font-size:0.92rem; color:var(--charcoal-muted); margin-bottom:14px;">
                Type any food name, upload a photo, and add the prepared time and best-before time.
              </p>
              <span class="badge badge-beige">Automatic Safety Check</span>
            </div>

            <div class="card card-blush card-interactive">
              <div class="step-number-pill">2</div>
              <h3 style="font-size:1.3rem; margin-bottom:8px;">Match With an NGO</h3>
              <p style="font-size:0.92rem; color:var(--charcoal-muted); margin-bottom:14px;">
                We find nearby shelters that need your food and let you accept the match in one click.
              </p>
              <span class="badge" style="background:var(--white); color:var(--charcoal);">Fast Local Matching</span>
            </div>

            <div class="card card-sage card-interactive">
              <div class="step-number-pill">3</div>
              <h3 style="font-size:1.3rem; margin-bottom:8px;">Volunteer Pickup</h3>
              <p style="font-size:0.92rem; color:var(--charcoal-muted); margin-bottom:14px;">
                A volunteer picks up the food with a simple pickup code and delivers it safely.
              </p>
              <span class="badge" style="background:var(--white); color:var(--olive);">Live Status Tracking</span>
            </div>
          </div>
        </section>

        <!-- Food Today Masonry -->
        <section id="food-today" class="landing-section" style="padding-top:24px;">
          <div class="section-header-center">
            <span class="section-kicker">Available Food Today</span>
            <h2 class="section-title">Fresh Indian dishes ready to share</h2>
            <p class="section-desc">
              See real meals being shared across neighborhoods right now.
            </p>
          </div>

          <div class="masonry-showcase">
            ${featuredDonations
              .map(
                (item) => `
              <div class="masonry-item card card-interactive">
                <div class="food-photo-frame" style="margin-bottom:14px;">
                  <img class="food-photo-img" src="${escapeHtml(Store.getFoodImage(item.title, item.imageUrl))}" alt="${escapeHtml(item.title)}" onerror="this.src='/images/fallback-food.jpg'" />
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                  <span class="badge ${getStatusBadgeClass(item.status)}">${escapeHtml(item.status)}</span>
                  <span style="font-size:0.8rem; color:var(--charcoal-muted);">${item.servings} meals</span>
                </div>
                <h3 style="font-size:1.22rem; margin-bottom:6px;">${escapeHtml(item.title)}</h3>
                <p style="font-size:0.88rem; color:var(--charcoal-muted); margin-bottom:14px;">${escapeHtml(item.notes)}</p>
                <button class="btn btn-outline btn-sm" style="width:100%;" data-action="go" data-view="${isLoggedIn ? 'donations' : 'login'}">
                  View Food Details
                </button>
              </div>`
              )
              .join('')}
          </div>
        </section>

        <!-- CTA Banner -->
        <section id="our-impact" class="landing-section" style="padding-top:20px;">
          <div class="landing-cta-banner">
            <div style="max-width:600px;">
              <div style="margin-bottom:10px;">${botanicalSprig(105)}</div>
              <h2 style="font-size:clamp(1.75rem, 2.8vw, 2.35rem); margin-bottom:10px;">
                Join REPLATE as a Donor, NGO, or Volunteer
              </h2>
              <p style="color:var(--charcoal-muted); font-size:0.98rem;">
                Log in with your Login ID and password to donate food, accept NGO matches, or deliver meals nearby.
              </p>
            </div>
            <div style="display:flex; gap:12px; flex-wrap:wrap;">
              <button class="btn btn-primary btn-lg btn-pill" data-action="go" data-view="${isLoggedIn ? 'dashboard' : 'login'}">
                ${isLoggedIn ? 'Open Dashboard' : 'Login Now'} ${icons.arrowRight}
              </button>
              ${
                !isLoggedIn
                  ? `<button class="btn btn-secondary btn-lg btn-pill" data-action="go" data-view="register">Create Account</button>`
                  : ''
              }
            </div>
          </div>
        </section>

        <footer class="landing-footer">
          <div style="display:flex; align-items:center; gap:10px;">
            <span style="color:var(--olive); display:flex;">${icons.logoLeaf}</span>
            <span><strong>REPLATE</strong> · Simple food sharing for everyone</span>
          </div>
          <div style="display:flex; gap:14px; flex-wrap:wrap;">
            <button class="btn btn-ghost btn-sm" data-action="go" data-view="login">Login</button>
            <button class="btn btn-ghost btn-sm" data-action="go" data-view="register">Register</button>
          </div>
        </footer>
      </div>
    `;
  }

  /* ========================================================================
     LOGIN & REGISTRATION PAGE (Login ID, Password, Show/Hide, Role Redirect)
     ======================================================================== */
  function renderAuthPage(state, mode = 'login') {
    const isRegister = mode === 'register';

    return `
      <div class="auth-shell">
        <header class="landing-nav">
          <div class="landing-nav-inner">
            <div class="brand-lockup" data-action="go" data-view="landing">
              <div class="brand-mark">${icons.logoLeaf}</div>
              <div>
                <div class="brand-title">REPLATE</div>
                <div class="brand-sub">Share Extra Food</div>
              </div>
            </div>
            <div class="landing-actions">
              ${renderThemeToggle(state)}
              <button class="btn btn-outline btn-sm btn-pill" data-action="go" data-view="landing">
                ${icons.home} Home
              </button>
            </div>
          </div>
        </header>

        <div class="auth-center">
          <div class="card card-sage" style="padding:30px;">
            <div style="margin-bottom:12px;">${botanicalSprig(108)}</div>
            <span class="badge" style="background:var(--white); color:var(--olive); margin-bottom:12px;">Safe &amp; Role-Based Access</span>
            <h1 style="font-size:2.1rem; line-height:1.12; margin-bottom:12px;">
              ${isRegister ? 'Create your REPLATE account' : 'Welcome back to REPLATE'}
            </h1>
            <p style="font-size:0.94rem; color:var(--charcoal-muted); margin-bottom:18px;">
              ${
                isRegister
                  ? 'Sign up as a Food Donor, NGO Shelter, or Volunteer Driver. Admin accounts are managed privately for security.'
                  : 'Sign in with your Login ID and password. Each account opens the right dashboard for your role.'
              }
            </p>

            <div class="card" style="padding:16px; border-radius:16px;">
              <div style="font-weight:600; font-size:0.88rem; margin-bottom:6px;">Quick Test Accounts (Click to Fill)</div>
              <div class="demo-creds-grid">
                <button type="button" class="demo-cred-btn" data-action="fill-demo-login" data-id="shaktix" data-pass="donor123">
                  <div style="font-weight:600; font-size:0.84rem;">Donor · ShaktiX</div>
                  <div style="font-size:0.76rem; color:var(--charcoal-muted);">ID: shaktix / donor123</div>
                </button>
                <button type="button" class="demo-cred-btn" data-action="fill-demo-login" data-id="saffron" data-pass="ngo123">
                  <div style="font-weight:600; font-size:0.84rem;">NGO · Saffron Table</div>
                  <div style="font-size:0.76rem; color:var(--charcoal-muted);">ID: saffron / ngo123</div>
                </button>
                <button type="button" class="demo-cred-btn" data-action="fill-demo-login" data-id="maya" data-pass="volunteer123">
                  <div style="font-weight:600; font-size:0.84rem;">Volunteer · Maya</div>
                  <div style="font-size:0.76rem; color:var(--charcoal-muted);">ID: maya / volunteer123</div>
                </button>
                <button type="button" class="demo-cred-btn" data-action="fill-demo-login" data-id="admin" data-pass="admin123">
                  <div style="font-weight:600; font-size:0.84rem;">Admin · Operations</div>
                  <div style="font-size:0.76rem; color:var(--charcoal-muted);">ID: admin / admin123</div>
                </button>
              </div>
            </div>
          </div>

          <div class="card" style="padding:30px;">
            <div class="chip-group" style="margin-bottom:20px;">
              <button type="button" class="filter-chip ${!isRegister ? 'active' : ''}" data-action="go" data-view="login">Login</button>
              <button type="button" class="filter-chip ${isRegister ? 'active' : ''}" data-action="go" data-view="register">Register</button>
            </div>

            ${
              authError
                ? `<div class="safety-alert error">${icons.shield}<span>${escapeHtml(authError)}</span></div>`
                : ''
            }

            ${
              !isRegister
                ? `
              <form id="login-form" style="display:flex; flex-direction:column; gap:14px;">
                <div class="field-group">
                  <label class="field-label" for="login-id">Login ID</label>
                  <input id="login-id" name="loginId" class="input" placeholder="Enter your Login ID (e.g. shaktix)" required autocomplete="username" />
                </div>

                <div class="field-group">
                  <label class="field-label" for="login-password">Password</label>
                  <div class="password-wrap">
                    <input id="login-password" name="password" type="${showLoginPassword ? 'text' : 'password'}" class="input" placeholder="Enter your password" required autocomplete="current-password" />
                    <button type="button" class="password-toggle" data-action="toggle-login-pass" aria-label="Show or hide password">
                      ${showLoginPassword ? icons.eyeOff : icons.eye}
                    </button>
                  </div>
                </div>

                <button type="submit" class="btn btn-primary btn-lg btn-pill" style="margin-top:6px;">
                  Login to REPLATE ${icons.arrowRight}
                </button>
              </form>
              `
                : `
              <form id="register-form" style="display:flex; flex-direction:column; gap:13px;">
                <div class="field-group">
                  <label class="field-label" for="reg-role">Account Type (Cannot register as Admin)</label>
                  <select id="reg-role" name="role" class="select" required>
                    <option value="donor">Food Donor (Restaurant, Kitchen, Home)</option>
                    <option value="ngo">NGO / Food Shelter</option>
                    <option value="volunteer">Volunteer Pickup Driver</option>
                  </select>
                </div>

                <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                  <div class="field-group">
                    <label class="field-label" for="reg-name">Your Name</label>
                    <input id="reg-name" name="name" class="input" placeholder="e.g. ShaktiX" required />
                  </div>
                  <div class="field-group">
                    <label class="field-label" for="reg-org">Kitchen or NGO Name</label>
                    <input id="reg-org" name="orgName" class="input" placeholder="e.g. Hope Kitchen" />
                  </div>
                </div>

                <div class="field-group">
                  <label class="field-label" for="reg-login-id">Choose Login ID</label>
                  <input id="reg-login-id" name="loginId" class="input" placeholder="Letters or numbers (e.g. hope_kitchen)" required autocomplete="username" />
                </div>

                <div class="field-group">
                  <label class="field-label" for="reg-password">Create Password (min 6 characters)</label>
                  <div class="password-wrap">
                    <input id="reg-password" name="password" type="${showRegisterPassword ? 'text' : 'password'}" class="input" placeholder="Create a strong password" minlength="6" required autocomplete="new-password" />
                    <button type="button" class="password-toggle" data-action="toggle-reg-pass" aria-label="Show or hide password">
                      ${showRegisterPassword ? icons.eyeOff : icons.eye}
                    </button>
                  </div>
                </div>

                <div class="field-group">
                  <label class="field-label" for="reg-address">Address</label>
                  <input id="reg-address" name="address" class="input" placeholder="Pickup or shelter address" />
                </div>

                <button type="submit" class="btn btn-primary btn-lg btn-pill" style="margin-top:4px;">
                  Create Account ${icons.arrowRight}
                </button>
              </form>
              `
            }
          </div>
        </div>
      </div>
    `;
  }

  /* ========================================================================
     APP WORKSPACE SHELL (Soft Sage Sidebar WITHOUT Evening Harvest Card)
     ======================================================================== */
  function renderAppShell(state) {
    const user = state.user;
    if (!user) return renderAuthPage(state, 'login');

    const navItems = getNavItemsForRole(user.role);
    const unreadCount = (state.notifications || []).filter((n) => n.unread).length;
    const meta = getViewMeta(state);

    const viewRenderers = {
      dashboard: renderDashboardByRole,
      admin: renderAdminView,
      donations: renderDonationsView,
      matches: renderMatchesView,
      pickups: renderPickupsView,
      impact: renderImpactView,
      notifications: renderNotificationsView,
      settings: renderSettingsView
    };

    const activeContent = (viewRenderers[state.activeView] || renderDashboardByRole)(state);

    return `
      <div class="app-shell">
        <div class="sidebar-overlay ${mobileSidebarOpen ? 'open' : ''}" data-action="close-mobile-nav"></div>

        <aside class="sidebar ${mobileSidebarOpen ? 'open' : ''}" aria-label="Workspace Sidebar">
          <div class="sidebar-brand">
            <div class="brand-lockup" data-action="go" data-view="landing" title="Go to Home Page">
              <div class="brand-mark">${icons.logoLeaf}</div>
              <div>
                <div class="brand-title">REPLATE</div>
                <div class="brand-sub">${escapeHtml(user.role.toUpperCase())} PORTAL</div>
              </div>
            </div>
          </div>

          <nav class="sidebar-nav">
            ${navItems
              .map((item) => {
                const isActive = state.activeView === item.id;
                const badgeHtml =
                  item.id === 'notifications' && unreadCount > 0
                    ? `<span class="nav-badge">${unreadCount}</span>`
                    : '';
                return `
                  <button class="nav-item ${isActive ? 'active' : ''}" data-action="go" data-view="${item.id}">
                    <span class="nav-item-left">
                      ${item.icon}
                      <span>${item.label}</span>
                    </span>
                    ${badgeHtml}
                  </button>
                `;
              })
              .join('')}
          </nav>

          <!-- User Profile Section Intact (Evening Harvest card completely removed) -->
          <div class="sidebar-user">
            <div class="avatar-circle">${escapeHtml(user.initials || 'SX')}</div>
            <div style="min-width:0; flex:1;">
              <div style="font-size:0.88rem; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                ${escapeHtml(user.name)}
              </div>
              <div style="font-size:0.75rem; color:var(--charcoal-muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                ${escapeHtml(user.orgName)}
              </div>
            </div>
          </div>

          <div style="display:flex; gap:8px; margin-top:12px;">
            <button class="btn btn-outline btn-sm" style="flex:1;" data-action="go" data-view="landing">
              ${icons.home} Home
            </button>
            <button class="btn btn-secondary btn-sm" style="flex:1;" data-action="logout">
              ${icons.logout} Logout
            </button>
          </div>
        </aside>

        <main class="main-content">
          <header class="topbar">
            <div class="topbar-title-area">
              <button class="mobile-menu-btn" data-action="toggle-mobile-nav" aria-label="Open menu">
                ${icons.menu}
              </button>
              <div>
                <h1 class="page-title">${escapeHtml(meta.title)}</h1>
                <p class="page-subtitle">${escapeHtml(meta.subtitle)}</p>
              </div>
            </div>

            <div class="topbar-controls">
              <div class="search-box" style="width:210px;">
                ${icons.search}
                <input
                  type="search"
                  class="input"
                  placeholder="Search food, NGOs..."
                  value="${escapeHtml(state.searchQuery)}"
                  data-action="search-input"
                />
              </div>
              ${renderThemeToggle(state)}
              ${
                user.role === 'donor' || user.role === 'admin'
                  ? `<button class="btn btn-primary btn-pill" data-action="scroll-to-donate">
                      ${icons.plus} Donate Food
                    </button>`
                  : `<button class="btn btn-secondary btn-pill" data-action="go" data-view="pickups">
                      ${icons.pickups} Pickups
                    </button>`
              }
            </div>
          </header>

          ${activeContent}
        </main>
      </div>
    `;
  }

  /* ========================================================================
     WHAT WOULD YOU LIKE TO DONATE? (Custom Food Form + Image Upload + Safety)
     ======================================================================== */
  function renderDonateFoodSection(state) {
    const now = new Date();
    const prepDefault = formatLocalDatetimeInput(new Date(now.getTime() - 30 * 60000));
    const bestDefault = formatLocalDatetimeInput(new Date(now.getTime() + 4 * 3600000));
    const addressDefault = state.user ? state.user.address : '428 Linden Street, Indiranagar';

    return `
      <section id="donate-food-section" class="card" style="margin-bottom:24px;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:12px; margin-bottom:16px;">
          <div>
            <span class="badge badge-blush" style="margin-bottom:8px;">Fresh Food Donation Form</span>
            <h2 style="font-size:1.6rem;">What Would You Like to Donate?</h2>
            <p style="font-size:0.88rem; color:var(--charcoal-muted); margin-top:4px;">
              Type any food name below or tap a popular Indian dish to fill it quickly.
            </p>
          </div>
          <span class="badge badge-olive">${icons.shield} Safety Check Included</span>
        </div>

        ${
          donateSafetyError
            ? `<div class="safety-alert error" role="alert">
                <span style="display:flex; margin-top:2px;">${icons.shield}</span>
                <div>
                  <strong>Donation Rejected by Food Safety Check:</strong><br/>
                  ${escapeHtml(donateSafetyError)}
                </div>
              </div>`
            : ''
        }

        <form id="dashboard-donate-form" class="donate-form-grid">
          <div class="field-group span-2" style="grid-column:span 2;">
            <label class="field-label" for="dash-food-name">Food Name (Type any dish)</label>
            <input id="dash-food-name" name="title" class="input" placeholder="e.g. Kadhi Chawal, Paneer Bhurji, Roti Sabzi..." required />
            <div class="dish-quick-chips" aria-label="Suggested Indian dishes">
              ${Store.INDIAN_DISHES.map(
                (dish) => `<button type="button" class="dish-chip" data-action="pick-indian-dish" data-dish="${escapeHtml(dish)}">${escapeHtml(dish)}</button>`
              ).join('')}
            </div>
          </div>

          <div class="field-group">
            <label class="field-label" for="dash-food-cat">Food Category</label>
            <select id="dash-food-cat" name="category" class="select">
              <option value="Home-Style Meals">Home-Style Meals</option>
              <option value="Snacks & Street Food">Snacks &amp; Street Food</option>
              <option value="Breakfast">Breakfast</option>
              <option value="Sweets & Desserts">Sweets &amp; Desserts</option>
              <option value="Fresh Produce & Other">Fresh Produce &amp; Other</option>
            </select>
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
            <div class="field-group">
              <label class="field-label" for="dash-qty">Quantity</label>
              <input id="dash-qty" name="quantity" class="input" placeholder="e.g. 10 kg or 30 plates" value="10 kg" required />
            </div>
            <div class="field-group">
              <label class="field-label" for="dash-servings">Number of People Served</label>
              <input id="dash-servings" name="servings" type="number" min="1" max="5000" value="30" class="input" required />
            </div>
          </div>

          <div class="field-group">
            <label class="field-label" for="dash-prep">Preparation Date and Time</label>
            <input id="dash-prep" name="preparedAt" type="datetime-local" class="input" value="${prepDefault}" required />
          </div>

          <div class="field-group">
            <label class="field-label" for="dash-best">Best-Before Date and Time</label>
            <input id="dash-best" name="bestBefore" type="datetime-local" class="input" value="${bestDefault}" required />
          </div>

          <div class="field-group">
            <label class="field-label" for="dash-address">Pickup Address</label>
            <input id="dash-address" name="pickupAddress" class="input" value="${escapeHtml(addressDefault)}" placeholder="Where should the volunteer collect the food?" required />
          </div>

          <div class="field-group">
            <label class="field-label" for="dash-photo">Food Photo Upload (Optional)</label>
            <input id="dash-photo" name="photoFile" type="file" accept="image/*" class="input" data-action="donate-photo-change" style="padding:8px 12px;" />
          </div>

          ${
            donatePhotoDataUrl
              ? `<div class="upload-preview-box span-2" style="grid-column:span 2;">
                  <img src="${donatePhotoDataUrl}" alt="Food photo preview" class="upload-thumb" />
                  <div style="flex:1;">
                    <div style="font-weight:600; font-size:0.88rem;">Uploaded Photo Ready</div>
                    <div style="font-size:0.8rem; color:var(--charcoal-muted);">${escapeHtml(donatePhotoName)}</div>
                  </div>
                  <button type="button" class="btn btn-outline btn-sm" data-action="clear-donate-photo">Remove Photo</button>
                </div>`
              : ''
          }

          <div class="field-group span-2" style="grid-column:span 2;">
            <label class="field-label" for="dash-notes">Additional Details</label>
            <textarea id="dash-notes" name="notes" rows="2" class="textarea" placeholder="Packing details, veg/non-veg note, or spice level..."></textarea>
          </div>

          <div class="span-2" style="grid-column:span 2; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
            <span style="font-size:0.82rem; color:var(--charcoal-muted);">
              Expired or old cooked food is blocked automatically to keep everyone safe.
            </span>
            <button type="submit" class="btn btn-primary btn-lg btn-pill">
              ${icons.plus} Donate Food
            </button>
          </div>
        </form>
      </section>
    `;
  }

  /* ========================================================================
     ROLE-BASED DASHBOARDS
     ======================================================================== */
  function renderDashboardByRole(state) {
    const role = state.user ? state.user.role : 'donor';
    if (role === 'ngo') return renderNgoDashboard(state);
    if (role === 'volunteer') return renderVolunteerDashboard(state);
    if (role === 'admin') return renderAdminView(state);
    return renderDonorDashboard(state);
  }

  function renderDonorDashboard(state) {
    const approvedDonations = state.donations.filter((d) => d.safetyStatus !== 'Rejected');
    const activeCount = approvedDonations.filter((d) => d.status === 'Available' || d.status === 'Matched').length;
    const totalKgReady = approvedDonations
      .filter((d) => d.status === 'Available' || d.status === 'Matched')
      .reduce((acc, d) => acc + Number(d.quantityKg || 0), 0)
      .toFixed(1);

    const topMatch = state.matches.find((m) => m.status === 'Pending') || state.matches[0];
    const weekSeries = state.impactData.week.series || [];
    const maxMeals = Math.max(...weekSeries.map((s) => s.meals), 1);

    const q = state.searchQuery.trim().toLowerCase();
    const mySubmitted = approvedDonations
      .filter((d) => !q || d.title.toLowerCase().includes(q) || d.category.toLowerCase().includes(q))
      .slice(0, 4);

    return `
      <!-- KPI Cards -->
      <section class="kpi-grid">
        <div class="card card-sage kpi-card">
          <div class="kpi-top">
            <span class="kpi-label">Meals Shared (This Month)</span>
            <div class="kpi-icon-wrap">${icons.impact}</div>
          </div>
          <div>
            <div class="kpi-value">${state.impactData.month.meals.toLocaleString()}</div>
            <div style="margin-top:8px;">
              <span class="badge" style="background:var(--white); color:var(--olive);">+18% from last month</span>
            </div>
          </div>
        </div>

        <div class="card kpi-card">
          <div class="kpi-top">
            <span class="kpi-label">Food Ready Now</span>
            <div class="kpi-icon-wrap">${icons.donations}</div>
          </div>
          <div>
            <div class="kpi-value">${activeCount}</div>
            <div style="margin-top:8px;">
              <span class="badge badge-beige">${totalKgReady} kg ready to pick up</span>
            </div>
          </div>
        </div>

        <div class="card card-blush kpi-card">
          <div class="kpi-top">
            <span class="kpi-label">Quick Matches</span>
            <div class="kpi-icon-wrap">${icons.matches}</div>
          </div>
          <div>
            <div class="kpi-value">96%</div>
            <div style="margin-top:8px;">
              <span class="badge" style="background:var(--white); color:var(--charcoal);">12 min average wait</span>
            </div>
          </div>
        </div>

        <div class="card kpi-card">
          <div class="kpi-top">
            <span class="kpi-label">Carbon Saved</span>
            <div class="kpi-icon-wrap">${icons.logoLeaf}</div>
          </div>
          <div>
            <div class="kpi-value">${state.impactData.month.co2} kg</div>
            <div style="margin-top:8px;">
              <span class="badge badge-olive">Same as 19 trees</span>
            </div>
          </div>
        </div>
      </section>

      <!-- What Would You Like to Donate? -->
      ${renderDonateFoodSection(state)}

      <!-- Main Two-Column Donor Dashboard -->
      <section class="dashboard-columns">
        <div class="stack-col">
          <!-- Available Food Today -->
          <div class="card">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px; gap:12px; flex-wrap:wrap;">
              <div>
                <h2 style="font-size:1.45rem;">Available Food Today</h2>
                <p style="font-size:0.86rem; color:var(--charcoal-muted);">Your submitted donations and fresh dishes ready for pickup</p>
              </div>
              <button class="btn btn-outline btn-sm btn-pill" data-action="go" data-view="donations">
                View All ${icons.arrowRight}
              </button>
            </div>

            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(230px, 1fr)); gap:16px;">
              ${mySubmitted
                .map(
                  (item) => `
                <div class="card card-ivory card-interactive" style="padding:16px; border-radius:18px; display:flex; flex-direction:column; gap:10px;">
                  <div class="food-photo-frame compact">
                    <img class="food-photo-img" src="${escapeHtml(Store.getFoodImage(item.title, item.imageUrl))}" alt="${escapeHtml(item.title)}" onerror="this.src='/images/fallback-food.jpg'" />
                  </div>
                  <div style="display:flex; justify-content:space-between; align-items:center; gap:6px;">
                    <span class="badge ${getStatusBadgeClass(item.status)}">${escapeHtml(item.status)}</span>
                    <span style="font-size:0.78rem; color:var(--charcoal-muted);">${escapeHtml(item.quantity)}</span>
                  </div>
                  <h3 style="font-size:1.12rem; line-height:1.25;">${escapeHtml(item.title)}</h3>
                  <div class="donation-meta-row">
                    <span>${item.servings} meals</span>
                    <span>${escapeHtml(item.window)}</span>
                  </div>
                </div>`
                )
                .join('')}
            </div>
          </div>

          <!-- Food Saved This Week -->
          <div class="card">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
              <div>
                <h2 style="font-size:1.4rem;">Food Saved This Week</h2>
                <p style="font-size:0.85rem; color:var(--charcoal-muted);">Meals shared with local shelters each day</p>
              </div>
              <span class="badge badge-olive">${state.impactData.week.meals} meals total</span>
            </div>

            <div style="display:flex; align-items:flex-end; justify-content:space-between; gap:12px; height:170px; padding:16px 8px 4px; border-bottom:1px solid var(--beige);">
              ${weekSeries
                .map((pt, idx) => {
                  const pct = Math.max(18, Math.round((pt.meals / maxMeals) * 124));
                  const barColor = idx === 4 ? 'var(--olive)' : idx % 2 === 0 ? 'var(--sage)' : 'var(--blush)';
                  return `
                    <div style="flex:1; display:flex; flex-direction:column; align-items:center; gap:8px;">
                      <span style="font-size:0.76rem; font-weight:600; color:var(--charcoal-muted);">${pt.meals}</span>
                      <div style="width:100%; max-width:44px; height:${pct}px; background:${barColor}; border:1px solid var(--beige); border-radius:12px 12px 6px 6px;"></div>
                    </div>
                  `;
                })
                .join('')}
            </div>
            <div style="display:flex; justify-content:space-between; gap:12px; padding:8px 8px 0;">
              ${weekSeries.map((pt) => `<div style="flex:1; text-align:center; font-size:0.8rem; color:var(--charcoal-muted);">${escapeHtml(pt.label)}</div>`).join('')}
            </div>
          </div>
        </div>

        <!-- Right Column: Best NGO Match & Upcoming Pickups -->
        <div class="stack-col">
          ${
            topMatch
              ? `
            <div class="card card-blush">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                <span class="badge" style="background:var(--white); color:var(--charcoal);">
                  ${icons.sparkles} Best NGO Match
                </span>
                <span class="score-pill">${topMatch.compatibility}% Match</span>
              </div>
              <h2 style="font-size:1.45rem; margin-bottom:4px;">${escapeHtml(topMatch.ngoName)}</h2>
              <p style="font-size:0.86rem; color:var(--charcoal-muted); margin-bottom:14px;">
                ${topMatch.distanceKm} km away · ${escapeHtml(topMatch.pickupTime)}
              </p>

              <div class="card" style="padding:14px; border-radius:14px; margin-bottom:16px; box-shadow:none;">
                <div style="font-size:0.78rem; text-transform:uppercase; letter-spacing:0.08em; color:var(--rose); font-weight:600; margin-bottom:4px;">
                  Matched Food
                </div>
                <div style="font-weight:600; font-size:0.98rem; margin-bottom:3px;">${escapeHtml(topMatch.donationTitle)}</div>
                <div style="font-size:0.84rem; color:var(--charcoal-muted);">
                  ${escapeHtml(topMatch.quantityLabel)} · ${topMatch.servings} meals
                </div>
              </div>

              <div style="display:flex; gap:10px;">
                ${
                  topMatch.status === 'Pending'
                    ? `<button class="btn btn-primary" style="flex:1;" data-action="accept-match" data-id="${escapeHtml(topMatch.id)}">
                        ${icons.check} Accept Match
                      </button>`
                    : `<span class="badge badge-olive" style="padding:8px 14px;">Match Accepted</span>`
                }
                <button class="btn btn-outline" data-action="go" data-view="matches">See All Matches</button>
              </div>
            </div>`
              : ''
          }

          <div class="card">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
              <h2 style="font-size:1.38rem;">Upcoming Pickups</h2>
              <button class="btn btn-ghost btn-sm" data-action="go" data-view="pickups">See All</button>
            </div>

            <div style="display:flex; flex-direction:column; gap:12px;">
              ${state.pickups
                .slice(0, 4)
                .map(
                  (pk) => `
                <div style="padding:14px; border-radius:16px; border:1px solid var(--beige); background:var(--ivory-soft);">
                  <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom:6px;">
                    <span style="font-weight:600; font-size:0.93rem;">${escapeHtml(pk.ngoName)}</span>
                    <span class="badge ${getStatusBadgeClass(pk.status)}">${escapeHtml(pk.status)}</span>
                  </div>
                  <div style="font-size:0.86rem; color:var(--charcoal); margin-bottom:5px;">
                    ${escapeHtml(pk.donationTitle)}
                  </div>
                  <div style="font-size:0.79rem; color:var(--charcoal-muted);">
                    Volunteer: ${escapeHtml(pk.volunteerName)}
                  </div>
                </div>`
                )
                .join('')}
            </div>
          </div>
        </div>
      </section>
    `;
  }

  function renderNgoDashboard(state) {
    const pendingMatches = state.matches.filter((m) => m.status === 'Pending');
    const incomingPickups = state.pickups.filter((p) => p.status !== 'Cancelled');

    return `
      <section class="kpi-grid">
        <div class="card card-sage kpi-card">
          <div class="kpi-top"><span class="kpi-label">Food Matches Waiting</span><div class="kpi-icon-wrap">${icons.matches}</div></div>
          <div class="kpi-value">${pendingMatches.length}</div>
        </div>
        <div class="card card-blush kpi-card">
          <div class="kpi-top"><span class="kpi-label">Active Pickups</span><div class="kpi-icon-wrap">${icons.pickups}</div></div>
          <div class="kpi-value">${incomingPickups.filter((p) => p.status !== 'Completed').length}</div>
        </div>
        <div class="card kpi-card">
          <div class="kpi-top"><span class="kpi-label">Available Meals Today</span><div class="kpi-icon-wrap">${icons.donations}</div></div>
          <div class="kpi-value">${state.donations.filter((d) => d.status === 'Available').reduce((a, b) => a + Number(b.servings || 0), 0)}</div>
        </div>
        <div class="card kpi-card">
          <div class="kpi-top"><span class="kpi-label">Meals Received</span><div class="kpi-icon-wrap">${icons.impact}</div></div>
          <div class="kpi-value">${state.impactData.month.meals.toLocaleString()}</div>
        </div>
      </section>

      <section class="dashboard-columns">
        <div class="card">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
            <h2 style="font-size:1.4rem;">Matches for Your Kitchen</h2>
            <button class="btn btn-outline btn-sm btn-pill" data-action="go" data-view="matches">See All Matches</button>
          </div>
          <div style="display:flex; flex-direction:column; gap:12px;">
            ${state.matches
              .slice(0, 4)
              .map(
                (m) => `
              <div style="padding:14px; border-radius:16px; border:1px solid var(--beige); background:var(--ivory-soft); display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap;">
                <div>
                  <div style="font-weight:600;">${escapeHtml(m.donationTitle)} · ${escapeHtml(m.quantityLabel)}</div>
                  <div style="font-size:0.82rem; color:var(--charcoal-muted);">${m.servings} meals · ${m.distanceKm} km away · ${escapeHtml(m.pickupTime)}</div>
                </div>
                ${
                  m.status === 'Pending'
                    ? `<button class="btn btn-primary btn-sm btn-pill" data-action="accept-match" data-id="${escapeHtml(m.id)}">Accept Match</button>`
                    : `<span class="badge ${getStatusBadgeClass(m.status)}">${escapeHtml(m.status)}</span>`
                }
              </div>`
              )
              .join('')}
          </div>
        </div>

        <div class="card">
          <h2 style="font-size:1.4rem; margin-bottom:14px;">Upcoming Pickups</h2>
          <div style="display:flex; flex-direction:column; gap:12px;">
            ${incomingPickups
              .slice(0, 4)
              .map(
                (pk) => `
              <div style="padding:14px; border-radius:16px; border:1px solid var(--beige); background:var(--ivory-soft);">
                <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                  <strong>${escapeHtml(pk.donationTitle)}</strong>
                  <span class="badge ${getStatusBadgeClass(pk.status)}">${escapeHtml(pk.status)}</span>
                </div>
                <div style="font-size:0.83rem; color:var(--charcoal-muted);">NGO: ${escapeHtml(pk.ngoName)} · Volunteer: ${escapeHtml(pk.volunteerName)}</div>
              </div>`
              )
              .join('')}
          </div>
        </div>
      </section>
    `;
  }

  function renderVolunteerDashboard(state) {
    const scheduled = state.pickups.filter((p) => p.status === 'Scheduled').length;
    const onWay = state.pickups.filter((p) => p.status === 'On the Way').length;
    const completed = state.pickups.filter((p) => p.status === 'Completed').length;

    return `
      <section class="kpi-grid">
        <div class="card card-sage kpi-card">
          <div class="kpi-top"><span class="kpi-label">Scheduled Pickups</span><div class="kpi-icon-wrap">${icons.pickups}</div></div>
          <div class="kpi-value">${scheduled}</div>
        </div>
        <div class="card card-blush kpi-card">
          <div class="kpi-top"><span class="kpi-label">On the Way</span><div class="kpi-icon-wrap">${icons.clock}</div></div>
          <div class="kpi-value">${onWay}</div>
        </div>
        <div class="card kpi-card">
          <div class="kpi-top"><span class="kpi-label">Completed Deliveries</span><div class="kpi-icon-wrap">${icons.check}</div></div>
          <div class="kpi-value">${completed}</div>
        </div>
        <div class="card kpi-card">
          <div class="kpi-top"><span class="kpi-label">Volunteer Name</span><div class="kpi-icon-wrap">${icons.logoLeaf}</div></div>
          <div style="font-family:var(--font-serif); font-size:1.45rem;">${escapeHtml(state.user.name)}</div>
        </div>
      </section>

      <div class="card" style="margin-bottom:22px;">
        <h2 style="font-size:1.45rem; margin-bottom:14px;">Your Delivery List</h2>
        <div class="pickups-grid">
          ${state.pickups
            .map(
              (pk) => `
            <div class="card card-ivory" style="padding:18px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <span style="font-weight:600;">${escapeHtml(pk.ngoName)}</span>
                <span class="badge ${getStatusBadgeClass(pk.status)}">${escapeHtml(pk.status)}</span>
              </div>
              <div style="font-size:1rem; font-weight:600; margin-bottom:4px;">${escapeHtml(pk.donationTitle)}</div>
              <div style="font-size:0.83rem; color:var(--charcoal-muted); margin-bottom:6px;">Address: ${escapeHtml(pk.pickupAddress)}</div>
              <div style="font-size:0.83rem; color:var(--charcoal-muted); margin-bottom:12px;">Volunteer: ${escapeHtml(pk.volunteerName)} · Code: <strong>${escapeHtml(pk.handoffCode)}</strong></div>
              <div style="display:flex; gap:8px; flex-wrap:wrap;">
                ${pk.status === 'Scheduled' ? `<button class="btn btn-primary btn-sm" data-action="set-pickup-status" data-id="${escapeHtml(pk.id)}" data-status="On the Way">Start Pickup (On the Way)</button>` : ''}
                ${pk.status === 'On the Way' ? `<button class="btn btn-primary btn-sm" data-action="set-pickup-status" data-id="${escapeHtml(pk.id)}" data-status="Completed">Mark Completed</button>` : ''}
                ${pk.status === 'Scheduled' || pk.status === 'On the Way' ? `<button class="btn btn-outline btn-sm" data-action="set-pickup-status" data-id="${escapeHtml(pk.id)}" data-status="Cancelled">Cancel</button>` : ''}
              </div>
            </div>`
            )
            .join('')}
        </div>
      </div>
    `;
  }

  function renderAdminView(state) {
    const users = state.users || [];
    const safetyLogs = state.safetyLogs || [];

    return `
      <section class="kpi-grid">
        <div class="card card-sage kpi-card">
          <div class="kpi-top"><span class="kpi-label">Registered Accounts</span><div class="kpi-icon-wrap">${icons.shield}</div></div>
          <div class="kpi-value">${users.length}</div>
        </div>
        <div class="card kpi-card">
          <div class="kpi-top"><span class="kpi-label">Total Food Listings</span><div class="kpi-icon-wrap">${icons.donations}</div></div>
          <div class="kpi-value">${state.donations.length}</div>
        </div>
        <div class="card card-blush kpi-card">
          <div class="kpi-top"><span class="kpi-label">NGO Matches</span><div class="kpi-icon-wrap">${icons.matches}</div></div>
          <div class="kpi-value">${state.matches.length}</div>
        </div>
        <div class="card kpi-card">
          <div class="kpi-top"><span class="kpi-label">Rejected Unsafe Items</span><div class="kpi-icon-wrap">${icons.shield}</div></div>
          <div class="kpi-value">${safetyLogs.length}</div>
        </div>
      </section>

      <section class="dashboard-columns">
        <div class="card">
          <h2 style="font-size:1.4rem; margin-bottom:14px;">All Platform Users</h2>
          <div style="display:flex; flex-direction:column; gap:10px;">
            ${users
              .map(
                (u) => `
              <div style="display:flex; justify-content:space-between; align-items:center; padding:12px 14px; border:1px solid var(--beige); border-radius:14px; background:var(--ivory-soft);">
                <div>
                  <div style="font-weight:600;">${escapeHtml(u.name)} <span style="font-size:0.8rem; color:var(--charcoal-muted);">(@${escapeHtml(u.loginId)})</span></div>
                  <div style="font-size:0.8rem; color:var(--charcoal-muted);">${escapeHtml(u.orgName)}</div>
                </div>
                <span class="badge ${u.role === 'admin' ? 'badge-rose' : u.role === 'ngo' ? 'badge-blush' : 'badge-olive'}">${escapeHtml(u.role.toUpperCase())}</span>
              </div>`
              )
              .join('')}
          </div>
        </div>

        <div class="card">
          <h2 style="font-size:1.4rem; margin-bottom:14px;">Food Safety Rejection Log</h2>
          ${
            safetyLogs.length === 0
              ? `<p style="font-size:0.9rem; color:var(--charcoal-muted);">No rejected food submissions yet. Any expired or unsafe food attempts appear here.</p>`
              : `<div style="display:flex; flex-direction:column; gap:10px;">
                  ${safetyLogs
                    .map(
                      (log) => `
                    <div class="safety-alert error" style="margin-bottom:0;">
                      <div>
                        <strong>${escapeHtml(log.title)}</strong> (${escapeHtml(log.donorName)})<br/>
                        <span style="font-size:0.82rem;">${escapeHtml(log.reason)}</span>
                      </div>
                    </div>`
                    )
                    .join('')}
                </div>`
          }
        </div>
      </section>
    `;
  }

  /* ========================================================================
     2. DONATIONS VIEW
     ======================================================================== */
  function renderDonationsView(state) {
    const categories = ['All', 'Home-Style Meals', 'Snacks & Street Food', 'Breakfast', 'Sweets & Desserts', 'Fresh Produce & Other'];
    const statuses = ['All', 'Available', 'Matched', 'Completed'];

    const filtered = state.donations.filter((d) => {
      const catOk = state.donationFilter === 'All' || d.category === state.donationFilter;
      const statusOk = state.donationStatusFilter === 'All' || d.status === state.donationStatusFilter;
      const q = state.searchQuery.trim().toLowerCase();
      const queryOk = !q || d.title.toLowerCase().includes(q) || d.category.toLowerCase().includes(q);
      return catOk && statusOk && queryOk;
    });

    const canDonate = state.user && (state.user.role === 'donor' || state.user.role === 'admin');

    return `
      ${canDonate ? renderDonateFoodSection(state) : ''}

      <div class="filter-bar">
        <div class="chip-group">
          ${categories
            .map(
              (cat) => `
            <button class="filter-chip ${state.donationFilter === cat ? 'active' : ''}" data-action="set-donation-filter" data-value="${escapeHtml(cat)}">
              ${escapeHtml(cat)}
            </button>`
            )
            .join('')}
        </div>

        <div class="chip-group">
          ${statuses
            .map(
              (st) => `
            <button class="filter-chip ${state.donationStatusFilter === st ? 'active' : ''}" data-action="set-status-filter" data-value="${escapeHtml(st)}">
              ${escapeHtml(st)}
            </button>`
            )
            .join('')}
        </div>
      </div>

      ${
        filtered.length === 0
          ? `<div class="card card-ivory" style="text-align:center; padding:42px 24px;">
              <h3 style="font-size:1.35rem; margin-bottom:6px;">No food donations match those filters</h3>
              <p style="color:var(--charcoal-muted);">Try selecting "All" above or donate a new dish.</p>
            </div>`
          : `<div class="pinterest-grid">
              ${filtered
                .map((item) => {
                  const canDelete = state.user && (state.user.role === 'admin' || state.user.loginId === item.donorLoginId);
                  return `
                    <article class="card card-interactive pinterest-card">
                      <div class="food-photo-frame">
                        <img class="food-photo-img" src="${escapeHtml(Store.getFoodImage(item.title, item.imageUrl))}" alt="${escapeHtml(item.title)}" onerror="this.src='/images/fallback-food.jpg'" />
                      </div>

                      <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; flex-wrap:wrap;">
                        <span class="badge ${getStatusBadgeClass(item.status)}">
                          ${escapeHtml(item.status)}${item.matchedNgo ? ` · ${escapeHtml(item.matchedNgo)}` : ''}
                        </span>
                        <span class="badge badge-olive">${escapeHtml(item.safetyStatus || 'Approved')}</span>
                      </div>

                      <div>
                        <div style="font-size:0.76rem; text-transform:uppercase; letter-spacing:0.08em; color:var(--olive); font-weight:600; margin-bottom:4px;">
                          ${escapeHtml(item.category)}
                        </div>
                        <h3 style="font-size:1.25rem; line-height:1.25; margin-bottom:6px;">${escapeHtml(item.title)}</h3>
                        <p style="font-size:0.88rem; color:var(--charcoal-muted);">${escapeHtml(item.notes)}</p>
                      </div>

                      <div class="divider-beige"></div>

                      <div class="donation-meta-row">
                        <span><strong>${escapeHtml(item.quantity)}</strong> · ${item.servings} people served</span>
                        <span>${escapeHtml(item.window)}</span>
                      </div>

                      <div style="font-size:0.8rem; color:var(--charcoal-muted);">
                        Pickup: ${escapeHtml(item.pickupAddress || '428 Linden Street')}
                      </div>

                      <div style="display:flex; gap:8px; margin-top:4px;">
                        ${
                          item.status === 'Available'
                            ? `<button class="btn btn-primary btn-sm" style="flex:1;" data-action="go" data-view="matches">See NGO Matches</button>`
                            : `<button class="btn btn-outline btn-sm" style="flex:1;" data-action="go" data-view="pickups">See Pickup</button>`
                        }
                        ${
                          canDelete
                            ? `<button class="btn btn-outline btn-sm" data-action="delete-donation" data-id="${escapeHtml(item.id)}">Remove</button>`
                            : ''
                        }
                      </div>
                    </article>
                  `;
                })
                .join('')}
            </div>`
      }
    `;
  }

  /* ========================================================================
     3. SIMPLIFIED NGO MATCHES VIEW
     ======================================================================== */
  function renderMatchesView(state) {
    const pendingCount = state.matches.filter((m) => m.status === 'Pending').length;
    const q = state.searchQuery.trim().toLowerCase();
    const filteredMatches = state.matches.filter(
      (m) => !q || m.ngoName.toLowerCase().includes(q) || m.donationTitle.toLowerCase().includes(q)
    );

    return `
      <div class="card card-blush" style="margin-bottom:22px; display:flex; align-items:center; justify-content:space-between; gap:18px; flex-wrap:wrap;">
        <div>
          <span class="badge" style="background:var(--white); color:var(--charcoal); margin-bottom:8px;">
            ${icons.sparkles} Best NGO Match
          </span>
          <h2 style="font-size:1.5rem; margin-bottom:4px;">
            ${pendingCount > 0 ? `${pendingCount} NGO matches ready for you` : 'All food batches are matched'}
          </h2>
          <p style="font-size:0.9rem; color:var(--charcoal-muted);">
            Click "Accept Match" to schedule a volunteer pickup right away.
          </p>
        </div>
        <button class="btn btn-outline btn-pill" data-action="go" data-view="pickups">
          See Upcoming Pickups ${icons.arrowRight}
        </button>
      </div>

      <div class="matches-grid">
        ${filteredMatches
          .map((m) => {
            const isAccepted = m.status === 'Accepted';
            const isDeclined = m.status === 'Declined';

            return `
              <div class="card card-interactive ${isAccepted ? 'card-sage' : ''}" style="display:flex; flex-direction:column; gap:14px;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:10px;">
                  <div>
                    <h3 style="font-size:1.32rem;">${escapeHtml(m.ngoName)}</h3>
                    <div style="font-size:0.84rem; color:var(--charcoal-muted); margin-top:2px;">
                      ${m.distanceKm} km away
                    </div>
                  </div>
                  <span class="score-pill">${m.compatibility}% Match</span>
                </div>

                <div style="padding:14px; border-radius:14px; background:var(--ivory); border:1px solid var(--beige);">
                  <div style="font-size:0.76rem; text-transform:uppercase; letter-spacing:0.08em; color:var(--rose); font-weight:600; margin-bottom:4px;">
                    Matched Food
                  </div>
                  <div style="font-weight:600; font-size:1rem; margin-bottom:4px;">${escapeHtml(m.donationTitle)}</div>
                  <div style="font-size:0.85rem; color:var(--charcoal-muted);">
                    Quantity: <strong>${escapeHtml(m.quantityLabel)}</strong> · Meals: <strong>${m.servings}</strong>
                  </div>
                  <div style="font-size:0.84rem; color:var(--charcoal-muted); margin-top:4px;">
                    Pickup Time: ${escapeHtml(m.pickupTime)}
                  </div>
                </div>

                <div style="display:flex; gap:10px; margin-top:auto;">
                  ${
                    isAccepted
                      ? `<button class="btn btn-outline" style="flex:1;" data-action="go" data-view="pickups">
                          ${icons.check} Accepted · View Pickup
                        </button>`
                      : isDeclined
                      ? `<span class="badge badge-error">Declined</span>`
                      : `<button class="btn btn-primary" style="flex:1;" data-action="accept-match" data-id="${escapeHtml(m.id)}">
                          ${icons.check} Accept Match
                        </button>
                        <button class="btn btn-outline" data-action="decline-match" data-id="${escapeHtml(m.id)}">
                          Decline
                        </button>`
                  }
                </div>
              </div>
            `;
          })
          .join('')}
      </div>
    `;
  }

  /* ========================================================================
     4. SIMPLIFIED UPCOMING PICKUPS VIEW (Scheduled, On the Way, Completed, Cancelled)
     ======================================================================== */
  function renderPickupsView(state) {
    const q = state.searchQuery.trim().toLowerCase();
    const filteredPickups = state.pickups.filter(
      (pk) =>
        !q ||
        pk.ngoName.toLowerCase().includes(q) ||
        pk.donationTitle.toLowerCase().includes(q) ||
        pk.volunteerName.toLowerCase().includes(q)
    );

    const statusOptions = ['Scheduled', 'On the Way', 'Completed', 'Cancelled'];

    return `
      <div class="card card-sage" style="margin-bottom:22px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:14px;">
        <div>
          <h2 style="font-size:1.45rem; margin-bottom:4px;">Upcoming Pickups</h2>
          <p style="font-size:0.9rem; color:var(--charcoal-muted);">
            See who is picking up each meal and update status as food moves.
          </p>
        </div>
        <span class="badge" style="background:var(--white); color:var(--olive);">
          ${state.pickups.filter((p) => p.status === 'Scheduled' || p.status === 'On the Way').length} active pickups
        </span>
      </div>

      <div class="pickups-grid">
        ${filteredPickups
          .map((pk) => {
            const stepIndex = pk.status === 'Completed' ? 2 : pk.status === 'On the Way' ? 1 : pk.status === 'Scheduled' ? 0 : -1;

            return `
              <div class="card card-interactive" style="display:flex; flex-direction:column; gap:14px;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:12px;">
                  <div>
                    <div style="font-size:0.78rem; color:var(--charcoal-subtle); margin-bottom:2px;">${escapeHtml(pk.window)}</div>
                    <h3 style="font-size:1.25rem;">${escapeHtml(pk.ngoName)}</h3>
                    <div style="font-size:0.92rem; font-weight:500; margin-top:2px;">${escapeHtml(pk.donationTitle)}</div>
                  </div>
                  <span class="badge ${getStatusBadgeClass(pk.status)}">${escapeHtml(pk.status)}</span>
                </div>

                ${
                  stepIndex >= 0
                    ? `<div>
                        <div class="progress-track">
                          <div class="progress-step ${stepIndex >= 0 ? 'done' : ''}"></div>
                          <div class="progress-step ${stepIndex >= 1 ? 'done' : ''}"></div>
                          <div class="progress-step ${stepIndex >= 2 ? 'done' : ''}"></div>
                        </div>
                        <div style="display:flex; justify-content:space-between; font-size:0.75rem; color:var(--charcoal-muted);">
                          <span>Scheduled</span>
                          <span>On the Way</span>
                          <span>Completed</span>
                        </div>
                      </div>`
                    : `<span class="badge badge-error" style="align-self:flex-start;">Pickup Cancelled</span>`
                }

                <div style="display:flex; justify-content:space-between; align-items:center; padding:12px 14px; border-radius:14px; background:var(--ivory); border:1px solid var(--beige);">
                  <div>
                    <div style="font-size:0.76rem; color:var(--charcoal-subtle);">Volunteer Name</div>
                    <div style="font-weight:600; font-size:0.92rem;">${escapeHtml(pk.volunteerName)}</div>
                  </div>
                  <div style="text-align:right;">
                    <div style="font-size:0.76rem; color:var(--charcoal-subtle);">Pickup Code</div>
                    <div style="font-weight:700; color:var(--olive);">${escapeHtml(pk.handoffCode)}</div>
                  </div>
                </div>

                <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:auto;">
                  ${statusOptions
                    .map(
                      (st) => `
                    <button
                      type="button"
                      class="btn btn-sm ${pk.status === st ? 'btn-primary' : 'btn-outline'}"
                      data-action="set-pickup-status"
                      data-id="${escapeHtml(pk.id)}"
                      data-status="${escapeHtml(st)}"
                    >
                      ${escapeHtml(st)}
                    </button>`
                    )
                    .join('')}
                </div>
              </div>
            `;
          })
          .join('')}
      </div>
    `;
  }

  /* ========================================================================
     5. IMPACT VIEW (Simple English)
     ======================================================================== */
  function renderImpactView(state) {
    const period = state.impactPeriod || 'month';
    const data = state.impactData[period] || state.impactData.month;
    const series = data.series || [];
    const maxSeries = Math.max(...series.map((s) => s.meals), 1);

    return `
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:20px;">
        <div class="chip-group">
          <button class="filter-chip ${period === 'week' ? 'active' : ''}" data-action="set-impact-period" data-value="week">This Week</button>
          <button class="filter-chip ${period === 'month' ? 'active' : ''}" data-action="set-impact-period" data-value="month">This Month</button>
          <button class="filter-chip ${period === 'year' ? 'active' : ''}" data-action="set-impact-period" data-value="year">This Year</button>
        </div>

        <button class="btn btn-secondary btn-pill" data-action="export-impact">
          ${icons.download} Download Summary
        </button>
      </div>

      <section class="impact-hero-grid">
        <div class="card card-sage" style="display:flex; flex-direction:column; justify-content:space-between; gap:20px;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start;">
            <div>
              <span class="badge" style="background:var(--white); color:var(--olive); margin-bottom:10px;">Food Saved So Far</span>
              <h2 style="font-size:2.3rem; line-height:1.08;">${data.meals.toLocaleString()} Meals Shared</h2>
              <p style="font-size:0.94rem; color:var(--charcoal-muted); margin-top:6px;">
                ${data.kg.toLocaleString()} kg of good food delivered to ${data.ngos} local shelters.
              </p>
            </div>
            <div>${botanicalSprig(100)}</div>
          </div>

          <div style="background:var(--white); border:1px solid var(--beige); border-radius:18px; padding:18px;">
            <div style="display:flex; justify-content:space-between; margin-bottom:14px;">
              <span style="font-weight:600; font-size:0.9rem;">Meals Shared</span>
              <span style="font-size:0.8rem; color:var(--olive);">Best: ${maxSeries} meals</span>
            </div>
            <div style="display:flex; align-items:flex-end; gap:12px; height:150px; border-bottom:1px solid var(--beige); padding-bottom:6px;">
              ${series
                .map((pt, idx) => {
                  const h = Math.max(16, Math.round((pt.meals / maxSeries) * 114));
                  const fill = idx === series.length - 1 ? 'var(--olive)' : idx % 2 === 0 ? 'var(--sage)' : 'var(--blush)';
                  return `
                    <div style="flex:1; display:flex; flex-direction:column; align-items:center; gap:6px;">
                      <span style="font-size:0.74rem; color:var(--charcoal-muted); font-weight:600;">${pt.meals}</span>
                      <div style="width:100%; max-width:46px; height:${h}px; background:${fill}; border-radius:10px 10px 4px 4px;"></div>
                    </div>
                  `;
                })
                .join('')}
            </div>
            <div style="display:flex; gap:12px; padding-top:8px;">
              ${series.map((pt) => `<div style="flex:1; text-align:center; font-size:0.78rem; color:var(--charcoal-muted);">${escapeHtml(pt.label)}</div>`).join('')}
            </div>
          </div>
        </div>

        <div class="stack-col">
          <div class="card card-blush">
            <span class="badge" style="background:var(--white); color:var(--charcoal); margin-bottom:10px;">Carbon Saved</span>
            <div style="font-family:var(--font-serif); font-size:2.4rem; line-height:1.05; margin-bottom:6px;">
              ${data.co2.toLocaleString()} kg CO₂e
            </div>
            <p style="font-size:0.88rem; color:var(--charcoal-muted);">
              Keeping extra food out of the bin protects our planet and feeds neighbors.
            </p>
          </div>

          <div class="card">
            <h3 style="font-size:1.3rem; margin-bottom:12px;">Food Types Shared</h3>
            <div style="display:flex; flex-direction:column; gap:10px; font-size:0.88rem;">
              <div style="display:flex; justify-content:space-between;"><span>Home-Style Meals</span><strong>48%</strong></div>
              <div style="display:flex; justify-content:space-between;"><span>Breakfast</span><strong>22%</strong></div>
              <div style="display:flex; justify-content:space-between;"><span>Snacks &amp; Street Food</span><strong>18%</strong></div>
              <div style="display:flex; justify-content:space-between;"><span>Sweets &amp; Desserts</span><strong>12%</strong></div>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  /* ========================================================================
     6. NOTIFICATIONS VIEW
     ======================================================================== */
  function renderNotificationsView(state) {
    const categories = ['All', 'Matches', 'Pickups', 'Safety'];
    const filtered = state.notifications.filter((n) => state.notifFilter === 'All' || n.category === state.notifFilter);

    return `
      <div class="filter-bar">
        <div class="chip-group">
          ${categories
            .map(
              (c) => `
            <button class="filter-chip ${state.notifFilter === c ? 'active' : ''}" data-action="set-notif-filter" data-value="${escapeHtml(c)}">
              ${escapeHtml(c)}
            </button>`
            )
            .join('')}
        </div>
        <button class="btn btn-outline btn-sm btn-pill" data-action="mark-all-read">
          ${icons.check} Mark All Read
        </button>
      </div>

      <div class="notif-list">
        ${filtered
          .map(
            (n) => `
          <div class="notif-item ${n.unread ? 'unread' : ''}">
            <div style="display:flex; align-items:flex-start; gap:12px;">
              ${n.unread ? `<span class="unread-dot"></span>` : `<span style="width:9px;"></span>`}
              <div>
                <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px; flex-wrap:wrap;">
                  <span class="badge ${n.category === 'Matches' ? 'badge-blush' : n.category === 'Pickups' ? 'badge-olive' : 'badge-warning'}">
                    ${escapeHtml(n.category)}
                  </span>
                  <span style="font-size:0.78rem; color:var(--charcoal-subtle);">${escapeHtml(n.time)}</span>
                </div>
                <h3 style="font-size:1.12rem; margin-bottom:3px;">${escapeHtml(n.title)}</h3>
                <p style="font-size:0.88rem; color:var(--charcoal-muted);">${escapeHtml(n.body)}</p>
              </div>
            </div>

            <div style="display:flex; align-items:center; gap:8px; flex-shrink:0;">
              ${n.unread ? `<button class="btn btn-ghost btn-sm" data-action="mark-notif-read" data-id="${escapeHtml(n.id)}">Mark read</button>` : ''}
              <button class="btn btn-secondary btn-sm btn-pill" data-action="go" data-view="${escapeHtml(n.actionView)}">
                ${escapeHtml(n.actionLabel)}
              </button>
            </div>
          </div>`
          )
          .join('')}
      </div>
    `;
  }

  /* ========================================================================
     7. SETTINGS VIEW
     ======================================================================== */
  function renderSettingsView(state) {
    const p = state.user;

    return `
      <form id="settings-form" class="settings-grid">
        <div class="card">
          <h2 style="font-size:1.45rem; margin-bottom:4px;">Your Account Profile</h2>
          <p style="font-size:0.86rem; color:var(--charcoal-muted); margin-bottom:20px;">
            Keep your contact and pickup address updated.
          </p>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px;">
            <div class="field-group">
              <label class="field-label" for="set-name">Your Name</label>
              <input id="set-name" name="name" class="input" value="${escapeHtml(p.name)}" required />
            </div>
            <div class="field-group">
              <label class="field-label" for="set-org">Kitchen / Group Name</label>
              <input id="set-org" name="orgName" class="input" value="${escapeHtml(p.orgName)}" required />
            </div>
            <div class="field-group">
              <label class="field-label" for="set-phone">Phone Number</label>
              <input id="set-phone" name="phone" class="input" value="${escapeHtml(p.phone)}" />
            </div>
            <div class="field-group">
              <label class="field-label" for="set-window">Usual Pickup Time</label>
              <input id="set-window" name="defaultWindow" class="input" value="${escapeHtml(p.defaultWindow)}" />
            </div>
            <div class="field-group" style="grid-column:span 2;">
              <label class="field-label" for="set-address">Pickup Address</label>
              <input id="set-address" name="address" class="input" value="${escapeHtml(p.address)}" />
            </div>
          </div>

          <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:22px;">
            <button type="submit" class="btn btn-primary btn-pill">${icons.check} Save Changes</button>
          </div>
        </div>

        <div class="stack-col">
          <div class="card card-ivory">
            <h2 style="font-size:1.35rem; margin-bottom:12px;">Theme &amp; Alerts</h2>

            <div class="setting-row">
              <div>
                <div style="font-weight:600; font-size:0.92rem;">Appearance Theme</div>
                <div style="font-size:0.8rem; color:var(--charcoal-muted);">Switch between soft Light Mode and Dark Mode</div>
              </div>
              ${renderThemeToggle(state)}
            </div>

            <div class="setting-row">
              <div>
                <div style="font-weight:600; font-size:0.92rem;">Expiry Warnings</div>
                <div style="font-size:0.8rem; color:var(--charcoal-muted);">Remind me before food reaches best-before time</div>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" name="urgentAlerts" ${p.urgentAlerts ? 'checked' : ''} />
                <span class="toggle-slider"></span>
              </label>
            </div>

            <div class="setting-row">
              <div>
                <div style="font-weight:600; font-size:0.92rem;">Monthly Meal Report</div>
                <div style="font-size:0.8rem; color:var(--charcoal-muted);">Save monthly summary of meals shared</div>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" name="emailDigest" ${p.emailDigest ? 'checked' : ''} />
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>

          <div class="card card-blush">
            <h3 style="font-size:1.2rem; margin-bottom:6px;">Signed in as ${escapeHtml(p.name)}</h3>
            <p style="font-size:0.85rem; color:var(--charcoal-muted); margin-bottom:14px;">
              Login ID: <strong>${escapeHtml(p.loginId)}</strong> · Role: <strong>${escapeHtml(p.role.toUpperCase())}</strong>
            </p>
            <button type="button" class="btn btn-outline btn-sm" data-action="logout">${icons.logout} Log Out</button>
          </div>
        </div>
      </form>
    `;
  }

  /* ========================================================================
     EVENT HANDLERS
     ======================================================================== */
  document.addEventListener('click', async (e) => {
    const target = e.target.closest('[data-action]');
    if (!target) return;

    const action = target.dataset.action;

    if (action === 'toggle-theme') {
      const next = Store.getState().theme === 'dark' ? 'light' : 'dark';
      Store.applyTheme(next);
      render();
      return;
    }

    if (action === 'go') {
      authError = '';
      navigateTo(target.dataset.view);
      return;
    }

    if (action === 'toggle-mobile-nav') {
      mobileSidebarOpen = !mobileSidebarOpen;
      render();
      return;
    }

    if (action === 'close-mobile-nav') {
      mobileSidebarOpen = false;
      render();
      return;
    }

    if (action === 'toggle-login-pass') {
      showLoginPassword = !showLoginPassword;
      const idVal = document.getElementById('login-id')?.value || '';
      const passVal = document.getElementById('login-password')?.value || '';
      render();
      if (document.getElementById('login-id')) document.getElementById('login-id').value = idVal;
      if (document.getElementById('login-password')) document.getElementById('login-password').value = passVal;
      return;
    }

    if (action === 'toggle-reg-pass') {
      showRegisterPassword = !showRegisterPassword;
      render();
      return;
    }

    if (action === 'fill-demo-login') {
      const idEl = document.getElementById('login-id');
      const passEl = document.getElementById('login-password');
      if (idEl && passEl) {
        idEl.value = target.dataset.id;
        passEl.value = target.dataset.pass;
      } else {
        navigateTo('login');
        setTimeout(() => {
          const i2 = document.getElementById('login-id');
          const p2 = document.getElementById('login-password');
          if (i2) i2.value = target.dataset.id;
          if (p2) p2.value = target.dataset.pass;
        }, 30);
      }
      return;
    }

    if (action === 'logout') {
      await Store.logout();
      showToast('Logged out safely.');
      navigateTo('login');
      return;
    }

    if (action === 'scroll-to-donate') {
      if (Store.getState().activeView !== 'dashboard' && Store.getState().activeView !== 'donations') {
        navigateTo('dashboard');
      }
      setTimeout(() => {
        document.getElementById('donate-food-section')?.scrollIntoView({ behavior: 'smooth' });
        document.getElementById('dash-food-name')?.focus();
      }, 60);
      return;
    }

    if (action === 'pick-indian-dish') {
      const input = document.getElementById('dash-food-name');
      const catSelect = document.getElementById('dash-food-cat');
      const dish = target.dataset.dish;
      if (input) {
        input.value = dish;
        input.focus();
      }
      if (catSelect) {
        if (['Samosa'].includes(dish)) catSelect.value = 'Snacks & Street Food';
        else if (['Poha', 'Idli'].includes(dish)) catSelect.value = 'Breakfast';
        else if (['Gulab Jamun', 'Jalebi'].includes(dish)) catSelect.value = 'Sweets & Desserts';
        else catSelect.value = 'Home-Style Meals';
      }
      return;
    }

    if (action === 'clear-donate-photo') {
      donatePhotoDataUrl = '';
      donatePhotoName = '';
      render();
      return;
    }

    if (action === 'set-donation-filter') {
      Store.setField((s) => { s.donationFilter = target.dataset.value; });
      render();
      return;
    }

    if (action === 'set-status-filter') {
      Store.setField((s) => { s.donationStatusFilter = target.dataset.value; });
      render();
      return;
    }

    if (action === 'set-impact-period') {
      Store.setField((s) => { s.impactPeriod = target.dataset.value; });
      render();
      return;
    }

    if (action === 'set-notif-filter') {
      Store.setField((s) => { s.notifFilter = target.dataset.value; });
      render();
      return;
    }

    if (action === 'accept-match' || action === 'decline-match') {
      const id = target.dataset.id;
      const mode = action === 'accept-match' ? 'accept' : 'decline';
      try {
        await Store.respondToMatch(id, mode);
        showToast(mode === 'accept' ? 'Match accepted and pickup scheduled!' : 'Match declined.');
        render();
      } catch (err) {
        showToast(err.message, true);
        render();
      }
      return;
    }

    if (action === 'set-pickup-status') {
      try {
        await Store.updatePickupStatus(target.dataset.id, target.dataset.status);
        showToast(`Pickup updated to "${target.dataset.status}".`);
        render();
      } catch (err) {
        showToast(err.message, true);
      }
      return;
    }

    if (action === 'delete-donation') {
      try {
        await Store.deleteDonation(target.dataset.id);
        showToast('Food donation removed.');
        render();
      } catch (err) {
        showToast(err.message, true);
      }
      return;
    }

    if (action === 'mark-notif-read' || action === 'mark-all-read') {
      try {
        await Store.markNotificationRead(action === 'mark-notif-read' ? target.dataset.id : '');
        if (action === 'mark-all-read') showToast('All notifications marked read.');
        render();
      } catch (err) {
        showToast(err.message, true);
      }
      return;
    }

    if (action === 'export-impact') {
      const state = Store.getState();
      const summary = {
        user: state.user ? state.user.name : 'ShaktiX',
        period: state.impactPeriod,
        metrics: state.impactData[state.impactPeriod],
        exportedAt: new Date().toISOString()
      };
      const blob = new Blob([JSON.stringify(summary, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `replate-impact-${state.impactPeriod}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Impact summary downloaded.');
    }
  });

  document.addEventListener('change', (e) => {
    if (e.target.dataset.action === 'donate-photo-change') {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        donatePhotoDataUrl = String(reader.result || '');
        donatePhotoName = file.name;
        render();
      };
      reader.readAsDataURL(file);
    }
  });

  document.addEventListener('input', (e) => {
    if (e.target.dataset.action === 'search-input') {
      const val = e.target.value;
      const pos = e.target.selectionStart;
      Store.setField((s) => { s.searchQuery = val; });
      render();
      const restored = document.querySelector('[data-action="search-input"]');
      if (restored) {
        restored.focus();
        restored.setSelectionRange(pos, pos);
      }
    }
  });

  document.addEventListener('submit', async (e) => {
    if (e.target.id === 'login-form') {
      e.preventDefault();
      authError = '';
      const fd = new FormData(e.target);
      try {
        const user = await Store.login(String(fd.get('loginId') || '').trim(), String(fd.get('password') || ''));
        showToast(`Welcome, ${user.name}!`);
        navigateTo(user.role === 'admin' ? 'admin' : 'dashboard');
      } catch (err) {
        authError = err.message;
        render();
      }
      return;
    }

    if (e.target.id === 'register-form') {
      e.preventDefault();
      authError = '';
      const fd = new FormData(e.target);
      try {
        const user = await Store.register({
          role: String(fd.get('role') || 'donor'),
          name: String(fd.get('name') || '').trim(),
          orgName: String(fd.get('orgName') || '').trim(),
          loginId: String(fd.get('loginId') || '').trim(),
          password: String(fd.get('password') || ''),
          address: String(fd.get('address') || '').trim()
        });
        showToast(`Account created! Welcome, ${user.name}.`);
        navigateTo('dashboard');
      } catch (err) {
        authError = err.message;
        render();
      }
      return;
    }

    if (e.target.id === 'dashboard-donate-form') {
      e.preventDefault();
      donateSafetyError = '';
      const fd = new FormData(e.target);
      const payload = {
        title: String(fd.get('title') || '').trim(),
        category: String(fd.get('category') || 'Home-Style Meals'),
        quantity: String(fd.get('quantity') || '5 kg').trim(),
        servings: Number(fd.get('servings')) || 15,
        preparedAt: String(fd.get('preparedAt') || ''),
        bestBefore: String(fd.get('bestBefore') || ''),
        pickupAddress: String(fd.get('pickupAddress') || '').trim(),
        notes: String(fd.get('notes') || '').trim(),
        photoDataUrl: donatePhotoDataUrl
      };

      try {
        await Store.createDonation(payload);
        donatePhotoDataUrl = '';
        donatePhotoName = '';
        donateSafetyError = '';
        showToast('Food donated and matched with a nearby NGO!');
        render();
      } catch (err) {
        donateSafetyError = err.message;
        showToast(err.message, true);
        render();
      }
      return;
    }

    if (e.target.id === 'settings-form') {
      e.preventDefault();
      const fd = new FormData(e.target);
      try {
        await Store.saveSettings({
          name: String(fd.get('name') || '').trim(),
          orgName: String(fd.get('orgName') || '').trim(),
          phone: String(fd.get('phone') || '').trim(),
          defaultWindow: String(fd.get('defaultWindow') || '').trim(),
          address: String(fd.get('address') || '').trim(),
          urgentAlerts: fd.get('urgentAlerts') === 'on',
          emailDigest: fd.get('emailDigest') === 'on'
        });
        showToast('Settings saved.');
        render();
      } catch (err) {
        showToast(err.message, true);
      }
    }
  });

  window.addEventListener('hashchange', () => {
    syncFromHash();
    render();
  });

  function render() {
    const state = Store.getState();
    if (state.activeView === 'landing') {
      root.innerHTML = renderLandingPage(state);
    } else if (state.activeView === 'login') {
      root.innerHTML = renderAuthPage(state, 'login');
    } else if (state.activeView === 'register') {
      root.innerHTML = renderAuthPage(state, 'register');
    } else {
      root.innerHTML = renderAppShell(state);
    }
  }

  async function init() {
    syncFromHash();
    await Store.loadPublicSummary();
    await Store.syncWorkspace();
    const s = Store.getState();
    if (!['landing', 'login', 'register'].includes(s.activeView) && !s.user) {
      Store.setField((st) => { st.activeView = 'login'; });
    }
    render();
  }

  init();
})();
