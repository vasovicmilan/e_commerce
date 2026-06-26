/**
 * details.js
 * Inicijalizacija Bootstrap popover-a za mere na detaljima artikla
 */

(function() {
  'use strict';

  // Funkcija za generisanje HTML sadržaja popover-a iz JSON podataka
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

  // Inicijalizacija Bootstrap popover-a
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

})();