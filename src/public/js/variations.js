/**
 * variations.js
 * Dinamičko upravljanje varijacijama i merama
 */

(function() {
  'use strict';

  // === FUNKCIJA ZA GENERISANJE HTML SADRŽAJA POPOVER-a ===
  function generateMeasurementsHtml(data) {
    if (!data || typeof data !== 'object') {
      return '<span class="text-muted">Nema podataka</span>';
    }
    let html = '<div class="text-start" style="font-size:0.85rem;">';
    let hasData = false;
    for (const key in data) {
      if (key === 'unit') continue;
      const value = data[key];
      if (value !== undefined && value !== null && value !== '') {
        html += `<div><strong>${key}:</strong> ${value}</div>`;
        hasData = true;
      }
    }
    html += '</div>';
    return hasData ? html : '<span class="text-muted">Nema podataka</span>';
  }

  // === INICIJALIZACIJA POPOVER-a za mere (isto kao u details.js) ===
  document.addEventListener('DOMContentLoaded', function() {
    const measurementButtons = document.querySelectorAll('[data-measurements]');
    measurementButtons.forEach(function(btn) {
      const encodedData = btn.dataset.measurements;
      if (!encodedData) return;

      let measurements;
      try {
        measurements = JSON.parse(decodeURIComponent(encodedData));
      } catch (e) {
        return;
      }

      if (!measurements || typeof measurements !== 'object' || Object.keys(measurements).length === 0) {
        return;
      }

      const content = generateMeasurementsHtml(measurements);
      
      const popover = new bootstrap.Popover(btn, {
        trigger: 'hover focus',
        placement: 'left',
        html: true,
        content: content,
        container: 'body',
      });

      btn.addEventListener('mouseleave', function() {
        popover.hide();
      });
    });
  });

  // === TOGGLE MERE (dodavanje) ===
  document.addEventListener('DOMContentLoaded', function() {
    const toggleButtons = document.querySelectorAll('[data-toggle-measurements]');
    toggleButtons.forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        const container = this.closest('.card-body').querySelector('#measurementsContainer');
        if (!container) return;
        container.classList.toggle('d-none');
        if (container.classList.contains('d-none')) {
          this.innerHTML = '<i class="bi bi-chevron-down"></i> Prikaži mere';
        } else {
          this.innerHTML = '<i class="bi bi-chevron-up"></i> Sakrij mere';
        }
      });
    });
  });

  // === TOGGLE MERE (edit modal) ===
  document.addEventListener('DOMContentLoaded', function() {
    const toggleButtonsEdit = document.querySelectorAll('[data-toggle-measurements-edit]');
    toggleButtonsEdit.forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        const container = this.closest('.modal-body').querySelector('#editMeasurementsContainer');
        if (!container) return;
        container.classList.toggle('d-none');
        if (container.classList.contains('d-none')) {
          this.innerHTML = '<i class="bi bi-chevron-down"></i> Prikaži mere';
        } else {
          this.innerHTML = '<i class="bi bi-chevron-up"></i> Sakrij mere';
        }
      });
    });
  });

  // === EDIT MODAL - POPUNJAVANJE PODATAKA ===
  const editModal = document.getElementById('editVariationModal');
  if (editModal) {
    editModal.addEventListener('show.bs.modal', function(event) {
      const button = event.relatedTarget;
      if (!button || !button.dataset.variation) return;

      let variation;
      try {
        let jsonStr = button.dataset.variation;
        jsonStr = jsonStr.replace(/&quot;/g, '"');
        variation = JSON.parse(jsonStr);
      } catch (e) {
        console.error('Greška pri parsiranju varijacije:', e);
        return;
      }

      const itemId = button.dataset.itemId;
      const form = document.getElementById('editVariationForm');
      if (!form) return;

      form.action = `/admin/artikli/${itemId}/varijacije/${variation.id}?_method=PUT`;

      const sizeEl = document.getElementById('editSize');
      const colorEl = document.getElementById('editColor');
      const amountEl = document.getElementById('editAmount');
      const priceEl = document.getElementById('editPrice');
      const actionPriceEl = document.getElementById('editActionPrice');
      const onActionEl = document.getElementById('editOnAction');

      if (sizeEl) sizeEl.value = variation.velicina || '';
      if (colorEl) colorEl.value = variation.boja || '';
      if (amountEl) amountEl.value = variation.kolicina || 0;
      if (priceEl) priceEl.value = variation.cena || 0;
      if (actionPriceEl) actionPriceEl.value = variation.akcijskaCena || '';
      if (onActionEl) onActionEl.checked = variation.naAkciji || false;

      // Slika preview
      const previewDiv = document.getElementById('editImage_preview');
      if (previewDiv) {
        const imageUrl = variation.slika?.url;
        if (imageUrl) {
          previewDiv.innerHTML = `
            <img src="/images/items/${imageUrl}" alt="Trenutna slika" class="rounded" style="max-height:100px;">
            <p class="text-muted small mt-1">Trenutna slika</p>
          `;
        } else {
          previewDiv.innerHTML = `<p class="text-muted small">Nema slike</p>`;
        }
      }

      // Mere - KORISTI merenjaRaw (originalne podatke)
      const measurementsContainer = document.getElementById('editMeasurementsContainer');
      const toggleBtn = document.querySelector('[data-toggle-measurements-edit]');
      if (measurementsContainer) {
        if (variation.merenjaRaw && Object.keys(variation.merenjaRaw).length > 0) {
          const m = variation.merenjaRaw;
          const fields = ['unit', 'bust', 'chest', 'sleeve', 'length', 'waist', 'hips', 'inseam', 'rise', 'thigh', 'note'];
          fields.forEach(f => {
            const input = form.querySelector(`[name="measurements_${f}"]`);
            if (input && m[f] !== undefined && m[f] !== null) {
              input.value = m[f];
            }
          });
          measurementsContainer.classList.remove('d-none');
          if (toggleBtn) {
            toggleBtn.innerHTML = '<i class="bi bi-chevron-up"></i> Sakrij mere';
          }
        } else {
          measurementsContainer.classList.add('d-none');
          if (toggleBtn) {
            toggleBtn.innerHTML = '<i class="bi bi-chevron-down"></i> Prikaži mere';
          }
        }
      }
    });
  }

})();