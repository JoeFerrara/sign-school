/* Main application — view switching, gallery, learn detail, simulator wiring. */
(function () {
  let currentMode = 'browse';
  let currentSignId = null;
  let currentFilter = 'all';
  let currentSearch = '';
  let currentSimSignId = 'stop';

  function $(sel) { return document.querySelector(sel); }
  function $$(sel) { return Array.from(document.querySelectorAll(sel)); }

  // ---------- Mode switching ----------
  function setMode(mode) {
    currentMode = mode;
    $$('.mode-btn').forEach(btn => {
      const active = btn.dataset.mode === mode;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    $$('.view').forEach(v => v.classList.remove('active'));
    $(`#view-${mode}`).classList.add('active');
    if (mode === 'simulate') ensureSimReady();
  }

  // ---------- Browse ----------
  function renderGallery() {
    const gallery = $('#gallery');
    gallery.innerHTML = '';
    const q = currentSearch.toLowerCase().trim();
    const items = SIGNS.filter(s => {
      if (currentFilter !== 'all' && s.category !== currentFilter) return false;
      if (q && !s.name.toLowerCase().includes(q) && !s.meaning.toLowerCase().includes(q)) return false;
      return true;
    });
    if (items.length === 0) {
      gallery.innerHTML = '<p class="muted" style="padding:20px;">No signs match your search.</p>';
      return;
    }
    for (const s of items) {
      const card = document.createElement('div');
      card.className = 'sign-card';
      card.innerHTML = `
        <div class="sign-svg">${s.render()}</div>
        <div class="sign-name">${s.name}</div>
        <div class="sign-cat">${s.category}</div>
      `;
      card.addEventListener('click', () => openLearn(s.id));
      gallery.appendChild(card);
    }
  }

  function setupBrowse() {
    $$('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        $$('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.cat;
        renderGallery();
      });
    });
    $('#search').addEventListener('input', (e) => {
      currentSearch = e.target.value;
      renderGallery();
    });
  }

  // ---------- Learn ----------
  function openLearn(signId) {
    currentSignId = signId;
    const sign = findSign(signId);
    if (!sign) return;
    $('#learn-empty').classList.add('hidden');
    $('#learn-content').classList.remove('hidden');
    $('#learn-sign-art').innerHTML = sign.render();
    $('#learn-name').textContent = sign.name;
    const cat = $('#learn-category');
    cat.textContent = sign.category;
    cat.className = `cat-pill ${sign.category}`;
    $('#learn-meaning').textContent = sign.meaning;
    $('#learn-where').textContent = sign.where;
    fillList('#learn-expected', sign.expected);
    fillList('#learn-mistakes', sign.mistakes);
    $('#learn-design').textContent = sign.design;
    setMode('learn');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function fillList(sel, items) {
    const el = $(sel);
    el.innerHTML = '';
    for (const t of items) {
      const li = document.createElement('li');
      li.textContent = t;
      el.appendChild(li);
    }
  }

  function setupLearn() {
    $$('a[data-go]').forEach(a => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        setMode(a.dataset.go);
      });
    });
    $('#learn-simulate').addEventListener('click', () => {
      const sign = findSign(currentSignId);
      if (sign && sign.scenario) {
        currentSimSignId = sign.id;
        $('#sim-sign-select').value = sign.id;
        updateSimPreview();
        setMode('simulate');
      } else {
        setMode('simulate');
      }
    });
  }

  // ---------- Simulate ----------
  let simInited = false;
  function ensureSimReady() {
    if (simInited) return;
    simInited = true;
    const canvas = $('#sim-canvas');
    Sim.init(canvas);
    const select = $('#sim-sign-select');
    // group options by category
    const cats = ['regulatory', 'warning', 'school', 'construction', 'guide'];
    for (const cat of cats) {
      const group = document.createElement('optgroup');
      group.label = cat.charAt(0).toUpperCase() + cat.slice(1);
      for (const s of SIGNS.filter(x => x.category === cat)) {
        const opt = document.createElement('option');
        opt.value = s.id;
        opt.textContent = s.name;
        group.appendChild(opt);
      }
      select.appendChild(group);
    }
    select.value = currentSimSignId;
    select.addEventListener('change', (e) => {
      currentSimSignId = e.target.value;
      updateSimPreview();
      Sim.reset();
      $('#sim-outcome').textContent = '';
      $('#sim-outcome').className = 'sim-outcome';
      $('#sim-reset').classList.add('hidden');
    });
    $('#sim-comply').addEventListener('click', () => runSim('comply'));
    $('#sim-ignore').addEventListener('click', () => runSim('ignore'));
    $('#sim-reset').addEventListener('click', () => {
      Sim.reset();
      $('#sim-outcome').textContent = '';
      $('#sim-outcome').className = 'sim-outcome';
      $('#sim-reset').classList.add('hidden');
      enableActionButtons(true);
    });
    updateSimPreview();
  }

  function updateSimPreview() {
    const sign = findSign(currentSimSignId);
    if (!sign) return;
    $('#sim-sign-preview').innerHTML = sign.render();
    const sc = SCENARIOS[sign.scenario];
    $('#sim-scenario-desc').textContent = sc ? sc.description : '';
  }

  function runSim(action) {
    const sign = findSign(currentSimSignId);
    if (!sign || !sign.scenario) return;
    enableActionButtons(false);
    $('#sim-outcome').textContent = '';
    $('#sim-outcome').className = 'sim-outcome';
    $('#sim-reset').classList.add('hidden');
    Sim.start(sign.scenario, action, {
      onEnd: (outcome) => {
        const out = $('#sim-outcome');
        if (!outcome) return;
        const cls = outcome.type === 'good' ? 'ok' : outcome.type === 'bad' ? 'bad' : 'warn';
        out.className = 'sim-outcome ' + cls;
        out.innerHTML = `<strong>${outcome.title}</strong><br><span style="font-size:13px;">${outcome.detail}</span>`;
        $('#sim-reset').classList.remove('hidden');
      },
    });
  }

  function enableActionButtons(enabled) {
    $('#sim-comply').disabled = !enabled;
    $('#sim-ignore').disabled = !enabled;
  }

  // ---------- Top-level mode tabs ----------
  function setupModes() {
    $$('.mode-btn').forEach(btn => {
      btn.addEventListener('click', () => setMode(btn.dataset.mode));
    });
  }

  // ---------- Init ----------
  function init() {
    setupModes();
    setupBrowse();
    setupLearn();
    renderGallery();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
