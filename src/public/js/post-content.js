/**
 * post-content.js
 * Dinamičko upravljanje blokovima sadržaja za blog post
 * Očekuje:
 *   - [data-content-blocks] - kontejner za blokove
 *   - [data-content-add] - dugme za dodavanje novog bloka
 *   - [data-content-remove] - dugme za uklanjanje bloka
 *   - [data-content-block] - wrapper svakog bloka
 *   - [data-upload-image] - dugme za upload slike
 *   - [data-block-type] - select za tip bloka
 *   - [data-block-fields] - grupa polja za određeni tip
 *   - data-post-id na main ili form elementu
 */

(function() {
  'use strict';

  // =============== DOHVATANJE PODATAKA ===============

  const container = document.querySelector('[data-content-blocks]');
  const addBtn = document.querySelector('[data-content-add]');

  if (!container || !addBtn) {
    console.warn('post-content.js: elementi nisu pronađeni');
    return;
  }

  // Dohvati postId sa main ili form elementa
  const mainElement = document.querySelector('[data-post-id]');
  const postId = mainElement ? mainElement.dataset.postId : '';

  // Dohvati CSRF token iz skrivenog inputa
  const csrfInput = document.querySelector('input[name="CSRFToken"]');
  const csrfToken = csrfInput ? csrfInput.value : '';

  // Trenutni maksimalni indeks (da bi novi blokovi dobili jedinstvene indekse)
  let blockIndex = container.querySelectorAll('[data-content-block]').length;

  // =============== POMOĆNE FUNKCIJE ===============

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // =============== KREIRANJE BLOKA ===============

  function createBlock(index, data) {
    data = data || {};
    const type = data.type || 'paragraph';
    const text = data.text || '';
    const level = data.level || 2;
    const items = data.items || [];
    const rows = data.rows || [];
    const src = data.src || '';
    const alt = data.alt || '';

    // Priprema za prikaz
    const itemsStr = items.join('\n');
    const rowsStr = rows.map(row => row.join('\t')).join('\n');

    const div = document.createElement('div');
    div.className = 'card mb-3';
    div.dataset.contentBlock = index;

    div.innerHTML = `
      <div class="card-body">
        <div class="row g-2">
          <!-- Tip bloka -->
          <div class="col-md-12">
            <select name="content[${index}][type]" class="form-select form-select-sm" data-block-type="${index}">
              <option value="heading" ${type === 'heading' ? 'selected' : ''}>Naslov</option>
              <option value="paragraph" ${type === 'paragraph' ? 'selected' : ''}>Paragraf</option>
              <option value="list" ${type === 'list' ? 'selected' : ''}>Lista</option>
              <option value="table" ${type === 'table' ? 'selected' : ''}>Tabela</option>
              <option value="image" ${type === 'image' ? 'selected' : ''}>Slika</option>
              <option value="quote" ${type === 'quote' ? 'selected' : ''}>Citat</option>
            </select>
          </div>

          <!-- Glavni tekst -->
          <div class="col-md-12">
            <textarea name="content[${index}][text]" class="form-control form-control-sm" rows="3"
                      placeholder="Tekst">${escapeHtml(text)}</textarea>
          </div>

          <!-- Polja specifična za tip -->
          <div class="col-md-12">
            <!-- heading: nivo -->
            <div class="row g-1 js-field-group d-none" data-block-fields="heading">
              <div class="col-md-6">
                <label class="small text-muted">Nivo headinga</label>
                <input type="number" name="content[${index}][level]" class="form-control form-control-sm"
                       value="${level}" min="1" max="6" step="1">
              </div>
            </div>

            <!-- list: items -->
            <div class="row g-1 js-field-group d-none" data-block-fields="list">
              <div class="col-md-12">
                <label class="small text-muted">Stavke liste (jedna po redu)</label>
                <textarea name="content[${index}][items]" class="form-control form-control-sm" rows="3"
                          placeholder="Stavka 1&#10;Stavka 2&#10;Stavka 3">${escapeHtml(itemsStr)}</textarea>
                <small class="text-muted">Svaka stavka u novom redu</small>
              </div>
            </div>

            <!-- table: rows -->
            <div class="row g-1 js-field-group d-none" data-block-fields="table">
              <div class="col-md-12">
                <label class="small text-muted">Tabela (redovi, kolone odvojene TAB-om)</label>
                <textarea name="content[${index}][rows]" class="form-control form-control-sm" rows="4"
                          placeholder="Kolona1\tKolona2\tKolona3&#10;Red1\tVrednost1\tVrednost2">${escapeHtml(rowsStr)}</textarea>
                <small class="text-muted">Prvi red su zaglavlja (opciono), svaki novi red je novi red tabele</small>
              </div>
            </div>

            <!-- image: src i alt -->
            <div class="row g-1 js-field-group d-none" data-block-fields="image">
              <div class="col-md-8">
                <label class="small text-muted">URL slike</label>
                <input type="text" name="content[${index}][src]" class="form-control form-control-sm"
                       value="${escapeHtml(src)}" placeholder="https://...">
              </div>
              <div class="col-md-4">
                <label class="small text-muted">&nbsp;</label>
                <button type="button" class="btn btn-sm btn-outline-primary w-100" data-upload-image="${index}">
                  <i class="bi bi-upload"></i> Upload
                </button>
              </div>
              <div class="col-md-12">
                <label class="small text-muted">Alt tekst</label>
                <input type="text" name="content[${index}][alt]" class="form-control form-control-sm"
                       value="${escapeHtml(alt)}" placeholder="Opis slike">
              </div>
            </div>
          </div>

          <!-- Dugme za uklanjanje -->
          <div class="col-md-12 text-end">
            <button type="button" class="btn btn-sm btn-outline-danger" data-content-remove="${index}">
              <i class="bi bi-trash"></i> Obriši blok
            </button>
          </div>
        </div>
      </div>
    `;

    // === Postavi event listenere ===

    // 1. Promena tipa bloka
    const typeSelect = div.querySelector('[data-block-type]');
    typeSelect.addEventListener('change', function() {
      const selectedType = this.value;
      const groups = div.querySelectorAll('.js-field-group');
      groups.forEach(group => {
        const fieldType = group.dataset.blockFields;
        if (fieldType === selectedType) {
          group.classList.remove('d-none');
        } else {
          group.classList.add('d-none');
        }
      });
    });

    // 2. Uklanjanje bloka
    const removeBtn = div.querySelector('[data-content-remove]');
    if (removeBtn) {
      removeBtn.addEventListener('click', function() {
        div.remove();
      });
    }

    // 3. Upload slike
    const uploadBtn = div.querySelector('[data-upload-image]');
    if (uploadBtn) {
      uploadBtn.addEventListener('click', function(e) {
        e.preventDefault();
        const blockIdx = this.dataset.uploadImage;
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.onchange = function() {
          const file = this.files[0];
          if (!file) return;

          const formData = new FormData();
          formData.append('contentImage', file);
          formData.append('CSRFToken', csrfToken);

          fetch(`/admin/blog/${postId}/upload-image`, {
            method: 'POST',
            headers: { 'CSRFToken': csrfToken },
            body: formData
          })
          .then(response => response.json())
          .then(data => {
            if (data.success) {
              const srcInput = div.querySelector(`input[name*="[src]"]`);
              if (srcInput) srcInput.value = data.url;
              // Kratka povratna informacija
              const feedback = document.createElement('div');
              feedback.className = 'alert alert-success alert-dismissible fade show mt-2 small';
              feedback.innerHTML = 'Slika je uspešno upload-ovana!';
              div.querySelector('.js-field-group[data-block-fields="image"]').appendChild(feedback);
              setTimeout(() => feedback.remove(), 3000);
            } else {
              alert('Greška pri upload-u: ' + (data.error || 'nepoznata'));
            }
          })
          .catch(err => {
            alert('Greška pri upload-u: ' + err.message);
          });
        };
        fileInput.click();
      });
    }

    return div;
  }

  // =============== DODAVANJE NOVOG BLOKA ===============

  function addBlock() {
    const index = blockIndex++;
    const block = createBlock(index);
    container.appendChild(block);
  }

  // =============== INICIJALIZACIJA ===============

  // Event listener za dugme "Dodaj blok"
  addBtn.addEventListener('click', addBlock);

  // Postojeći blokovi: osluškivanje za uklanjanje i upload
  container.querySelectorAll('[data-content-remove]').forEach(btn => {
    btn.addEventListener('click', function() {
      const block = this.closest('[data-content-block]');
      if (block) block.remove();
    });
  });

  // Postojeći blokovi: osluškivanje za upload (ako već nisu obrađeni)
  container.querySelectorAll('[data-upload-image]').forEach(btn => {
    // Ako već ima event listener, preskačemo (ali za sigurnost, dodajemo)
    // Prevencija dupliranja: uklonimo postojeće pa dodamo nove
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);

    newBtn.addEventListener('click', function(e) {
      e.preventDefault();
      const blockIdx = this.dataset.uploadImage;
      // Pronađi roditeljski blok
      const block = this.closest('[data-content-block]');
      if (!block) return;

      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'image/*';
      fileInput.onchange = function() {
        const file = this.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('contentImage', file);
        formData.append('CSRFToken', csrfToken);

        fetch(`/admin/blog/${postId}/upload-image`, {
          method: 'POST',
          headers: { 'CSRFToken': csrfToken },
          body: formData
        })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            const srcInput = block.querySelector(`input[name*="[src]"]`);
            if (srcInput) srcInput.value = data.url;
            const feedback = document.createElement('div');
            feedback.className = 'alert alert-success alert-dismissible fade show mt-2 small';
            feedback.innerHTML = 'Slika je uspešno upload-ovana!';
            block.querySelector('.js-field-group[data-block-fields="image"]').appendChild(feedback);
            setTimeout(() => feedback.remove(), 3000);
          } else {
            alert('Greška pri upload-u: ' + (data.error || 'nepoznata'));
          }
        })
        .catch(err => {
          alert('Greška pri upload-u: ' + err.message);
        });
      };
      fileInput.click();
    });
  });

  // Postojeći blokovi: inicijalno prikaži odgovarajuća polja na osnovu tipa
  container.querySelectorAll('[data-content-block]').forEach(block => {
    const typeSelect = block.querySelector('[data-block-type]');
    if (typeSelect) {
      const selectedType = typeSelect.value;
      const groups = block.querySelectorAll('.js-field-group');
      groups.forEach(group => {
        const fieldType = group.dataset.blockFields;
        if (fieldType === selectedType) {
          group.classList.remove('d-none');
        } else {
          group.classList.add('d-none');
        }
      });
    }
  });

})();