/**
 * post-seo.js
 * Dinamičko upravljanje FAQ stavkama za blog post
 * Očekuje:
 *   - [data-faq-container] - kontejner za FAQ stavke
 *   - [data-faq-add] - dugme za dodavanje nove FAQ stavke
 *   - [data-faq-remove] - dugme za uklanjanje FAQ stavke
 *   - [data-faq-item] - wrapper svake FAQ stavke
 */

(function() {
  'use strict';

  const container = document.querySelector('[data-faq-container]');
  const addBtn = document.querySelector('[data-faq-add]');

  if (!container || !addBtn) {
    console.warn('post-seo.js: elementi nisu pronađeni');
    return;
  }

  // Brojač za generisanje jedinstvenih indeksa
  let faqIndex = container.querySelectorAll('[data-faq-item]').length;

  /**
   * Kreira novu FAQ stavku sa unikatnim indeksom
   */
  function createFaqItem(index) {
    const div = document.createElement('div');
    div.className = 'row g-2 mb-2';
    div.dataset.faqItem = index;
    div.innerHTML = `
      <div class="col-md-5">
        <input type="text" name="faq[${index}][question]" class="form-control form-control-sm" placeholder="Pitanje">
      </div>
      <div class="col-md-5">
        <input type="text" name="faq[${index}][answer]" class="form-control form-control-sm" placeholder="Odgovor">
      </div>
      <div class="col-md-2">
        <button type="button" class="btn btn-sm btn-outline-danger" data-faq-remove="${index}">
          <i class="bi bi-trash"></i>
        </button>
      </div>
    `;
    return div;
  }

  /**
   * Dodaje novu FAQ stavku na kraj kontejnera
   */
  function addFaq() {
    const index = faqIndex++;
    const item = createFaqItem(index);
    container.appendChild(item);

    // Osluškivanje za uklanjanje nove stavke
    const removeBtn = item.querySelector('[data-faq-remove]');
    if (removeBtn) {
      removeBtn.addEventListener('click', function() {
        item.remove();
      });
    }
  }

  // Event listener za dugme "Dodaj FAQ"
  addBtn.addEventListener('click', addFaq);

  // Osluškivanje za postojeća dugmad za uklanjanje
  container.querySelectorAll('[data-faq-remove]').forEach(btn => {
    btn.addEventListener('click', function() {
      const item = this.closest('[data-faq-item]');
      if (item) item.remove();
    });
  });

})();