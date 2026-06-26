/**
 * seo.js
 * Dinamičko dodavanje i uklanjanje FAQ stavki na SEO strani
 */

(function() {
  'use strict';

  // Lista popularnih Bootstrap ikonica (možeš proširiti po potrebi)
  const ICONS = [
    'bi-question-circle',
    'bi-info-circle',
    'bi-check-circle',
    'bi-x-circle',
    'bi-exclamation-circle',
    'bi-star',
    'bi-heart',
    'bi-thumbs-up',
    'bi-thumbs-down',
    'bi-shield-check',
    'bi-truck',
    'bi-credit-card',
    'bi-wallet',
    'bi-cart',
    'bi-bag',
    'bi-box',
    'bi-gift',
    'bi-clock',
    'bi-calendar',
    'bi-tag',
    'bi-tags',
    'bi-search',
    'bi-envelope',
    'bi-telephone',
    'bi-chat',
    'bi-chat-dots',
    'bi-person',
    'bi-people',
    'bi-gear',
    'bi-cog',
    'bi-lock',
    'bi-unlock',
    'bi-key',
    'bi-pencil',
    'bi-trash',
    'bi-plus',
    'bi-dash',
    'bi-arrow-right',
    'bi-arrow-left',
    'bi-arrow-up',
    'bi-arrow-down',
    'bi-house',
    'bi-shop',
    'bi-building',
    'bi-globe',
    'bi-map-pin',
    'bi-phone',
    'bi-laptop',
    'bi-printer',
    'bi-camera',
    'bi-video',
    'bi-music-note',
    'bi-headphones',
  ];

  const container = document.querySelector('[data-faq-container]');
  const addBtn = document.querySelector('[data-faq-add]');

  if (!container || !addBtn) return;

  // Generisanje HTML opcija za select (bez HTML unutar option)
  function getIconOptions(selected = '') {
    return ICONS.map(icon => {
      const isSelected = icon === selected ? 'selected' : '';
      return `<option value="${icon}" ${isSelected}>${icon}</option>`;
    }).join('');
  }

  // Pronalaženje sledećeg slobodnog indeksa
  function getNextIndex() {
    const items = container.querySelectorAll('[data-faq-item]');
    let max = -1;
    items.forEach(el => {
      const idx = parseInt(el.dataset.faqItem, 10);
      if (!isNaN(idx) && idx > max) max = idx;
    });
    return max + 1;
  }

  // Kreiranje novog reda (sa praznim poljima ili zadatim vrednostima)
  function createFaqRow(index, question = '', answer = '', icon = '') {
    const row = document.createElement('div');
    row.className = 'row g-2 mb-2';
    row.dataset.faqItem = index;

    row.innerHTML = `
      <div class="col-md-4">
        <input type="text" name="faq[${index}][question]" class="form-control form-control-sm" 
               value="${question.replace(/"/g, '&quot;')}" placeholder="Pitanje">
      </div>
      <div class="col-md-4">
        <input type="text" name="faq[${index}][answer]" class="form-control form-control-sm" 
               value="${answer.replace(/"/g, '&quot;')}" placeholder="Odgovor">
      </div>
      <div class="col-md-3">
        <select name="faq[${index}][icon]" class="form-select form-select-sm">
          <option value="">Bez ikonice</option>
          ${getIconOptions(icon)}
        </select>
        <span class="faq-icon-preview ms-2"></span>
      </div>
      <div class="col-md-1">
        <button type="button" class="btn btn-sm btn-outline-danger" data-faq-remove>
          <i class="bi bi-trash"></i>
        </button>
      </div>
    `;

    return row;
  }

  // Reindeksiranje svih redova (0,1,2,...) nakon brisanja
  function reindex() {
    const rows = container.querySelectorAll('[data-faq-item]');
    rows.forEach((row, newIndex) => {
      row.dataset.faqItem = newIndex;
      const inputs = row.querySelectorAll('input, select');
      inputs.forEach(input => {
        const name = input.getAttribute('name');
        if (name) {
          const newName = name.replace(/\[\d+\]/, `[${newIndex}]`);
          input.setAttribute('name', newName);
        }
      });
    });
  }

  // Inicijalizacija postojećih selectova – dodavanje svih ikonica i postavljanje preview-a
  function initSelects() {
    const selects = container.querySelectorAll('select[name*="[icon]"]');
    selects.forEach(select => {
      const currentVal = select.value; // vrednost koju smo postavili iz EJS (npr. 'bi-star')
      // Brišemo sve opcije osim prve (prazne)
      while (select.options.length > 0) {
        select.remove(0);
      }
      // Dodajemo praznu opciju
      const emptyOpt = document.createElement('option');
      emptyOpt.value = '';
      emptyOpt.textContent = 'Bez ikonice';
      select.appendChild(emptyOpt);
      // Dodajemo sve ikonice
      ICONS.forEach(icon => {
        const opt = document.createElement('option');
        opt.value = icon;
        opt.textContent = icon;
        select.appendChild(opt);
      });
      // Ako je postojala vrednost i validna je, postavljamo je
      if (currentVal && ICONS.includes(currentVal)) {
        select.value = currentVal;
      }
      // Postavljamo preview
      const row = select.closest('[data-faq-item]');
      if (row) {
        const preview = row.querySelector('.faq-icon-preview');
        if (preview) {
          const icon = select.value;
          preview.innerHTML = icon ? `<i class="bi ${icon}"></i>` : '';
        }
      }
    });
  }

  // Dodavanje nove FAQ stavke
  addBtn.addEventListener('click', function(e) {
    e.preventDefault();
    const index = getNextIndex();
    const newRow = createFaqRow(index);
    container.appendChild(newRow);
    // Automatski fokus na prvo polje
    const firstInput = newRow.querySelector('input');
    if (firstInput) firstInput.focus();
  });

  // Brisanje FAQ stavke (delegacija)
  container.addEventListener('click', function(e) {
    const removeBtn = e.target.closest('[data-faq-remove]');
    if (!removeBtn) return;

    e.preventDefault();
    const row = removeBtn.closest('[data-faq-item]');
    if (!row) return;

    // Ako ima više od jednog reda, brišemo i reindeksiramo
    if (container.querySelectorAll('[data-faq-item]').length > 1) {
      row.remove();
      reindex();
    } else {
      // Ako je poslednji red, samo ga brišemo (ostaje prazan kontejner)
      row.remove();
    }
  });

  // Prikazivanje preview ikonice prilikom promene selecta
  container.addEventListener('change', function(e) {
    const select = e.target.closest('select[name*="[icon]"]');
    if (!select) return;
    const row = select.closest('[data-faq-item]');
    if (!row) return;
    const preview = row.querySelector('.faq-icon-preview');
    if (!preview) return;
    const icon = select.value;
    preview.innerHTML = icon ? `<i class="bi ${icon}"></i>` : '';
  });

  // Pokrećemo inicijalizaciju nakon što se DOM učita
  document.addEventListener('DOMContentLoaded', function() {
    initSelects();
  });

})();