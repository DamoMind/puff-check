// AQI Level definitions
const AQI_LEVELS = [
  { min: 0, max: 50, level: 'good', label: '优', class: 'level-good' },
  { min: 51, max: 100, level: 'moderate', label: '良', class: 'level-moderate' },
  { min: 101, max: 150, level: 'unhealthy-sensitive', label: '轻度污染', class: 'level-unhealthy-sensitive' },
  { min: 151, max: 200, level: 'unhealthy', label: '中度污染', class: 'level-unhealthy' },
  { min: 201, max: 300, level: 'very-unhealthy', label: '重度污染', class: 'level-very-unhealthy' },
  { min: 301, max: 999, level: 'hazardous', label: '严重污染', class: 'level-hazardous' },
];

// Health advice by level
const HEALTH_ADVICE = {
  'good': [
    '空气质量令人满意，可以正常进行户外活动',
    '适合户外运动和锻炼',
  ],
  'moderate': [
    '空气质量可接受，极少数敏感人群应减少户外活动',
    '一般人群可正常活动',
  ],
  'unhealthy-sensitive': [
    '儿童、老年人及心脏病、呼吸系统疾病患者应减少户外锻炼',
    '一般人群适量减少户外运动',
    '外出可考虑佩戴口罩',
  ],
  'unhealthy': [
    '外出请佩戴 N95/KN95 口罩',
    '室内开启空气净化器',
    '减少户外运动时间',
    '老人、儿童、呼吸道疾病患者尽量留在室内',
  ],
  'very-unhealthy': [
    '避免户外活动',
    '必须外出请佩戴专业防霾口罩',
    '保持室内门窗紧闭',
    '持续开启空气净化器',
    '多饮水，清淡饮食',
  ],
  'hazardous': [
    '停止一切户外活动',
    '尽量留在室内',
    '如有不适及时就医',
    '持续开启空气净化器至最高档',
    '如必须外出，佩戴专业防霾口罩并缩短在外时间',
  ],
};

const citySelect = document.getElementById('city');
const refreshBtn = document.getElementById('refresh-btn');
const removeCityBtn = document.getElementById('remove-city-btn');
const setDefaultBtn = document.getElementById('set-default-btn');
const customCityInput = document.getElementById('custom-city');
const addCityBtn = document.getElementById('add-city-btn');
const loadingEl = document.getElementById('loading');
const errorEl = document.getElementById('error');
const contentEl = document.getElementById('content');
const imageEl = document.getElementById('aqi-image');
const imageLoadingEl = document.getElementById('image-loading');
const exportContainer = document.getElementById('export-container');
const exportWatermark = document.getElementById('export-watermark');

// Default cities (cannot be removed)
const DEFAULT_CITIES = ['beijing', 'shanghai', 'guangzhou', 'shenzhen', 'chengdu', 'hangzhou', 'nanjing', 'xian'];

// Current state
let currentData = null;
let customCities = [];
let defaultCity = null;

// Load custom cities from localStorage
function loadCustomCities() {
  try {
    const saved = localStorage.getItem('aqi-custom-cities');
    if (saved) {
      customCities = JSON.parse(saved);
      customCities.forEach(city => addCityOption(city.value, city.label));
    }
  } catch (e) {
    console.error('Failed to load custom cities:', e);
  }
}

// Load default city from localStorage
function loadDefaultCity() {
  try {
    defaultCity = localStorage.getItem('aqi-default-city');
    if (defaultCity) {
      // Check if the city exists in select
      const option = citySelect.querySelector(`option[value="${defaultCity}"]`);
      if (option) {
        citySelect.value = defaultCity;
      } else {
        defaultCity = null;
      }
    }
  } catch (e) {
    console.error('Failed to load default city:', e);
  }
}

// Set current city as default
function setDefaultCity() {
  const currentValue = citySelect.value;
  defaultCity = currentValue;
  try {
    localStorage.setItem('aqi-default-city', defaultCity);
    updateDefaultIndicator();
    alert(`已将 "${getCurrentCityLabel()}" 设为默认城市`);
  } catch (e) {
    console.error('Failed to save default city:', e);
  }
}

// Get current city label
function getCurrentCityLabel() {
  const option = citySelect.options[citySelect.selectedIndex];
  return option ? option.textContent : citySelect.value;
}

// Update default indicator in select options
function updateDefaultIndicator() {
  // Remove existing indicators
  Array.from(citySelect.options).forEach(opt => {
    opt.textContent = opt.textContent.replace(' ⭐', '');
  });
  // Add indicator to default city
  if (defaultCity) {
    const option = citySelect.querySelector(`option[value="${defaultCity}"]`);
    if (option) {
      option.textContent = option.textContent + ' ⭐';
    }
  }
}

// Save custom cities to localStorage
function saveCustomCities() {
  try {
    localStorage.setItem('aqi-custom-cities', JSON.stringify(customCities));
  } catch (e) {
    console.error('Failed to save custom cities:', e);
  }
}

// Add city option to select
function addCityOption(value, label) {
  const option = document.createElement('option');
  option.value = value;
  option.textContent = label;
  option.dataset.custom = 'true';
  citySelect.appendChild(option);
}

// Add a new custom city
function addCustomCity() {
  const input = customCityInput.value.trim().toLowerCase();
  if (!input) {
    alert('请输入城市拼音');
    return;
  }

  // Check if already exists
  const existing = Array.from(citySelect.options).find(opt => opt.value === input);
  if (existing) {
    citySelect.value = input;
    loadAqiData();
    customCityInput.value = '';
    return;
  }

  // Add new city
  const label = input.charAt(0).toUpperCase() + input.slice(1);
  addCityOption(input, label);
  customCities.push({ value: input, label });
  saveCustomCities();

  // Select and load data
  citySelect.value = input;
  customCityInput.value = '';
  loadAqiData();
}

// Remove current custom city
function removeCurrentCity() {
  const currentValue = citySelect.value;
  if (DEFAULT_CITIES.includes(currentValue)) {
    return;
  }

  // Remove from select
  const option = citySelect.querySelector(`option[value="${currentValue}"]`);
  if (option) {
    option.remove();
  }

  // Remove from customCities
  customCities = customCities.filter(c => c.value !== currentValue);
  saveCustomCities();

  // Select first city
  citySelect.selectedIndex = 0;
  loadAqiData();
}

// Update remove button visibility
function updateRemoveButton() {
  const isCustom = !DEFAULT_CITIES.includes(citySelect.value);
  removeCityBtn.classList.toggle('hidden', !isCustom);
}

// Export current view as image
async function exportAsImage() {
  if (!currentData || !exportContainer) return;

  exportBtn.disabled = true;
  exportBtn.textContent = '⏳ 生成中...';

  try {
    // Show watermark temporarily
    exportWatermark.classList.remove('hidden');

    // Wait for any pending renders
    await new Promise(resolve => setTimeout(resolve, 100));

    // Use html2canvas to capture the export container
    const canvas = await html2canvas(exportContainer, {
      backgroundColor: '#0f172a',
      scale: 2, // Higher quality
      useCORS: true,
      allowTaint: true,
      logging: false,
    });

    // Hide watermark again
    exportWatermark.classList.add('hidden');

    // Convert to blob and download
    canvas.toBlob((blob) => {
      if (!blob) {
        alert('导出失败，请重试');
        return;
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const cityName = currentData.city || citySelect.value;
      const timestamp = new Date().toISOString().slice(0, 10);
      link.download = `空气质量_${cityName}_${timestamp}.png`;
      link.href = url;
      link.click();

      // Cleanup
      URL.revokeObjectURL(url);
    }, 'image/png');
  } catch (error) {
    console.error('Export failed:', error);
    exportWatermark.classList.add('hidden');
    alert('导出失败: ' + error.message);
  } finally {
    exportBtn.disabled = false;
    exportBtn.textContent = '📤 导出分享图片';
  }
}

// Get level info by AQI value
function getLevelInfo(aqi) {
  for (const level of AQI_LEVELS) {
    if (aqi >= level.min && aqi <= level.max) {
      return level;
    }
  }
  return AQI_LEVELS[AQI_LEVELS.length - 1];
}

// Format value with fallback
function formatValue(value) {
  return value !== null && value !== undefined ? value : '--';
}

// Show/hide elements
function showLoading() {
  loadingEl.classList.remove('hidden');
  errorEl.classList.add('hidden');
  contentEl.classList.add('hidden');
}

function showError() {
  loadingEl.classList.add('hidden');
  errorEl.classList.remove('hidden');
  contentEl.classList.add('hidden');
}

function showContent() {
  loadingEl.classList.add('hidden');
  errorEl.classList.add('hidden');
  contentEl.classList.remove('hidden');
}

// Load AQI data
async function loadAqiData() {
  const city = citySelect.value;
  showLoading();

  try {
    const response = await fetch(`/api/aqi?city=${city}`);
    if (!response.ok) {
      throw new Error('Failed to fetch data');
    }

    const data = await response.json();
    currentData = data;
    updateUI(data);
    showContent();
  } catch (error) {
    console.error('Error loading AQI data:', error);
    showError();
  }
}

// Update UI with data
function updateUI(data) {
  const levelInfo = getLevelInfo(data.aqi);

  // Update AQI indicator
  const indicator = document.getElementById('aqi-indicator');
  indicator.className = `aqi-indicator ${levelInfo.class}`;

  document.getElementById('aqi-value').textContent = data.aqi;
  document.getElementById('aqi-label').textContent = levelInfo.label;
  document.getElementById('city-name').textContent = data.city;

  // Update details
  document.getElementById('pm25').textContent = formatValue(data.pm25);
  document.getElementById('pm10').textContent = formatValue(data.pm10);
  document.getElementById('o3').textContent = formatValue(data.o3);
  document.getElementById('no2').textContent = formatValue(data.no2);

  // Update advice
  const adviceList = document.getElementById('advice-list');
  const advice = HEALTH_ADVICE[levelInfo.level] || [];
  adviceList.innerHTML = advice.map(a => `<li>${a}</li>`).join('');

  // Update time
  document.getElementById('update-time').textContent = data.time;

  // Update image (use pre-generated by default)
  updateImage(levelInfo.level, false);
}


// Event listeners
citySelect.addEventListener('change', () => {
  updateRemoveButton();
  loadAqiData();
});
refreshBtn.addEventListener('click', loadAqiData);
removeCityBtn.addEventListener('click', removeCurrentCity);
setDefaultBtn.addEventListener('click', setDefaultCity);
addCityBtn.addEventListener('click', addCustomCity);
exportBtn.addEventListener('click', exportAsImage);
customCityInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    addCustomCity();
  }
});
generateBtn.addEventListener('click', () => {
  if (currentData) {
    const levelInfo = getLevelInfo(currentData.aqi);
    updateImage(levelInfo.level, true);
  }
});

// Initial load
loadCustomCities();
loadDefaultCity();
updateDefaultIndicator();
updateRemoveButton();
loadAqiData();
