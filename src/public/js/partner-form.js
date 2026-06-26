/**
 * partner-form.js
 * Dinamičko upravljanje bojama, fontovima, logo preview-om i slug preview-om
 */

(function() {
  'use strict';

  // DOM reference
  const colorsJsonInput = document.getElementById('colorsJson');
  const fontsJsonInput = document.getElementById('fontsJson');
  const colorsContainer = document.getElementById('colorsContainer');
  const fontsContainer = document.getElementById('fontsContainer');
  const addColorBtn = document.getElementById('addColorBtn');
  const addFontBtn = document.getElementById('addFontBtn');
  const partnerForm = document.getElementById('partnerForm');
  const logoInput = document.getElementById('logoInput');
  const logoPreviewContainer = document.getElementById('logoPreviewContainer');
  const slugInput = document.getElementById('slug');
  const slugPreview = document.getElementById('slugPreview');

  // Podaci
  let colorsData = [];
  let fontsData = [];

  // Inicijalizacija iz hidden polja
  function initData() {
    try {
      colorsData = JSON.parse(colorsJsonInput.value || '[]');
    } catch (e) {
      colorsData = [];
    }
    try {
      fontsData = JSON.parse(fontsJsonInput.value || '[]');
    } catch (e) {
      fontsData = [];
    }
  }

  // Ažuriranje hidden polja
  function updateHiddenFields() {
    colorsJsonInput.value = JSON.stringify(colorsData);
    fontsJsonInput.value = JSON.stringify(fontsData);
  }

  // =============== LOGO PREVIEW ===============
  function handleLogoPreview(file) {
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = function(e) {
      logoPreviewContainer.innerHTML = `
        <img src="${e.target.result}" alt="Novi logo" class="img-thumbnail" style="max-height:100px;">
        <p class="text-muted small mt-1">Novi logo (sačuvajte formu)</p>
      `;
    };
    reader.readAsDataURL(file);
  }

  if (logoInput) {
    logoInput.addEventListener('change', function() {
      if (this.files && this.files[0]) {
        handleLogoPreview(this.files[0]);
      }
    });
  }

  // =============== SLUG PREVIEW ===============
  function handleSlugPreview() {
    if (!slugInput || !slugPreview) return;
    const val = slugInput.value.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (val) {
      slugPreview.innerHTML = `<span class="badge bg-info">Javna ruta: /partner/${val}/prodavnica</span>`;
    } else {
      slugPreview.innerHTML = `<span class="badge bg-secondary">Nije postavljen</span>`;
    }
  }

  if (slugInput) {
    slugInput.addEventListener('input', handleSlugPreview);
    // Inicijalno renderovanje
    handleSlugPreview();
  }

  // =============== BOJE ===============
  function renderColors() {
    colorsContainer.innerHTML = '';
    colorsData.forEach((item, index) => {
      const row = document.createElement('div');
      row.className = 'row g-2 mb-2 align-items-end';
      row.dataset.index = index;
      row.innerHTML = `
        <div class="col-5">
          <input type="text" class="form-control form-control-sm color-name" placeholder="Naziv" value="${escapeHtml(item.name || '')}">
        </div>
        <div class="col-5">
          <input type="color" class="form-control form-control-sm color-value" value="${escapeHtml(item.value || '#000000')}">
        </div>
        <div class="col-2">
          <button type="button" class="btn btn-sm btn-outline-danger remove-color-btn" data-index="${index}">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      `;
      colorsContainer.appendChild(row);
    });
    attachColorEvents();
  }

  function attachColorEvents() {
    colorsContainer.querySelectorAll('.remove-color-btn').forEach(btn => {
      btn.addEventListener('click', function(e) {
        const idx = parseInt(this.dataset.index);
        colorsData.splice(idx, 1);
        renderColors();
        updateHiddenFields();
        e.preventDefault();
      });
    });

    colorsContainer.querySelectorAll('.color-name, .color-value').forEach(input => {
      input.addEventListener('input', function() {
        const row = this.closest('.row');
        const idx = parseInt(row.dataset.index);
        const name = row.querySelector('.color-name').value;
        const value = row.querySelector('.color-value').value;
        colorsData[idx] = { name, value };
        updateHiddenFields();
      });
    });
  }

  // =============== FONTOVI ===============
  function renderFonts() {
    fontsContainer.innerHTML = '';
    fontsData.forEach((item, index) => {
      const row = document.createElement('div');
      row.className = 'row g-2 mb-2 align-items-end';
      row.dataset.index = index;
      row.innerHTML = `
        <div class="col-5">
          <input type="text" class="form-control form-control-sm font-name" placeholder="Naziv" value="${escapeHtml(item.name || '')}">
        </div>
        <div class="col-5">
          <input type="text" class="form-control form-control-sm font-value" placeholder="font-family" value="${escapeHtml(item.value || '')}">
        </div>
        <div class="col-2">
          <button type="button" class="btn btn-sm btn-outline-danger remove-font-btn" data-index="${index}">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      `;
      fontsContainer.appendChild(row);
    });
    attachFontEvents();
  }

  function attachFontEvents() {
    fontsContainer.querySelectorAll('.remove-font-btn').forEach(btn => {
      btn.addEventListener('click', function(e) {
        const idx = parseInt(this.dataset.index);
        fontsData.splice(idx, 1);
        renderFonts();
        updateHiddenFields();
        e.preventDefault();
      });
    });

    fontsContainer.querySelectorAll('.font-name, .font-value').forEach(input => {
      input.addEventListener('input', function() {
        const row = this.closest('.row');
        const idx = parseInt(row.dataset.index);
        const name = row.querySelector('.font-name').value;
        const value = row.querySelector('.font-value').value;
        fontsData[idx] = { name, value };
        updateHiddenFields();
      });
    });
  }

  // =============== POMOĆNE FUNKCIJE ===============
  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // =============== DODAVANJE ===============
  function addColor() {
    colorsData.push({ name: '', value: '#000000' });
    renderColors();
    updateHiddenFields();
  }

  function addFont() {
    fontsData.push({ name: '', value: '' });
    renderFonts();
    updateHiddenFields();
  }

  // =============== INICIJALIZACIJA ===============
  initData();
  renderColors();
  renderFonts();
  updateHiddenFields();

  if (addColorBtn) addColorBtn.addEventListener('click', addColor);
  if (addFontBtn) addFontBtn.addEventListener('click', addFont);

  if (partnerForm) {
    partnerForm.addEventListener('submit', function() {
      updateHiddenFields();
    });
  }

})();