const SYSTEMS = [
  { id: 'RC', label: '타일부착형 단열재 (철근콘크리트)', description: 'RC 후부착 시스템' },
  { id: 'LGS', label: '타일부착형 단열재 (경량철골조)', description: '트랙식 경량철골조' },
  { id: 'WOOD', label: '타일부착형 단열재 (목조)', description: '트랙식 목조' },
  { id: 'FORM', label: '패턴거푸집', description: '패턴 거푸집 시스템' }
];

const defaultPriceConfiguration = {
  rcThicknessPrices: {
    100: 16000, 120: 18700, 125: 19300, 130: 19700, 135: 19900,
    150: 22400, 155: 23200, 160: 24000, 170: 24800, 180: 26000,
    190: 27400, 200: 28800, 220: 31700, 240: 34600, 250: 36100, 300: 43300
  },
  trackThicknessPrices: {
    100: 16000, 120: 18700, 125: 19300, 130: 19700, 135: 19900,
    150: 22400, 155: 23200, 160: 24000, 170: 24800, 180: 26000,
    190: 27400, 200: 28800, 220: 31700, 240: 34600, 250: 36100, 300: 43300
  },
  formThicknessPrices: {
    60: 17600, 65: 18700, 70: 19800, 80: 22000, 90: 24200,
    100: 26400, 110: 28600, 120: 30800, 130: 32000, 140: 34000,
    150: 36300, 160: 37500, 180: 38500
  },
  materialPrices: {
    'Terra Flex 20kg': 21000,
    '메지 시멘트': 6500,
    '접착 몰탈': 35000,
    '단열재 부착용 폼본드': 6500,
    '드릴비트': 5000,
    '디스크 앙카': 400,
    '디스크 앙카 120mm': 400,
    '디스크 앙카 150mm': 450,
    '디스크 앙카 200mm': 500,
    '디스크 앙카 250mm': 550,
    '알루미늄 트랙': 1000,
    '철판피스': 40,
    '델타피스': 40,
    '벽돌타일 (로스율 10%)': 18000,
    '롱브릭 코너타일': 1200,
    '브릭코 코너타일': 1200,
    '박리제': 55000
  },
  laborRates: {
    '단열재 노무비': 23000,
    '타일 노무비': 23000,
    '메지 시공비': 10000,
    '단열재 노무비(리모델링)': 25000,
    '패턴거푸집 시공비': 12000
  }
};

const VAT_RATE = 0.1;

const RC_UNIT_MAP = {
  '단열재 (로스율 8%)': '㎡',
  '단열재 (로스율 8%) - 준불연': '㎡',
  '디스크 앙카': 'set',
  '접착 몰탈': '통',
  '단열재 부착용 폼본드': 'ea',
  '드릴비트': 'ea',
  'Terra Flex 20kg': '포',
  '벽돌타일 (로스율 10%)': '㎡',
  '메지 시멘트': '포',
  '단열재 노무비': '㎡',
  '타일 노무비': '㎡',
  '메지 시공비': '㎡',
  '롱브릭 코너타일': '장',
  '브릭코 코너타일': '장'
};

const TRACK_UNIT_MAP = {
  '단열재': '㎡',
  '단열재 (로스율 8%) - 준불연': '㎡',
  '알루미늄 트랙': 'ea',
  '디스크 앙카': 'set',
  '철판피스': 'ea',
  '델타피스': 'ea',
  '단열재 부착용 폼본드': 'ea',
  'Terra Flex 20kg': '포',
  '벽돌타일 (로스율 10%)': '㎡',
  '메지 시멘트': '포',
  '단열재 노무비': '㎡',
  '타일 노무비': '㎡',
  '메지 시공비': '㎡',
  '롱브릭 코너타일': '장',
  '브릭코 코너타일': '장'
};

function loadPriceConfiguration() {
  try {
    const stored = localStorage.getItem('priceConfiguration');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.warn('가격 설정을 불러오는 중 오류가 발생했습니다.', error);
  }
  return JSON.parse(JSON.stringify(defaultPriceConfiguration));
}

function savePriceConfiguration(config) {
  localStorage.setItem('priceConfiguration', JSON.stringify(config));
}

function resetPriceConfiguration() {
  const clone = JSON.parse(JSON.stringify(defaultPriceConfiguration));
  savePriceConfiguration(clone);
  return clone;
}

function getDiskAnchorSize(thickness) {
  if (thickness <= 120) {
    return { size: '120mm', priceKey: '디스크 앙카 120mm' };
  }
  if (thickness <= 160) {
    return { size: '150mm', priceKey: '디스크 앙카 150mm' };
  }
  if (thickness <= 200) {
    return { size: '200mm', priceKey: '디스크 앙카 200mm' };
  }
  return { size: '250mm', priceKey: '디스크 앙카 250mm' };
}

function roundUpToUnit(quantity, unit) {
  return Math.ceil(quantity / unit) * unit;
}

function calculateMaterials(params, priceConfig, laborIncluded = true) {
  const {
    systemId,
    area,
    rcThickness,
    trackThickness,
    formThickness,
    insulationLossRate,
    tileLossRate,
    isFireResistant,
    cornerTileType,
    cornerTileLength
  } = params;

  const items = [];
  const lossMultiplier = 1 + insulationLossRate / 100;
  const tileLossMultiplier = 1 + tileLossRate / 100;

  if (systemId === 'RC' && rcThickness) {
    let tPrice = priceConfig.rcThicknessPrices[rcThickness] ?? 16000;
    if (isFireResistant) {
      tPrice = rcThickness * 200;
    }

    const diskAnchor = getDiskAnchorSize(rcThickness);

    const rcItems = [
      [`단열재 (로스율 ${insulationLossRate}%)${isFireResistant ? ' - 준불연' : ''}`, lossMultiplier, tPrice],
      [`디스크 앙카 ${diskAnchor.size}`, 5.3, priceConfig.materialPrices[diskAnchor.priceKey] ?? 400],
      ['접착 몰탈', 0.05, priceConfig.materialPrices['접착 몰탈'] ?? 35000],
      ['단열재 부착용 폼본드', 0.1666667, priceConfig.materialPrices['단열재 부착용 폼본드'] ?? 6500],
      ['드릴비트', 0.1, priceConfig.materialPrices['드릴비트'] ?? 5000],
      ['Terra Flex 20kg', 0.1666667, priceConfig.materialPrices['Terra Flex 20kg'] ?? 21000],
      [`벽돌타일 (로스율 ${tileLossRate}%)`, tileLossMultiplier, priceConfig.materialPrices['벽돌타일 (로스율 10%)'] ?? 18000]
    ];

    if (cornerTileType && cornerTileLength && Number(cornerTileLength) > 0) {
      const cornerTileName = cornerTileType === 'longbrick' ? '롱브릭 코너타일' : '브릭코 코너타일';
      const cornerTilePerM = cornerTileType === 'longbrick' ? 16 : 14;
      const cornerTilePrice = priceConfig.materialPrices[cornerTileName] ?? 1200;
      const cornerTileLengthNum = Number(cornerTileLength);
      const cornerTileQuantity = cornerTilePerM * cornerTileLengthNum;

      rcItems.push([cornerTileName, cornerTileQuantity, cornerTilePrice]);
    }

    rcItems.push(['메지 시멘트', 0.2631579, priceConfig.materialPrices['메지 시멘트'] ?? 6500]);

    if (laborIncluded) {
      rcItems.push(
        ['단열재 노무비', 1.0, priceConfig.laborRates['단열재 노무비'] ?? 23000],
        ['타일 노무비', 1.0, priceConfig.laborRates['타일 노무비'] ?? 23000],
        ['메지 시공비', 1.0, priceConfig.laborRates['메지 시공비'] ?? 10000]
      );
    }

    rcItems.forEach(([name, perM2, unitPrice]) => {
      let qty;
      if (name.includes('코너타일')) {
        qty = perM2;
      } else {
        qty = perM2 * area;
      }

      if (!name.includes('단열재')) {
        qty = Math.ceil(qty);
      }

      if (name === '메지 시멘트' || name === '단열재 부착용 폼본드' || name === 'Terra Flex 20kg') {
        qty = Math.ceil(qty);
      } else if (name.includes('디스크 앙카')) {
        qty = roundUpToUnit(qty, 100);
      }

      const unit = name.includes('단열재') && !name.includes('부착용') ? '㎡' : RC_UNIT_MAP[name] || 'ea';

      items.push({
        name,
        unit,
        qty,
        unitPrice,
        supply: unitPrice * qty
      });
    });
  }

  if ((systemId === 'LGS' || systemId === 'WOOD') && trackThickness) {
    let tPrice = priceConfig.trackThicknessPrices[trackThickness] ?? 16000;

    if (isFireResistant) {
      tPrice = trackThickness * 200;
    } else if (systemId === 'WOOD') {
      tPrice += 1000;
    }

    const diskAnchor = getDiskAnchorSize(trackThickness);

    const trackItems = [
      [`단열재 (로스율 ${insulationLossRate}%)${isFireResistant ? ' - 준불연' : ''}`, lossMultiplier, tPrice],
      ['알루미늄 트랙', 2.7, priceConfig.materialPrices['알루미늄 트랙'] ?? 1000],
      [`디스크 앙카 ${diskAnchor.size}`, 3, priceConfig.materialPrices[diskAnchor.priceKey] ?? 400],
      systemId === 'WOOD'
        ? ['델타피스', 5, priceConfig.materialPrices['델타피스'] ?? 40]
        : ['철판피스', 5, priceConfig.materialPrices['철판피스'] ?? 40],
      ['단열재 부착용 폼본드', 0.1538, priceConfig.materialPrices['단열재 부착용 폼본드'] ?? 6500],
      ['Terra Flex 20kg', 0.1666667, priceConfig.materialPrices['Terra Flex 20kg'] ?? 21000],
      [`벽돌타일 (로스율 ${tileLossRate}%)`, tileLossMultiplier, priceConfig.materialPrices['벽돌타일 (로스율 10%)'] ?? 18000]
    ];

    if (cornerTileType && cornerTileLength && Number(cornerTileLength) > 0) {
      const cornerTileName = cornerTileType === 'longbrick' ? '롱브릭 코너타일' : '브릭코 코너타일';
      const cornerTilePerM = cornerTileType === 'longbrick' ? 16 : 14;
      const cornerTilePrice = priceConfig.materialPrices[cornerTileName] ?? 1200;
      const cornerTileLengthNum = Number(cornerTileLength);
      const cornerTileQuantity = cornerTilePerM * cornerTileLengthNum;

      trackItems.push([cornerTileName, cornerTileQuantity, cornerTilePrice]);
    }

    trackItems.push(['메지 시멘트', 0.2631579, priceConfig.materialPrices['메지 시멘트'] ?? 6500]);

    if (laborIncluded) {
      trackItems.push(
        ['단열재 노무비', 1.0, priceConfig.laborRates['단열재 노무비'] ?? 23000],
        ['타일 노무비', 1.0, priceConfig.laborRates['타일 노무비'] ?? 23000],
        ['메지 시공비', 1.0, priceConfig.laborRates['메지 시공비'] ?? 10000]
      );
    }

    trackItems.forEach(([name, perM2, unitPrice]) => {
      let qty;
      if (name.includes('코너타일')) {
        qty = perM2;
      } else {
        qty = perM2 * area;
      }

      if (!name.includes('단열재')) {
        qty = Math.ceil(qty);
      }

      if (name === '메지 시멘트' || name === '단열재 부착용 폼본드' || name === 'Terra Flex 20kg') {
        qty = Math.ceil(qty);
      } else if (name.includes('디스크 앙카') || name === '알루미늄 트랙') {
        qty = roundUpToUnit(qty, 100);
      } else if (name === '철판피스' || name === '델타피스') {
        qty = roundUpToUnit(qty, 500);
      }

      const unit = name.includes('단열재') && !name.includes('부착용') ? '㎡' : TRACK_UNIT_MAP[name] || 'ea';

      items.push({
        name,
        unit,
        qty,
        unitPrice,
        supply: unitPrice * qty
      });
    });
  }

  if (systemId === 'FORM' && formThickness) {
    const formPrice = priceConfig.formThicknessPrices[formThickness] ?? 17600;
    const releaserPrice = priceConfig.materialPrices['박리제'] ?? 55000;
    const formbondPrice = priceConfig.materialPrices['단열재 부착용 폼본드'] ?? 6500;
    const anchorPrice = priceConfig.materialPrices['디스크 앙카'] ?? 400;

    items.push({
      name: `패턴 거푸집 패널 (${formThickness}T)`,
      unit: '㎡',
      qty: area,
      unitPrice: formPrice,
      supply: formPrice * area
    });

    items.push({
      name: '박리제',
      unit: '통',
      qty: Math.ceil(area / 30),
      unitPrice: releaserPrice,
      supply: releaserPrice * Math.ceil(area / 30)
    });

    items.push({
      name: '단열재 부착용 폼본드',
      unit: 'ea',
      qty: Math.ceil(area / 30),
      unitPrice: formbondPrice,
      supply: formbondPrice * Math.ceil(area / 30)
    });

    items.push({
      name: '디스크 앙카',
      unit: 'ea',
      qty: Math.ceil(area * 0.81),
      unitPrice: anchorPrice,
      supply: anchorPrice * Math.ceil(area * 0.81)
    });
  }

  return items;
}

function formatCurrency(value) {
  return Math.round(value).toLocaleString('ko-KR');
}

function roundTo(value, step) {
  if (!step) return value;
  return Math.floor(value / step) * step;
}

const state = {
  systemId: 'RC',
  area: 120,
  rcThickness: 100,
  trackThickness: 100,
  formThickness: 60,
  insulationLossRate: 8,
  tileLossRate: 10,
  vatIncluded: false,
  roundStep: 10,
  isFireResistant: false,
  designFeeEnabled: false,
  designFeeRate: 10,
  laborIncluded: true,
  cornerTileType: '',
  cornerTileLength: '',
  activeView: 'estimator',
  activeSettingsTab: 'rc'
};

let priceConfig = loadPriceConfiguration();

const elements = {
  systemTabs: document.getElementById('system-tabs'),
  estimatorView: document.getElementById('estimator-view'),
  settingsView: document.getElementById('settings-view'),
  area: document.getElementById('area'),
  rcThickness: document.getElementById('rcThickness'),
  trackThickness: document.getElementById('trackThickness'),
  formThickness: document.getElementById('formThickness'),
  insulationLoss: document.getElementById('insulationLoss'),
  tileLoss: document.getElementById('tileLoss'),
  fireResistant: document.getElementById('fireResistant'),
  roundStep: document.getElementById('roundStep'),
  designFee: document.getElementById('designFee'),
  designFeeRate: document.getElementById('designFeeRate'),
  laborIncluded: document.getElementById('laborIncluded'),
  vatIncluded: document.getElementById('vatIncluded'),
  cornerTileType: document.getElementById('cornerTileType'),
  cornerTileLength: document.getElementById('cornerTileLength'),
  materialsBody: document.getElementById('materials-body'),
  subtotal: document.getElementById('subtotal'),
  vat: document.getElementById('vat'),
  totalBefore: document.getElementById('total-before'),
  discount: document.getElementById('discount'),
  total: document.getElementById('total'),
  vatRow: document.getElementById('vat-row'),
  discountRow: document.getElementById('discount-row'),
  rcThicknessField: document.getElementById('rc-thickness-field'),
  trackThicknessField: document.getElementById('track-thickness-field'),
  formThicknessField: document.getElementById('form-thickness-field'),
  insulationLossField: document.getElementById('insulation-loss-field'),
  tileLossField: document.getElementById('tile-loss-field'),
  fireResistantField: document.getElementById('fire-resistant-field'),
  designFeeRateField: document.getElementById('design-fee-rate-field'),
  cornerTileTypeField: document.getElementById('corner-tile-type-field'),
  cornerTileLengthField: document.getElementById('corner-tile-length-field'),
  settingsTabs: document.querySelectorAll('.settings-tabs .tab'),
  settingsPanels: document.querySelectorAll('.settings-panel')
};

function renderSystemTabs() {
  elements.systemTabs.innerHTML = '';
  SYSTEMS.forEach((system) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'system-tab';
    button.role = 'tab';
    button.dataset.systemId = system.id;
    button.setAttribute('aria-selected', system.id === state.systemId ? 'true' : 'false');
    button.innerHTML = `<strong>${system.id}</strong><span>${system.description}</span>`;
    button.addEventListener('click', () => {
      state.systemId = system.id;
      ensureThicknessDefaults();
      renderSystemTabs();
      updateVisibility();
      renderEstimator();
    });
    elements.systemTabs.appendChild(button);
  });
}

function ensureThicknessDefaults() {
  if (state.systemId === 'RC') {
    const thicknesses = getThicknessValues(priceConfig.rcThicknessPrices);
    if (!thicknesses.includes(state.rcThickness)) {
      state.rcThickness = thicknesses[0] ?? 0;
    }
  }
  if (state.systemId === 'LGS' || state.systemId === 'WOOD') {
    const thicknesses = getThicknessValues(priceConfig.trackThicknessPrices);
    if (!thicknesses.includes(state.trackThickness)) {
      state.trackThickness = thicknesses[0] ?? 0;
    }
  }
  if (state.systemId === 'FORM') {
    const thicknesses = getThicknessValues(priceConfig.formThicknessPrices);
    if (!thicknesses.includes(state.formThickness)) {
      state.formThickness = thicknesses[0] ?? 0;
    }
  }
}

function getThicknessValues(map) {
  return Object.keys(map)
    .map(Number)
    .sort((a, b) => a - b);
}

function populateSelect(select, values) {
  select.innerHTML = '';
  values.forEach((value) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = `${value}T`;
    select.appendChild(option);
  });
}

function updateSelects() {
  populateSelect(elements.rcThickness, getThicknessValues(priceConfig.rcThicknessPrices));
  populateSelect(elements.trackThickness, getThicknessValues(priceConfig.trackThicknessPrices));
  populateSelect(elements.formThickness, getThicknessValues(priceConfig.formThicknessPrices));

  elements.rcThickness.value = String(state.rcThickness);
  elements.trackThickness.value = String(state.trackThickness);
  elements.formThickness.value = String(state.formThickness);
}

function updateVisibility() {
  elements.rcThicknessField.style.display = state.systemId === 'RC' ? 'block' : 'none';
  elements.trackThicknessField.style.display = state.systemId === 'LGS' || state.systemId === 'WOOD' ? 'block' : 'none';
  elements.formThicknessField.style.display = state.systemId === 'FORM' ? 'block' : 'none';

  const showLossInputs = state.systemId === 'RC' || state.systemId === 'LGS' || state.systemId === 'WOOD';
  elements.insulationLossField.style.display = showLossInputs ? 'block' : 'none';
  elements.tileLossField.style.display = showLossInputs ? 'block' : 'none';
  elements.fireResistantField.style.display = showLossInputs ? 'flex' : 'none';
  elements.cornerTileTypeField.style.display = showLossInputs ? 'block' : 'none';
  elements.cornerTileLengthField.style.display = showLossInputs && state.cornerTileType ? 'block' : 'none';

  elements.designFeeRateField.style.display = state.designFeeEnabled ? 'block' : 'none';
}

function renderMaterialsTable() {
  const params = {
    systemId: state.systemId,
    area: Number(state.area) || 0,
    rcThickness: Number(state.rcThickness) || undefined,
    trackThickness: Number(state.trackThickness) || undefined,
    formThickness: Number(state.formThickness) || undefined,
    insulationLossRate: Number(state.insulationLossRate) || 0,
    tileLossRate: Number(state.tileLossRate) || 0,
    isFireResistant: state.isFireResistant,
    cornerTileType: state.cornerTileType || undefined,
    cornerTileLength: Number(state.cornerTileLength) || undefined
  };

  const materials = calculateMaterials(params, priceConfig, state.laborIncluded);

  const designFeeMultiplier = state.designFeeEnabled ? 1 + (Number(state.designFeeRate) || 0) / 100 : 1;

  const laborPerM2 = state.systemId === 'FORM' ? priceConfig.laborRates['패턴거푸집 시공비'] ?? 12000 : 0;
  const laborSupply = state.laborIncluded ? laborPerM2 * (Number(state.area) || 0) : 0;

  const materialsSupply = materials.reduce((sum, item) => sum + item.supply * designFeeMultiplier, 0);
  const subtotal = materialsSupply + laborSupply;
  const vat = subtotal * VAT_RATE;
  const total = state.vatIncluded ? subtotal + vat : subtotal;
  const totalRounded = roundTo(total, Number(state.roundStep) || 1);
  const discountAmount = total - totalRounded;

  elements.materialsBody.innerHTML = '';

  materials.forEach((item) => {
    const row = document.createElement('tr');
    const adjustedUnitPrice = item.unitPrice * designFeeMultiplier;
    const adjustedSupply = item.supply * designFeeMultiplier;

    let qtyDisplay;
    if (item.name.includes('단열재') && !item.name.includes('부착용') && !item.name.includes('노무비')) {
      qtyDisplay = Number(item.qty.toFixed(1)).toLocaleString('ko-KR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    } else {
      qtyDisplay = Math.round(item.qty).toLocaleString('ko-KR');
    }

    row.innerHTML = `
      <td>${item.name}</td>
      <td class="text-right">${item.unit}</td>
      <td class="text-right">${qtyDisplay}</td>
      <td class="text-right">${formatCurrency(adjustedUnitPrice)}</td>
      <td class="text-right">${formatCurrency(adjustedSupply)}</td>
    `;

    elements.materialsBody.appendChild(row);
  });

  if (laborPerM2 > 0 && state.laborIncluded) {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>시공 인건비</td>
      <td class="text-right">㎡</td>
      <td class="text-right">${Math.round(Number(state.area) || 0).toLocaleString('ko-KR')}</td>
      <td class="text-right">${formatCurrency(laborPerM2)}</td>
      <td class="text-right">${formatCurrency(laborSupply)}</td>
    `;
    elements.materialsBody.appendChild(row);
  }

  if (discountAmount > 0) {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td class="danger">공제 (버림 단위 적용)</td>
      <td class="text-right">원</td>
      <td class="text-right">1</td>
      <td class="text-right danger">${formatCurrency(discountAmount)}</td>
      <td class="text-right danger">-${formatCurrency(discountAmount)}</td>
    `;
    elements.materialsBody.appendChild(row);
  }

  elements.subtotal.textContent = `${formatCurrency(subtotal)} 원`;
  elements.totalBefore.textContent = `${formatCurrency(total)} 원`;
  elements.total.textContent = `${formatCurrency(totalRounded)} 원`;

  if (state.vatIncluded) {
    elements.vatRow.style.display = 'flex';
    elements.vat.textContent = `${formatCurrency(vat)} 원`;
  } else {
    elements.vatRow.style.display = 'none';
  }

  if (discountAmount > 0) {
    elements.discountRow.style.display = 'flex';
    elements.discount.textContent = `-${formatCurrency(discountAmount)} 원`;
  } else {
    elements.discountRow.style.display = 'none';
  }
}

function renderEstimator() {
  elements.area.value = String(state.area ?? '');
  elements.insulationLoss.value = String(state.insulationLossRate ?? '');
  elements.tileLoss.value = String(state.tileLossRate ?? '');
  elements.fireResistant.checked = state.isFireResistant;
  elements.roundStep.value = String(state.roundStep ?? '');
  elements.designFee.checked = state.designFeeEnabled;
  elements.designFeeRate.value = String(state.designFeeRate ?? '');
  elements.laborIncluded.checked = state.laborIncluded;
  elements.vatIncluded.checked = state.vatIncluded;
  elements.cornerTileType.value = state.cornerTileType ?? '';
  elements.cornerTileLength.value = state.cornerTileLength ?? '';

  updateSelects();
  updateVisibility();
  renderMaterialsTable();
}

function switchView(view) {
  state.activeView = view;
  if (view === 'estimator') {
    elements.estimatorView.classList.add('active');
    elements.settingsView.classList.remove('active');
  } else {
    elements.settingsView.classList.add('active');
    elements.estimatorView.classList.remove('active');
  }
}

function handleInputEvents() {
  elements.area.addEventListener('input', (event) => {
    state.area = Number(event.target.value) || 0;
    renderMaterialsTable();
  });

  elements.rcThickness.addEventListener('change', (event) => {
    state.rcThickness = Number(event.target.value) || 0;
    renderMaterialsTable();
  });

  elements.trackThickness.addEventListener('change', (event) => {
    state.trackThickness = Number(event.target.value) || 0;
    renderMaterialsTable();
  });

  elements.formThickness.addEventListener('change', (event) => {
    state.formThickness = Number(event.target.value) || 0;
    renderMaterialsTable();
  });

  elements.insulationLoss.addEventListener('input', (event) => {
    state.insulationLossRate = Number(event.target.value) || 0;
    renderMaterialsTable();
  });

  elements.tileLoss.addEventListener('input', (event) => {
    state.tileLossRate = Number(event.target.value) || 0;
    renderMaterialsTable();
  });

  elements.fireResistant.addEventListener('change', (event) => {
    state.isFireResistant = event.target.checked;
    renderMaterialsTable();
  });

  elements.roundStep.addEventListener('input', (event) => {
    state.roundStep = Number(event.target.value) || 1;
    renderMaterialsTable();
  });

  elements.designFee.addEventListener('change', (event) => {
    state.designFeeEnabled = event.target.checked;
    updateVisibility();
    renderMaterialsTable();
  });

  elements.designFeeRate.addEventListener('input', (event) => {
    state.designFeeRate = Number(event.target.value) || 0;
    renderMaterialsTable();
  });

  elements.laborIncluded.addEventListener('change', (event) => {
    state.laborIncluded = event.target.checked;
    renderMaterialsTable();
  });

  elements.vatIncluded.addEventListener('change', (event) => {
    state.vatIncluded = event.target.checked;
    renderMaterialsTable();
  });

  elements.cornerTileType.addEventListener('change', (event) => {
    state.cornerTileType = event.target.value;
    if (!state.cornerTileType) {
      state.cornerTileLength = '';
    }
    updateVisibility();
    renderMaterialsTable();
  });

  elements.cornerTileLength.addEventListener('input', (event) => {
    state.cornerTileLength = event.target.value;
    renderMaterialsTable();
  });
}

function bindHeaderActions() {
  document.querySelector('[data-action="show-estimator"]').addEventListener('click', () => switchView('estimator'));
  document.querySelector('[data-action="show-settings"]').addEventListener('click', () => {
    switchView('settings');
    renderSettings();
  });
  document.querySelector('[data-action="print"]').addEventListener('click', () => window.print());
}

function renderSettings() {
  elements.settingsTabs.forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.tab === state.activeSettingsTab);
  });

  elements.settingsPanels.forEach((panel) => {
    panel.hidden = panel.dataset.panel !== state.activeSettingsTab;
  });

  const activePanel = Array.from(elements.settingsPanels).find((panel) => panel.dataset.panel === state.activeSettingsTab);
  if (!activePanel) return;

  if (state.activeSettingsTab === 'rc') {
    renderThicknessPanel(activePanel, 'rcThicknessPrices');
  } else if (state.activeSettingsTab === 'track') {
    renderThicknessPanel(activePanel, 'trackThicknessPrices');
  } else if (state.activeSettingsTab === 'form') {
    renderThicknessPanel(activePanel, 'formThicknessPrices');
  } else if (state.activeSettingsTab === 'materials') {
    renderPriceListPanel(activePanel, 'materialPrices');
  } else if (state.activeSettingsTab === 'labor') {
    renderPriceListPanel(activePanel, 'laborRates');
  }
}

function renderThicknessPanel(container, key) {
  container.innerHTML = '';

  const addForm = document.createElement('div');
  addForm.className = 'add-form';

  const thicknessInput = document.createElement('input');
  thicknessInput.type = 'number';
  thicknessInput.placeholder = '두께 (mm)';

  const priceInput = document.createElement('input');
  priceInput.type = 'number';
  priceInput.placeholder = '가격 (원)';

  const addButton = document.createElement('button');
  addButton.type = 'button';
  addButton.className = 'btn btn-primary';
  addButton.textContent = '추가';

  addButton.addEventListener('click', () => {
    const thickness = Number(thicknessInput.value);
    const price = Number(priceInput.value);
    if (!thickness || !price) return;
    priceConfig[key][thickness] = price;
    savePriceConfiguration(priceConfig);
    ensureThicknessDefaults();
    thicknessInput.value = '';
    priceInput.value = '';
    renderSettings();
    renderEstimator();
  });

  addForm.append(thicknessInput, priceInput, addButton);
  container.appendChild(addForm);

  const list = document.createElement('div');
  list.className = 'thickness-list';
  const entries = getThicknessValues(priceConfig[key]).map((thickness) => ({
    thickness,
    price: priceConfig[key][thickness]
  }));

  entries.forEach(({ thickness, price }) => {
    const item = document.createElement('div');
    item.className = 'thickness-item';

    const thicknessLabel = document.createElement('span');
    thicknessLabel.textContent = `${thickness}T`;

    const priceField = document.createElement('input');
    priceField.type = 'number';
    priceField.value = price;
    priceField.addEventListener('input', (event) => {
      priceConfig[key][thickness] = Number(event.target.value) || 0;
      savePriceConfiguration(priceConfig);
      renderEstimator();
    });

    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'btn';
    removeButton.textContent = '삭제';
    removeButton.addEventListener('click', () => {
      delete priceConfig[key][thickness];
      savePriceConfiguration(priceConfig);
      ensureThicknessDefaults();
      renderSettings();
      renderEstimator();
    });

    item.append(thicknessLabel, priceField, removeButton);
    list.appendChild(item);
  });

  container.appendChild(list);
}

function renderPriceListPanel(container, key) {
  container.innerHTML = '';

  const list = document.createElement('div');
  list.className = 'price-list';

  Object.keys(priceConfig[key])
    .sort()
    .forEach((name) => {
      const item = document.createElement('div');
      item.className = 'price-item';

      const label = document.createElement('label');
      label.textContent = name;

      const input = document.createElement('input');
      input.type = 'number';
      input.value = priceConfig[key][name];
      input.addEventListener('input', (event) => {
        priceConfig[key][name] = Number(event.target.value) || 0;
        savePriceConfiguration(priceConfig);
        renderEstimator();
      });

      item.append(label, input);
      list.appendChild(item);
    });

  container.appendChild(list);
}

function bindSettingsEvents() {
  elements.settingsTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      state.activeSettingsTab = tab.dataset.tab;
      renderSettings();
    });
  });

  document.querySelector('[data-action="reset"]').addEventListener('click', () => {
    priceConfig = resetPriceConfiguration();
    ensureThicknessDefaults();
    renderSettings();
    renderEstimator();
    alert('가격표가 기본값으로 초기화되었습니다.');
  });

  document.querySelector('[data-action="save"]').addEventListener('click', () => {
    savePriceConfiguration(priceConfig);
    alert('가격표가 저장되었습니다.');
  });
}

function init() {
  ensureThicknessDefaults();
  renderSystemTabs();
  updateSelects();
  updateVisibility();
  renderEstimator();
  handleInputEvents();
  bindHeaderActions();
  bindSettingsEvents();
}

init();
