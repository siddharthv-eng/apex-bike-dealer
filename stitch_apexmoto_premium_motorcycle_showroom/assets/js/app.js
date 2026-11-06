/**
 * APEX MOTORRAD // CORE APPLICATION ENGINE
 * High-performance telemetry interface, audio synthesizer, dyno graph, 
 * filter engine, comparison matrix, finance calculator & pass generator.
 */

document.addEventListener('DOMContentLoaded', () => {
  ApexApp.init();
});

const ApexApp = {
  // Application State
  state: {
    currentBrand: 'all',
    currentCategory: 'all',
    currentSort: 'default',
    searchQuery: '',
    compareList: ['panigale-v4r', 'bmw-m1000rr'],
    garageList: JSON.parse(localStorage.getItem('apex_garage') || '[]'),
    activeDynoBike: 'panigale-v4r',
    activeModalBike: null,
    audioPlaying: false,
    audioContext: null,
    activeOscillators: []
  },

  init() {
    this.renderBikes();
    this.updateAllocationCount();
    this.initCompareMatrix();
    this.initDynoGraph();
    this.setupEventListeners();
    this.updateGarageBadge();
    this.initHeroHotspots();
    this.initPresetMatrix();
  },

  // --------------------------------------------------------------------------
  // 1. SHOWROOM RENDERING & FILTERING
  // --------------------------------------------------------------------------
  renderBikes() {
    const grid = document.getElementById('bikeCardsGrid');
    if (!grid) return;

    let bikes = Object.values(window.APEX_BIKES || {});

    // Filter by Brand
    if (this.state.currentBrand !== 'all') {
      bikes = bikes.filter(b => b.brandKey.toLowerCase() === this.state.currentBrand.toLowerCase());
    }

    // Filter by Category
    if (this.state.currentCategory !== 'all') {
      bikes = bikes.filter(b => b.category.toLowerCase() === this.state.currentCategory.toLowerCase());
    }

    // Filter by Search Query
    if (this.state.searchQuery.trim() !== '') {
      const q = this.state.searchQuery.toLowerCase();
      bikes = bikes.filter(b => 
        b.name.toLowerCase().includes(q) ||
        b.brand.toLowerCase().includes(q) ||
        b.engine.toLowerCase().includes(q) ||
        b.categoryLabel.toLowerCase().includes(q)
      );
    }

    // Sorting
    if (this.state.currentSort === 'power-desc') {
      bikes.sort((a, b) => b.powerNum - a.powerNum);
    } else if (this.state.currentSort === 'speed-desc') {
      bikes.sort((a, b) => b.speedNum - a.speedNum);
    } else if (this.state.currentSort === 'price-asc') {
      bikes.sort((a, b) => a.priceNum - b.priceNum);
    } else if (this.state.currentSort === 'price-desc') {
      bikes.sort((a, b) => b.priceNum - a.priceNum);
    } else if (this.state.currentSort === 'weight-asc') {
      bikes.sort((a, b) => a.weightNum - b.weightNum);
    }

    // Handle Empty State
    if (bikes.length === 0) {
      grid.innerHTML = `
        <div class="col-span-full py-16 text-center border border-surface-container-highest bg-surface-container-low p-8">
          <span class="material-symbols-outlined text-4xl text-outline mb-2">speed</span>
          <h3 class="text-headline-md font-headline-md text-on-surface uppercase mb-2">No Matching Allocations</h3>
          <p class="text-body-md text-outline max-w-md mx-auto mb-6">No homologated machines match your active telemetry filters.</p>
          <button class="px-6 py-2.5 bg-secondary-container text-white font-label-md uppercase tracking-wider redline-glow" onclick="ApexApp.resetFilters()">
            RESET TELEMETRY FILTERS
          </button>
        </div>
      `;
      this.updateAllocationCount(0);
      return;
    }

    grid.innerHTML = bikes.map(bike => {
      const isInMatrix = this.state.compareList.includes(bike.id);
      const isSaved = this.state.garageList.includes(bike.id);

      return `
        <div class="bike-card group bg-surface-container-low border border-surface-container-highest hover:border-secondary-container transition-all duration-300 flex flex-col justify-between" data-brand="${bike.brandKey}" data-category="${bike.category}" data-id="${bike.id}">
          <div>
            <!-- Card Header Badges -->
            <div class="p-3 bg-surface-container flex items-center justify-between border-b border-surface-container-highest">
              <span class="inline-flex items-center gap-1.5 text-label-sm font-label-sm ${bike.badgeClass}">
                <span class="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
                ${bike.badge}
              </span>
              <div class="flex items-center gap-2">
                <span class="text-label-sm font-label-sm text-outline">${bike.chassis.split(' - ')[0]}</span>
                <button class="text-outline hover:text-secondary-container transition-colors p-1" title="${isSaved ? 'Remove from Garage' : 'Add to Garage'}" onclick="ApexApp.toggleGarage('${bike.id}', this)">
                  <span class="material-symbols-outlined text-base" style="font-variation-settings: 'FILL' ${isSaved ? 1 : 0}; color: ${isSaved ? '#dc001c' : ''};">
                    favorite
                  </span>
                </button>
              </div>
            </div>

            <!-- Image Stage -->
            <div class="relative overflow-hidden aspect-[16/11] bg-surface-container-lowest cursor-pointer" onclick="ApexApp.openBikeModal('${bike.id}')">
              <img class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                   src="${bike.image}" 
                   alt="${bike.alt}" 
                   loading="lazy" 
                   onerror="this.src='assets/images/hero-crimson-carbon.png';">
              <div class="absolute bottom-2 left-2 px-2 py-0.5 bg-surface-container-lowest/85 text-[10px] font-label-sm text-white border border-surface-container-highest">
                ${bike.engineSnippet}
              </div>
              <div class="absolute top-2 right-2 px-2 py-0.5 bg-surface-container-lowest/85 text-[10px] font-label-sm text-secondary-container border border-surface-container-highest">
                ${bike.categoryLabel}
              </div>
            </div>

            <!-- Card Body -->
            <div class="p-5 space-y-4">
              <div>
                <span class="text-label-sm font-label-sm text-outline uppercase tracking-wider">${bike.brand}</span>
                <h3 class="text-headline-sm font-headline-sm text-on-surface group-hover:text-primary transition-colors cursor-pointer" onclick="ApexApp.openBikeModal('${bike.id}')">
                  ${bike.name}
                </h3>
              </div>

              <!-- Quick Specs Cluster -->
              <div class="grid grid-cols-3 gap-2 py-2 border-y border-surface-container-highest text-center bg-surface-container/50">
                <div>
                  <span class="text-[10px] font-label-sm text-outline block">OUTPUT</span>
                  <span class="text-label-md font-label-md font-bold text-on-surface">${bike.power.split(' @ ')[0]}</span>
                </div>
                <div>
                  <span class="text-[10px] font-label-sm text-outline block">TOP SPEED</span>
                  <span class="text-label-md font-label-md font-bold text-on-surface">${bike.speed}</span>
                </div>
                <div>
                  <span class="text-[10px] font-label-sm text-outline block">DRY WT</span>
                  <span class="text-label-md font-label-md font-bold text-on-surface">${bike.weight}</span>
                </div>
              </div>

              <!-- Price & Acceleration -->
              <div class="flex items-baseline justify-between pt-1">
                <div>
                  <span class="text-label-sm font-label-sm text-outline block">0-100 KM/H</span>
                  <span class="font-metric-display text-sm font-bold text-secondary-container">${bike.accel}</span>
                </div>
                <div class="text-right">
                  <span class="text-label-sm font-label-sm text-outline block">MSRP PRICE</span>
                  <span class="text-title-lg font-metric-display text-primary-fixed font-bold">${bike.price}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Action Buttons Bar -->
          <div class="p-4 pt-0 grid grid-cols-2 gap-2">
            <button class="w-full py-2 bg-surface-container hover:bg-surface-container-high border border-surface-container-highest text-on-surface text-label-sm font-label-sm uppercase transition-all flex items-center justify-center gap-1.5" onclick="ApexApp.openBikeModal('${bike.id}')">
              <span class="material-symbols-outlined text-sm">visibility</span>
              <span>DETAILS</span>
            </button>
            <button class="compare-toggle-btn w-full py-2 ${isInMatrix ? 'bg-secondary-container/15 border border-secondary-container text-secondary-container' : 'bg-surface-container hover:border-secondary-container border border-surface-container-highest text-on-surface'} text-label-sm font-label-sm uppercase transition-all active:scale-[0.98] flex items-center justify-center gap-1" onclick="ApexApp.toggleCompare('${bike.id}', this)">
              <span>${isInMatrix ? 'IN MATRIX ✓' : '+ COMPARE'}</span>
            </button>
          </div>
        </div>
      `;
    }).join('');

    this.updateAllocationCount(bikes.length);
  },

  updateAllocationCount(count) {
    const el = document.getElementById('allocationCounter');
    if (!el) return;
    const finalCount = count !== undefined ? count : Object.keys(window.APEX_BIKES || {}).length;
    el.innerText = `${finalCount} VERIFIED`;
  },

  filterByBrand(brand) {
    this.state.currentBrand = brand;
    document.querySelectorAll('.brand-filter-btn').forEach(btn => {
      const b = btn.getAttribute('data-brand');
      if (b === brand) {
        btn.className = "brand-filter-btn px-4 py-2 bg-secondary-container text-white text-label-sm font-label-sm uppercase tracking-wider transition-all";
      } else {
        btn.className = "brand-filter-btn px-4 py-2 bg-surface-container-low border border-surface-container-highest text-on-surface-variant hover:border-secondary-container text-label-sm font-label-sm uppercase tracking-wider transition-all";
      }
    });
    this.renderBikes();
  },

  filterByCategory(cat) {
    this.state.currentCategory = cat;
    document.querySelectorAll('.category-filter-btn').forEach(btn => {
      const c = btn.getAttribute('data-category');
      if (c === cat) {
        btn.classList.add('bg-secondary-container', 'text-white');
        btn.classList.remove('bg-surface-container-low', 'text-on-surface-variant');
      } else {
        btn.classList.remove('bg-secondary-container', 'text-white');
        btn.classList.add('bg-surface-container-low', 'text-on-surface-variant');
      }
    });
    this.renderBikes();
    const showroom = document.getElementById('showroom');
    if (showroom) showroom.scrollIntoView({ behavior: 'smooth' });
  },

  sortBikes(sortVal) {
    this.state.currentSort = sortVal;
    this.renderBikes();
  },

  resetFilters() {
    this.state.currentBrand = 'all';
    this.state.currentCategory = 'all';
    this.state.currentSort = 'default';
    this.state.searchQuery = '';
    const searchInput = document.getElementById('telemetrySearchInput');
    if (searchInput) searchInput.value = '';
    const sortSelect = document.getElementById('showroomSortSelect');
    if (sortSelect) sortSelect.value = 'default';
    this.filterByBrand('all');
  },

  // --------------------------------------------------------------------------
  // 2. COMPARISON MATRIX ENGINE
  // --------------------------------------------------------------------------
  initCompareMatrix() {
    this.updateMatrixDropdowns();
    this.updateMatrixView();
  },

  updateMatrixDropdowns() {
    const s1 = document.getElementById('matrixBike1Select');
    const s2 = document.getElementById('matrixBike2Select');
    if (!s1 || !s2) return;

    const bikes = Object.values(window.APEX_BIKES || {});
    const optionsHtml = bikes.map(b => `<option value="${b.id}">${b.brand} ${b.name} (${b.power.split(' @ ')[0]})</option>`).join('');

    s1.innerHTML = optionsHtml;
    s2.innerHTML = optionsHtml;

    s1.value = this.state.compareList[0] || 'panigale-v4r';
    s2.value = this.state.compareList[1] || 'bmw-m1000rr';
  },

  toggleCompare(bikeId, btn) {
    const idx = this.state.compareList.indexOf(bikeId);
    if (idx > -1) {
      if (this.state.compareList.length <= 1) {
        this.showToast('Matrix requires at least one active machine.', 'warning');
        return;
      }
      this.state.compareList.splice(idx, 1);
      this.showToast('Removed from telemetry matrix', 'info');
    } else {
      if (this.state.compareList.length >= 2) {
        this.state.compareList[1] = bikeId; // Replace slot 2
      } else {
        this.state.compareList.push(bikeId);
      }
      this.showToast('Allocated to telemetry matrix', 'success');
    }

    this.renderBikes();
    this.updateMatrixDropdowns();
    this.updateMatrixView();
    this.updateCompareBadge();
  },

  updateCompareBadge() {
    const badge = document.getElementById('compareCountBadge');
    if (badge) badge.innerText = this.state.compareList.length;
  },

  selectMatrixBike(slotIndex, bikeId) {
    this.state.compareList[slotIndex] = bikeId;
    this.renderBikes();
    this.updateMatrixView();
    this.updateCompareBadge();
  },

  initPresetMatrix() {
    const preset = document.getElementById('presetCompareSelect');
    if (preset) {
      preset.addEventListener('change', (e) => {
        this.switchPresetMatrix(e.target.value);
      });
    }
  },

  switchPresetMatrix(val) {
    if (val === 'panigale_vs_m1000rr') {
      this.state.compareList = ['panigale-v4r', 'bmw-m1000rr'];
    } else if (val === 'h2_vs_r1m') {
      this.state.compareList = ['ninja-h2', 'yamaha-r1m'];
    } else if (val === 'duke_vs_fireblade') {
      this.state.compareList = ['ktm-superduke', 'honda-fireblade'];
    } else if (val === 'rsv4_vs_panigale') {
      this.state.compareList = ['aprilia-rsv4', 'panigale-v4r'];
    } else if (val === 'rocket_vs_energica') {
      this.state.compareList = ['triumph-rocket3', 'energica-ego'];
    }
    this.updateMatrixDropdowns();
    this.updateMatrixView();
    this.renderBikes();
    this.updateCompareBadge();
  },

  updateMatrixView() {
    if (this.state.compareList.length < 2) return;
    const b1 = window.APEX_BIKES[this.state.compareList[0]] || window.APEX_BIKES['panigale-v4r'];
    const b2 = window.APEX_BIKES[this.state.compareList[1]] || window.APEX_BIKES['bmw-m1000rr'];

    // Headers & Photos
    const name1 = document.getElementById('matrixBike1Name');
    const name2 = document.getElementById('matrixBike2Name');
    if (name1) name1.innerText = (b1.brand + ' ' + b1.name).toUpperCase();
    if (name2) name2.innerText = (b2.brand + ' ' + b2.name).toUpperCase();

    const img1 = document.getElementById('matrixImg1');
    const img2 = document.getElementById('matrixImg2');
    if (img1) img1.src = b1.image;
    if (img2) img2.src = b2.image;

    // Prices
    const p1 = document.getElementById('mPrice1');
    const p2 = document.getElementById('mPrice2');
    if (p1) p1.innerHTML = `${b1.price} <span class="text-xs text-outline font-normal">USD</span>`;
    if (p2) p2.innerHTML = `${b2.price} <span class="text-xs text-outline font-normal">USD</span>`;

    // Engine
    const e1 = document.getElementById('mEngine1');
    const e2 = document.getElementById('mEngine2');
    if (e1) e1.innerText = b1.engine;
    if (e2) e2.innerText = b2.engine;

    // Power Comparison & Delta Bars
    const maxHp = Math.max(b1.powerNum, b2.powerNum);
    const hpPct1 = Math.round((b1.powerNum / 240) * 100);
    const hpPct2 = Math.round((b2.powerNum / 240) * 100);
    const power1El = document.getElementById('mPower1');
    const power2El = document.getElementById('mPower2');

    if (power1El) {
      power1El.innerHTML = `
        <div class="flex items-center justify-between mb-1">
          <span class="font-metric-display text-headline-sm ${b1.powerNum >= b2.powerNum ? 'text-secondary-container' : 'text-on-surface'} font-bold">
            ${b1.powerNum} HP ${b1.powerNum > b2.powerNum ? '★' : ''}
          </span>
          <span class="text-xs text-outline">${b1.power.split('@')[1] || ''}</span>
        </div>
        <div class="w-full bg-surface-container-highest h-2">
          <div class="bg-secondary-container h-2" style="width: ${hpPct1}%;"></div>
        </div>
      `;
    }

    if (power2El) {
      power2El.innerHTML = `
        <div class="flex items-center justify-between mb-1">
          <span class="font-metric-display text-headline-sm ${b2.powerNum >= b1.powerNum ? 'text-secondary-container' : 'text-on-surface'} font-bold">
            ${b2.powerNum} HP ${b2.powerNum > b1.powerNum ? '★' : ''}
          </span>
          <span class="text-xs text-outline">${b2.power.split('@')[1] || ''}</span>
        </div>
        <div class="w-full bg-surface-container-highest h-2">
          <div class="bg-tertiary-fixed h-2" style="width: ${hpPct2}%;"></div>
        </div>
      `;
    }

    // Torque
    const t1 = document.getElementById('mTorque1');
    const t2 = document.getElementById('mTorque2');
    if (t1) t1.innerHTML = `<span class="${b1.torqueNum >= b2.torqueNum ? 'text-secondary-container font-bold' : ''}">${b1.torque}</span>`;
    if (t2) t2.innerHTML = `<span class="${b2.torqueNum >= b1.torqueNum ? 'text-secondary-container font-bold' : ''}">${b2.torque}</span>`;

    // Weight (lower is better!)
    const w1 = document.getElementById('mWeight1');
    const w2 = document.getElementById('mWeight2');
    if (w1) w1.innerHTML = `<span class="${b1.weightNum <= b2.weightNum ? 'text-secondary-container font-bold' : ''}">${b1.weight} (Dry)</span>`;
    if (w2) w2.innerHTML = `<span class="${b2.weightNum <= b1.weightNum ? 'text-secondary-container font-bold' : ''}">${b2.weight} (Dry)</span>`;

    // Speed
    const s1 = document.getElementById('mSpeed1');
    const s2 = document.getElementById('mSpeed2');
    if (s1) s1.innerHTML = `<span class="${b1.speedNum >= b2.speedNum ? 'text-secondary-container font-bold' : ''}">${b1.speed}</span>`;
    if (s2) s2.innerHTML = `<span class="${b2.speedNum >= b1.speedNum ? 'text-secondary-container font-bold' : ''}">${b2.speed}</span>`;

    // Power to Weight Ratio
    const ptw1 = document.getElementById('mPtw1');
    const ptw2 = document.getElementById('mPtw2');
    if (ptw1) ptw1.innerText = b1.powerToWeight;
    if (ptw2) ptw2.innerText = b2.powerToWeight;

    // Acceleration 0-100
    const acc1 = document.getElementById('mAccel1');
    const acc2 = document.getElementById('mAccel2');
    if (acc1) acc1.innerHTML = `<span class="${b1.accelNum <= b2.accelNum ? 'text-secondary-container font-bold' : ''}">${b1.accel}</span>`;
    if (acc2) acc2.innerHTML = `<span class="${b2.accelNum <= b1.accelNum ? 'text-secondary-container font-bold' : ''}">${b2.accel}</span>`;

    // Tech Suite
    const tech1 = document.getElementById('mTech1');
    const tech2 = document.getElementById('mTech2');
    if (tech1) tech1.innerText = b1.tech;
    if (tech2) tech2.innerText = b2.tech;
  },

  // --------------------------------------------------------------------------
  // 3. INTERACTIVE DYNO TELEMETRY GRAPH (HTML5 CANVAS)
  // --------------------------------------------------------------------------
  initDynoGraph() {
    const canvas = document.getElementById('dynoCanvas');
    if (!canvas) return;

    this.drawDynoGraph(this.state.activeDynoBike);

    // Dyno Selector
    const select = document.getElementById('dynoBikeSelect');
    if (select) {
      const bikes = Object.values(window.APEX_BIKES || {});
      select.innerHTML = bikes.map(b => `<option value="${b.id}">${b.brand} ${b.name}</option>`).join('');
      select.value = this.state.activeDynoBike;
      select.addEventListener('change', (e) => {
        this.state.activeDynoBike = e.target.value;
        this.drawDynoGraph(e.target.value);
      });
    }

    // Responsive redraw
    window.addEventListener('resize', () => {
      this.drawDynoGraph(this.state.activeDynoBike);
    });
  },

  drawDynoGraph(bikeId) {
    const canvas = document.getElementById('dynoCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const bike = window.APEX_BIKES[bikeId] || window.APEX_BIKES['panigale-v4r'];

    // Resize canvas based on client rect
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = (rect.height || 280) * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const w = rect.width;
    const h = rect.height || 280;
    const padX = 50;
    const padY = 40;

    // Clear background
    ctx.fillStyle = '#141418';
    ctx.fillRect(0, 0, w, h);

    // Draw Grid Lines
    ctx.strokeStyle = '#2e2e38';
    ctx.lineWidth = 1;

    for (let y = padY; y <= h - padY; y += (h - padY * 2) / 4) {
      ctx.beginPath();
      ctx.moveTo(padX, y);
      ctx.lineTo(w - padX, y);
      ctx.stroke();
    }

    for (let x = padX; x <= w - padX; x += (w - padX * 2) / 6) {
      ctx.beginPath();
      ctx.moveTo(x, padY);
      ctx.lineTo(x, h - padY);
      ctx.stroke();
    }

    // Labels
    ctx.fillStyle = '#71717a';
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillText('240 HP', 8, padY + 4);
    ctx.fillText('120 HP', 8, h / 2);
    ctx.fillText('0 HP', 18, h - padY);

    const maxRpm = bike.dyno.rpm[bike.dyno.rpm.length - 1];
    ctx.fillText('RPM x1000', w / 2 - 24, h - 8);

    // Draw Horsepower Curve (Crimson Red)
    const pointsHp = bike.dyno.rpm.map((r, i) => {
      const px = padX + (r / maxRpm) * (w - padX * 2);
      const py = (h - padY) - (bike.dyno.hp[i] / 240) * (h - padY * 2);
      return { x: px, y: py, val: bike.dyno.hp[i], rpm: r };
    });

    // Gradient fill under HP curve
    const hpGrad = ctx.createLinearGradient(0, padY, 0, h - padY);
    hpGrad.addColorStop(0, 'rgba(255, 26, 53, 0.35)');
    hpGrad.addColorStop(1, 'rgba(255, 26, 53, 0.0)');

    ctx.beginPath();
    ctx.moveTo(pointsHp[0].x, h - padY);
    pointsHp.forEach((p, idx) => {
      if (idx === 0) ctx.lineTo(p.x, p.y);
      else {
        const prev = pointsHp[idx - 1];
        const cpX = (prev.x + p.x) / 2;
        ctx.bezierCurveTo(cpX, prev.y, cpX, p.y, p.x, p.y);
      }
    });
    ctx.lineTo(pointsHp[pointsHp.length - 1].x, h - padY);
    ctx.closePath();
    ctx.fillStyle = hpGrad;
    ctx.fill();

    // HP Stroke
    ctx.beginPath();
    pointsHp.forEach((p, idx) => {
      if (idx === 0) ctx.moveTo(p.x, p.y);
      else {
        const prev = pointsHp[idx - 1];
        const cpX = (prev.x + p.x) / 2;
        ctx.bezierCurveTo(cpX, prev.y, cpX, p.y, p.x, p.y);
      }
    });
    ctx.strokeStyle = '#ff1a35';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Peak Point Highlight
    const peakHp = pointsHp.reduce((max, p) => p.val > max.val ? p : max, pointsHp[0]);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(peakHp.x, peakHp.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ff1a35';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Peak Label
    ctx.fillStyle = '#ff1a35';
    ctx.font = 'bold 11px "JetBrains Mono", monospace';
    ctx.fillText(`${peakHp.val} HP @ ${peakHp.rpm} RPM`, peakHp.x - 60, peakHp.y - 12);

    // Update Dyno Stat Readouts
    const hpEl = document.getElementById('dynoPeakHp');
    const tqEl = document.getElementById('dynoPeakTq');
    const redlineEl = document.getElementById('dynoRedline');
    if (hpEl) hpEl.innerText = bike.power;
    if (tqEl) tqEl.innerText = bike.torque;
    if (redlineEl) redlineEl.innerText = `${maxRpm} RPM`;
  },

  // --------------------------------------------------------------------------
  // 4. ACOUSTIC ENGINE EXHAUST NOTE SYNTHESIZER (WEB AUDIO API)
  // --------------------------------------------------------------------------
  toggleAudioTelemetry() {
    const icon = document.getElementById('soundIcon');
    const label = document.getElementById('soundLabel');
    const btn = document.getElementById('exhaustSoundBtn');

    if (this.state.audioPlaying) {
      this.stopAudio();
      return;
    }

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.state.audioContext = new AudioCtx();
      const ctx = this.state.audioContext;

      // Desmodromic V4 harmonic generator
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const osc3 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'triangle';
      osc3.type = 'sawtooth';

      const now = ctx.currentTime;

      // Dynamic RPM rev sweep from 1,800 idle to 15,500 redline burst
      osc1.frequency.setValueAtTime(70, now);
      osc1.frequency.exponentialRampToValueAtTime(360, now + 1.2);
      osc1.frequency.exponentialRampToValueAtTime(110, now + 2.5);

      osc2.frequency.setValueAtTime(140, now);
      osc2.frequency.exponentialRampToValueAtTime(720, now + 1.2);
      osc2.frequency.exponentialRampToValueAtTime(220, now + 2.5);

      osc3.frequency.setValueAtTime(280, now);
      osc3.frequency.exponentialRampToValueAtTime(1440, now + 1.2);
      osc3.frequency.exponentialRampToValueAtTime(440, now + 2.5);

      // Volume envelope
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.28, now + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 2.6);

      osc1.connect(gain);
      osc2.connect(gain);
      osc3.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc3.start();

      osc1.stop(now + 2.7);
      osc2.stop(now + 2.7);
      osc3.stop(now + 2.7);

      this.state.audioPlaying = true;
      if (icon) icon.innerText = 'graphic_eq';
      if (label) label.innerText = 'REVVING DESMO V4 (15,500 RPM)...';
      if (btn) btn.classList.add('border-secondary-container', 'text-secondary-container', 'redline-glow');

      setTimeout(() => {
        this.stopAudio();
      }, 2700);

    } catch (err) {
      console.warn('Audio telemetry notice:', err);
      this.showToast('Audio API available on user interaction.', 'info');
    }
  },

  stopAudio() {
    this.state.audioPlaying = false;
    const icon = document.getElementById('soundIcon');
    const label = document.getElementById('soundLabel');
    const btn = document.getElementById('exhaustSoundBtn');
    if (icon) icon.innerText = 'volume_up';
    if (label) label.innerText = 'DISCOVER ACOUSTIC NOTE';
    if (btn) btn.classList.remove('border-secondary-container', 'text-secondary-container', 'redline-glow');
  },

  // --------------------------------------------------------------------------
  // 5. BIKE SPECIFICATION MODAL DRAWER
  // --------------------------------------------------------------------------
  openBikeModal(bikeId) {
    const bike = window.APEX_BIKES[bikeId];
    if (!bike) return;

    this.state.activeModalBike = bike;

    document.getElementById('modalBikeBrand').innerText = bike.brand.toUpperCase();
    document.getElementById('modalChassisTag').innerText = bike.chassis;
    document.getElementById('modalBikeTitle').innerText = bike.name;
    document.getElementById('modalPriceTag').innerText = bike.price;
    document.getElementById('modalEngineCC').innerText = bike.engine;
    document.getElementById('modalTechDesc').innerText = bike.tech;
    document.getElementById('modalBikeImg').src = bike.image;

    // Detailed Engine Table
    const boreEl = document.getElementById('modalBoreStroke');
    if (boreEl) boreEl.innerText = bike.boreStroke;
    const compEl = document.getElementById('modalCompression');
    if (compEl) compEl.innerText = bike.compression;
    const gearEl = document.getElementById('modalGearbox');
    if (gearEl) gearEl.innerText = bike.gearbox;
    const tankEl = document.getElementById('modalTank');
    if (tankEl) tankEl.innerText = bike.tank;
    const seatEl = document.getElementById('modalSeatHeight');
    if (seatEl) seatEl.innerText = bike.seatHeight;
    const powerEl = document.getElementById('modalMaxPower');
    if (powerEl) powerEl.innerText = bike.power;

    // Colorways
    const colorContainer = document.getElementById('modalColorways');
    if (colorContainer) {
      colorContainer.innerHTML = bike.colors.map((c, i) => `
        <button class="flex items-center gap-1.5 px-2.5 py-1.5 bg-surface-container-low border ${i === 0 ? 'border-secondary-container text-white' : 'border-surface-container-highest text-outline'} text-label-sm font-label-sm hover:text-white transition-all" onclick="ApexApp.selectModalColor(this, '${c.name}')">
          <span class="w-3 h-3 rounded-full" style="background-color: ${c.hex};"></span>
          <span>${c.name}</span>
        </button>
      `).join('');
    }

    document.getElementById('bikeDetailsModal').classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
  },

  selectModalColor(btn, colorName) {
    const parent = btn.parentElement;
    parent.querySelectorAll('button').forEach(b => {
      b.className = 'flex items-center gap-1.5 px-2.5 py-1.5 bg-surface-container-low border border-surface-container-highest text-outline text-label-sm font-label-sm hover:text-white transition-all';
    });
    btn.className = 'flex items-center gap-1.5 px-2.5 py-1.5 bg-surface-container-low border border-secondary-container text-white text-label-sm font-label-sm transition-all';
    this.showToast(`Selected Colorway: ${colorName}`, 'info');
  },

  closeBikeModal() {
    const m = document.getElementById('bikeDetailsModal');
    if (m) m.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
  },

  // --------------------------------------------------------------------------
  // 6. FINANCING CALCULATOR
  // --------------------------------------------------------------------------
  openFinanceModal(bikeId) {
    const id = bikeId || (this.state.activeModalBike ? this.state.activeModalBike.id : 'panigale-v4r');
    const bike = window.APEX_BIKES[id];
    if (!bike) return;

    this.closeBikeModal();
    const modal = document.getElementById('financeModal');
    if (!modal) return;

    const select = document.getElementById('financeBikeSelect');
    if (select) {
      const bikes = Object.values(window.APEX_BIKES || {});
      select.innerHTML = bikes.map(b => `<option value="${b.id}">${b.brand} ${b.name} (${b.price})</option>`).join('');
      select.value = id;
    }

    document.getElementById('financePrice').value = bike.priceNum;
    this.calculateFinance();

    modal.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
  },

  closeFinanceModal() {
    const modal = document.getElementById('financeModal');
    if (modal) modal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
  },

  calculateFinance() {
    const select = document.getElementById('financeBikeSelect');
    const bikeId = select ? select.value : 'panigale-v4r';
    const bike = window.APEX_BIKES[bikeId] || window.APEX_BIKES['panigale-v4r'];

    const price = bike.priceNum;
    const downPayment = parseFloat(document.getElementById('financeDown').value) || Math.round(price * 0.15);
    const months = parseInt(document.getElementById('financeTerm').value) || 36;
    const apr = parseFloat(document.getElementById('financeApr').value) || 4.9;
    const includeWarranty = document.getElementById('financeWarranty')?.checked;

    const principal = Math.max(0, price - downPayment);
    const monthlyRate = (apr / 100) / 12;

    let monthly = 0;
    if (monthlyRate === 0) {
      monthly = principal / months;
    } else {
      monthly = (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
    }

    if (includeWarranty) monthly += 89;

    const totalCost = (monthly * months) + downPayment;
    const totalInterest = Math.max(0, totalCost - price - (includeWarranty ? 89 * months : 0));

    document.getElementById('financeMonthlyPayment').innerText = `$${Math.round(monthly).toLocaleString()}`;
    document.getElementById('financeTotalInterest').innerText = `$${Math.round(totalInterest).toLocaleString()}`;
    document.getElementById('financeTotalOutlay').innerText = `$${Math.round(totalCost).toLocaleString()}`;
  },

  // --------------------------------------------------------------------------
  // 7. BOOK TEST RIDE & DIGITAL TRACK PASS GENERATOR
  // --------------------------------------------------------------------------
  openTestRideModal(presetBikeId) {
    this.closeBikeModal();
    const modal = document.getElementById('testRideModal');
    if (!modal) return;

    const select = document.getElementById('testRideMachineSelect');
    if (select) {
      const bikes = Object.values(window.APEX_BIKES || {});
      select.innerHTML = bikes.map(b => `<option value="${b.id}">${b.brand} ${b.name} (${b.engineSnippet})</option>`).join('');
      if (presetBikeId) select.value = presetBikeId;
      else if (this.state.activeModalBike) select.value = this.state.activeModalBike.id;
    }

    // Set minimum date to tomorrow
    const dateInput = document.getElementById('testRideDate');
    if (dateInput) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      dateInput.min = tomorrow.toISOString().split('T')[0];
      dateInput.value = tomorrow.toISOString().split('T')[0];
    }

    modal.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
  },

  closeTestRideModal() {
    const modal = document.getElementById('testRideModal');
    if (modal) modal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
  },

  handleTestRideSubmit(e) {
    e.preventDefault();
    const machineId = document.getElementById('testRideMachineSelect').value;
    const bike = window.APEX_BIKES[machineId] || window.APEX_BIKES['panigale-v4r'];
    const name = document.getElementById('testRideRiderName').value || 'Homologation Pilot';
    const venue = document.getElementById('testRideVenueSelect').value;
    const date = document.getElementById('testRideDate').value;
    const passCode = `APEX-${Math.floor(1000 + Math.random() * 9000)}-${bike.chassis.split('#')[1]?.slice(0, 3) || '99'}`;

    this.closeTestRideModal();

    // Show Digital Pass Modal
    const passModal = document.getElementById('digitalPassModal');
    if (passModal) {
      document.getElementById('passPilotName').innerText = name.toUpperCase();
      document.getElementById('passMachineName').innerText = `${bike.brand} ${bike.name}`.toUpperCase();
      document.getElementById('passVenue').innerText = venue.toUpperCase();
      document.getElementById('passDate').innerText = date;
      document.getElementById('passCodeDisplay').innerText = passCode;
      document.getElementById('passChassisDisplay').innerText = bike.chassis;

      passModal.classList.remove('hidden');
      document.body.classList.add('overflow-hidden');
    } else {
      this.showToast(`CIRCUIT PASS ALLOCATED: ${passCode}`, 'success');
    }
  },

  closeDigitalPassModal() {
    const modal = document.getElementById('digitalPassModal');
    if (modal) modal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
  },

  // --------------------------------------------------------------------------
  // 8. GARAGE / SHORTLIST
  // --------------------------------------------------------------------------
  toggleGarage(bikeId, btn) {
    const idx = this.state.garageList.indexOf(bikeId);
    if (idx > -1) {
      this.state.garageList.splice(idx, 1);
      this.showToast('Removed from Apex Paddock Garage', 'info');
    } else {
      this.state.garageList.push(bikeId);
      this.showToast('Saved to Apex Paddock Garage', 'success');
    }
    localStorage.setItem('apex_garage', JSON.stringify(this.state.garageList));
    this.updateGarageBadge();
    this.renderBikes();
  },

  updateGarageBadge() {
    const badge = document.getElementById('garageCountBadge');
    if (badge) badge.innerText = this.state.garageList.length;
  },

  openGarageDrawer() {
    const drawer = document.getElementById('garageDrawer');
    if (!drawer) return;

    const listContainer = document.getElementById('garageItemsList');
    if (this.state.garageList.length === 0) {
      listContainer.innerHTML = `
        <div class="py-12 text-center text-outline">
          <span class="material-symbols-outlined text-3xl mb-2">garage</span>
          <p class="text-body-sm uppercase">Your Paddock Garage is Empty</p>
          <p class="text-[11px] text-outline mt-1">Click the heart icon on any superbike to curate your telemetry dream stable.</p>
        </div>
      `;
    } else {
      const bikes = this.state.garageList.map(id => window.APEX_BIKES[id]).filter(Boolean);
      listContainer.innerHTML = bikes.map(b => `
        <div class="flex items-center gap-3 p-3 bg-surface-container border border-surface-container-highest">
          <img src="${b.image}" class="w-16 h-12 object-cover border border-surface-container-highest" alt="${b.name}">
          <div class="flex-1 min-w-0">
            <span class="text-[10px] text-outline uppercase block">${b.brand}</span>
            <h4 class="text-label-md text-on-surface truncate font-bold">${b.name}</h4>
            <span class="text-label-sm text-primary-fixed">${b.price}</span>
          </div>
          <button class="text-outline hover:text-white p-1" onclick="ApexApp.toggleGarage('${b.id}')">
            <span class="material-symbols-outlined text-sm">delete</span>
          </button>
        </div>
      `).join('');
    }

    drawer.classList.remove('hidden');
  },

  closeGarageDrawer() {
    const drawer = document.getElementById('garageDrawer');
    if (drawer) drawer.classList.add('hidden');
  },

  // --------------------------------------------------------------------------
  // 9. HERO HOTSPOTS & RETICLES
  // --------------------------------------------------------------------------
  initHeroHotspots() {
    const hotspots = [
      { id: 'hotspot1', title: 'Carbon Aero Biplane Winglets', desc: 'Generates 30 kg aerodynamic downforce at 270 km/h, preventing front-end lift.' },
      { id: 'hotspot2', title: 'Brembo Stylema Calipers', desc: 'Twin 330mm discs with race-grade fluid friction and Bosch 9.1 EVO cornering ABS.' },
      { id: 'hotspot3', title: 'Öhlins Smart EC 2.0', desc: 'Electronic pressurized gas forks with real-time dynamic damping adjustments.' },
      { id: 'hotspot4', title: 'Akrapovič Titanium Exhaust', desc: 'Full racing system shaving 6 kg dry weight while boosting power to 218 HP.' }
    ];

    hotspots.forEach(h => {
      const el = document.getElementById(h.id);
      if (el) {
        el.addEventListener('click', () => {
          this.showToast(`[TELEMETRY] ${h.title}: ${h.desc}`, 'info');
        });
      }
    });
  },

  // --------------------------------------------------------------------------
  // 10. TOAST NOTIFICATION SYSTEM
  // --------------------------------------------------------------------------
  showToast(message, type = 'info') {
    let toast = document.getElementById('apexToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'apexToast';
      toast.className = 'fixed bottom-6 right-6 z-50 px-5 py-3.5 bg-surface-container-low border border-surface-container-highest text-label-md font-label-md text-on-surface flex items-center gap-3 shadow-2xl transition-all duration-300 opacity-0 transform translate-y-4';
      document.body.appendChild(toast);
    }

    const icon = type === 'success' ? 'check_circle' : type === 'warning' ? 'warning' : 'info';
    const color = type === 'success' ? 'text-secondary-container' : type === 'warning' ? 'text-primary-container' : 'text-primary-fixed';

    toast.innerHTML = `
      <span class="material-symbols-outlined ${color} text-lg">${icon}</span>
      <span>${message}</span>
    `;

    toast.classList.remove('opacity-0', 'translate-y-4');
    toast.classList.add('opacity-100', 'translate-y-0');

    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      toast.classList.remove('opacity-100', 'translate-y-0');
      toast.classList.add('opacity-0', 'translate-y-4');
    }, 3800);
  },

  // --------------------------------------------------------------------------
  // 11. EVENT LISTENERS
  // --------------------------------------------------------------------------
  setupEventListeners() {
    // Quick search bar input
    const search = document.getElementById('telemetrySearchInput');
    if (search) {
      search.addEventListener('input', (e) => {
        this.state.searchQuery = e.target.value;
        this.renderBikes();
      });
    }

    // Showroom sort selector
    const sortSelect = document.getElementById('showroomSortSelect');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.sortBikes(e.target.value);
      });
    }

    // Keyboard shortcut '/' to focus search
    window.addEventListener('keydown', (e) => {
      if (e.key === '/' && document.activeElement !== search) {
        e.preventDefault();
        if (search) {
          search.focus();
          search.scrollIntoView({ behavior: 'smooth' });
        }
      }
      if (e.key === 'Escape') {
        this.closeBikeModal();
        this.closeTestRideModal();
        this.closeFinanceModal();
        this.closeDigitalPassModal();
        this.closeGarageDrawer();
      }
    });

    // Mobile nav toggle
    const mobileBtn = document.getElementById('mobileMenuBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    if (mobileBtn && mobileMenu) {
      mobileBtn.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
      });
    }

    // Compare Tray button triggers scroll to Matrix
    const compareTray = document.getElementById('compareTrayBtn');
    if (compareTray) {
      compareTray.addEventListener('click', () => {
        const matrixEl = document.getElementById('matrix');
        if (matrixEl) matrixEl.scrollIntoView({ behavior: 'smooth' });
      });
    }
  }
};

window.ApexApp = ApexApp;
