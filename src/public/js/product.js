(function() {
  'use strict';

  const mainImage = document.getElementById('mainImage');
  const thumbnails = document.querySelectorAll('.thumb-btn');
  const overlay = document.getElementById('imageOverlay');
  const closeOverlay = document.getElementById('closeOverlay');
  const overlayImage = document.getElementById('overlayImage');
  const sizeRadios = document.querySelectorAll('input[name="size"]');
  const colorRadios = document.querySelectorAll('input[name="color"]');
  const measurementsDisplay = document.getElementById('measurementsDisplay');
  const measurementsContent = document.getElementById('measurementsContent');
  const displayPrice = document.getElementById('displayPrice');
  const qtyInput = document.querySelector('[data-qty-input]');
  const qtyMinus = document.querySelector('[data-qty-minus]');
  const qtyPlus = document.querySelector('[data-qty-plus]');
  const addToCartBtn = document.querySelector('[data-add-to-cart]');
  const toggleWishlistBtn = document.querySelector('[data-toggle-wishlist]');

  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
  const apiToken = document.querySelector('meta[name="api-token"]')?.content;

  let variationsData = [];
  const jsonScript = document.getElementById('variationsData');
  if (jsonScript) {
    try {
      variationsData = JSON.parse(jsonScript.textContent);
    } catch (e) {
      variationsData = [];
    }
  }

  if (!variationsData.length) {
    document.querySelectorAll('.variation-section').forEach(el => el.style.display = 'none');
    return;
  }

  function findVariation(size, color) {
    return variationsData.find(v => v.size === size && v.color === color) || null;
  }

  function getColorsForSize(size) {
    return variationsData.filter(v => v.size === size).map(v => v.color);
  }

  function getSizesForColor(color) {
    return variationsData.filter(v => v.color === color).map(v => v.size);
  }

  function getFirstAvailableCombination() {
    return variationsData.length > 0 ? variationsData[0] : null;
  }

  // ============ API POZIVI ============

  async function apiRequest(endpoint, method = 'POST', data = {}) {
    const headers = {
      'Content-Type': 'application/json',
    };
    if (csrfToken) headers['CSRFToken'] = csrfToken;
    if (apiToken) headers['Authorization'] = `Bearer ${apiToken}`;

    const response = await fetch(`/api/v1/shop${endpoint}`, {
      method,
      headers,
      body: method !== 'GET' ? JSON.stringify(data) : undefined,
      credentials: 'same-origin',
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Došlo je do greške');
    }
    return result;
  }

  // ============ AŽURIRANJE BROJAČA KORPE ============

  async function updateCartCount() {
    try {
      const response = await fetch('/api/v1/shop/cart/count', {
        method: 'GET',
        headers: {
          'CSRFToken': csrfToken || '',
          'Authorization': apiToken ? `Bearer ${apiToken}` : '',
        },
        credentials: 'same-origin',
      });
      const result = await response.json();
      const count = result.data?.count || 0;
      const badge = document.querySelector('[data-cart-count]');
      if (badge) {
        badge.textContent = count;
        badge.classList.toggle('d-none', count === 0);
      }
    } catch (error) {
      console.error('Greška pri ažuriranju brojača:', error);
    }
  }

  // ============ KORPA ============

  async function addToCart(itemId, variationId, quantity = 1) {
    try {
      const result = await apiRequest('/cart/add', 'POST', { itemId, variationId, quantity });
      await updateCartCount(); // 🔥 Ažuriraj brojač
      showToast('Proizvod je dodat u korpu', 'success');
      return result;
    } catch (error) {
      showToast(error.message || 'Greška pri dodavanju u korpu', 'danger');
      throw error;
    }
  }

  // ============ WISHLIST ============

  async function toggleWishlist(itemId) {
    try {
      const result = await apiRequest('/wishlist/toggle', 'POST', { itemId });
      const isInWishlist = result.data.inWishlist;
      if (toggleWishlistBtn) {
        const icon = toggleWishlistBtn.querySelector('i');
        if (icon) {
          icon.className = isInWishlist ? 'bi bi-heart-fill' : 'bi bi-heart';
        }
        toggleWishlistBtn.classList.toggle('text-danger', isInWishlist);
      }
      showToast(isInWishlist ? 'Dodato u listu želja' : 'Uklonjeno iz liste želja', 'success');
      return result;
    } catch (error) {
      if (error.message.includes('401')) {
        showToast('Morate biti prijavljeni da biste dodali u listu želja', 'warning');
      } else {
        showToast(error.message || 'Greška pri ažuriranju liste želja', 'danger');
      }
      throw error;
    }
  }

  // ============ TOAST ============

  function showToast(message, type = 'success') {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
      document.body.appendChild(container);
    }

    const toastId = 'toast-' + Date.now();
    const iconMap = {
      success: 'bi-check-circle-fill text-success',
      danger: 'bi-exclamation-triangle-fill text-danger',
      info: 'bi-info-circle-fill text-info',
      warning: 'bi-exclamation-circle-fill text-warning',
    };

    const html = `
      <div id="${toastId}" class="toast align-items-center text-bg-${type} border-0" role="alert" aria-live="assertive" aria-atomic="true">
        <div class="d-flex">
          <div class="toast-body">
            <i class="bi ${iconMap[type] || 'bi-check-circle-fill text-success'} me-2"></i>
            ${message}
          </div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Zatvori"></button>
        </div>
      </div>
    `;

    container.insertAdjacentHTML('beforeend', html);
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement, { delay: 4000 });
    toast.show();

    toastElement.addEventListener('hidden.bs.toast', () => {
      toastElement.remove();
    });
  }

  // ============ VARIJACIJE I INTERFEJS ============

  function updateDisplay() {
    const selectedSize = document.querySelector('input[name="size"]:checked');
    const selectedColor = document.querySelector('input[name="color"]:checked');

    if (!selectedSize || !selectedColor) {
      measurementsDisplay.classList.add('d-none');
      if (qtyInput) {
        qtyInput.max = 0;
        qtyInput.disabled = true;
        if (qtyMinus) qtyMinus.disabled = true;
        if (qtyPlus) qtyPlus.disabled = true;
      }
      return;
    }

    const size = selectedSize.value;
    const color = selectedColor.value;
    const variation = findVariation(size, color);

    if (!variation) {
      measurementsDisplay.classList.add('d-none');
      if (qtyInput) {
        qtyInput.max = 0;
        qtyInput.disabled = true;
        if (qtyMinus) qtyMinus.disabled = true;
        if (qtyPlus) qtyPlus.disabled = true;
      }
      return;
    }

    if (displayPrice) {
      displayPrice.textContent = variation.price + ' RSD';
    }

    if (variation.image && mainImage) {
      mainImage.src = variation.image;
      mainImage.dataset.zoomImage = variation.image;
    }

    if (variation.measurements && Object.keys(variation.measurements).length > 0) {
      measurementsDisplay.classList.remove('d-none');
      let html = '<ul class="list-unstyled mb-0">';
      for (const [key, value] of Object.entries(variation.measurements)) {
        if (key !== 'unit' && value) {
          html += `<li><span class="fw-semibold">${key}:</span> ${value}</li>`;
        }
      }
      html += '</ul>';
      measurementsContent.innerHTML = html;
    } else {
      measurementsDisplay.classList.add('d-none');
    }

    if (qtyInput) {
      const maxAmount = variation.amount || 0;
      qtyInput.max = maxAmount;
      qtyInput.disabled = maxAmount === 0;
      let currentVal = parseInt(qtyInput.value) || 1;
      if (currentVal > maxAmount) {
        qtyInput.value = maxAmount > 0 ? maxAmount : 0;
      }
      if (qtyMinus) qtyMinus.disabled = maxAmount === 0;
      if (qtyPlus) qtyPlus.disabled = maxAmount === 0;
    }
  }

  function onSizeChange() {
    const selectedSize = document.querySelector('input[name="size"]:checked');
    const selectedColor = document.querySelector('input[name="color"]:checked');
    if (!selectedSize) return;

    const size = selectedSize.value;
    const availableColors = getColorsForSize(size);

    if (!selectedColor || !availableColors.includes(selectedColor.value)) {
      const firstColor = availableColors[0];
      if (firstColor) {
        const colorRadio = document.querySelector(`input[name="color"][value="${firstColor}"]`);
        if (colorRadio) colorRadio.checked = true;
      }
    }
    updateDisplay();
  }

  function onColorChange() {
    const selectedColor = document.querySelector('input[name="color"]:checked');
    const selectedSize = document.querySelector('input[name="size"]:checked');
    if (!selectedColor) return;

    const color = selectedColor.value;
    const availableSizes = getSizesForColor(color);

    if (!selectedSize || !availableSizes.includes(selectedSize.value)) {
      const firstSize = availableSizes[0];
      if (firstSize) {
        const sizeRadio = document.querySelector(`input[name="size"][value="${firstSize}"]`);
        if (sizeRadio) sizeRadio.checked = true;
      }
    }
    updateDisplay();
  }

  // ============ EVENT LISTENERI ============

  sizeRadios.forEach(radio => {
    radio.addEventListener('change', onSizeChange);
  });
  colorRadios.forEach(radio => {
    radio.addEventListener('change', onColorChange);
  });

  thumbnails.forEach(btn => {
    btn.addEventListener('click', function() {
      const thumbSrc = this.dataset.thumb;
      if (thumbSrc && mainImage) {
        mainImage.src = thumbSrc;
        mainImage.dataset.zoomImage = thumbSrc;
        if (!overlay.classList.contains('d-none')) {
          overlayImage.src = thumbSrc;
        }
      }
    });
  });

  if (mainImage) {
    mainImage.addEventListener('click', function() {
      const src = this.dataset.zoomImage || this.src;
      overlayImage.src = src;
      overlay.classList.remove('d-none');
      document.body.classList.add('overflow-hidden');
    });
  }

  function closeOverlayHandler() {
    overlay.classList.add('d-none');
    document.body.classList.remove('overflow-hidden');
  }

  if (closeOverlay) {
    closeOverlay.addEventListener('click', closeOverlayHandler);
  }
  if (overlay) {
    overlay.addEventListener('click', function(e) {
      if (e.target === this) {
        closeOverlayHandler();
      }
    });
  }

  if (qtyMinus) {
    qtyMinus.addEventListener('click', function() {
      if (qtyInput) {
        let val = parseInt(qtyInput.value) || 1;
        const max = parseInt(qtyInput.max) || 0;
        if (val > 1) qtyInput.value = val - 1;
      }
    });
  }
  if (qtyPlus) {
    qtyPlus.addEventListener('click', function() {
      if (qtyInput) {
        let val = parseInt(qtyInput.value) || 1;
        const max = parseInt(qtyInput.max) || 0;
        if (val < max) qtyInput.value = val + 1;
      }
    });
  }
  if (qtyInput) {
    qtyInput.addEventListener('change', function() {
      let val = parseInt(this.value) || 1;
      const max = parseInt(this.max) || 0;
      if (val < 1) this.value = 1;
      if (val > max) this.value = max;
    });
  }

  // ============ DUGME "DODAJ U KORPU" ============

  if (addToCartBtn) {
    addToCartBtn.addEventListener('click', function(e) {
      const itemId = this.dataset.itemId;
      const selectedSize = document.querySelector('input[name="size"]:checked');
      const selectedColor = document.querySelector('input[name="color"]:checked');

      let variationId = null;
      if (selectedSize && selectedColor) {
        const size = selectedSize.value;
        const color = selectedColor.value;
        const variation = findVariation(size, color);
        if (variation) {
          variationId = variation.id;
        }
      }

      if (!variationId) {
        showToast('Molimo odaberite veličinu i boju', 'warning');
        return;
      }

      const quantity = parseInt(qtyInput?.value) || 1;
      if (quantity < 1) {
        showToast('Količina mora biti najmanje 1', 'warning');
        return;
      }

      const originalText = this.innerHTML;
      this.disabled = true;
      this.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Dodavanje...';

      addToCart(itemId, variationId, quantity)
        .finally(() => {
          this.disabled = false;
          this.innerHTML = originalText;
        });
    });
  }

  // ============ DUGME "LISTA ŽELJA" ============

  if (toggleWishlistBtn) {
    toggleWishlistBtn.addEventListener('click', function(e) {
      const itemId = this.dataset.itemId;
      if (!itemId) {
        showToast('Nedostaje ID proizvoda', 'danger');
        return;
      }

      const icon = this.querySelector('i');
      if (icon) {
        icon.className = 'bi bi-heart-fill text-danger animate-pulse';
      }

      toggleWishlist(itemId).catch(() => {});
    });
  }

  // ============ INICIJALIZACIJA ============

  const first = getFirstAvailableCombination();
  if (first) {
    const sizeRadio = document.querySelector(`input[name="size"][value="${first.size}"]`);
    const colorRadio = document.querySelector(`input[name="color"][value="${first.color}"]`);
    if (sizeRadio) sizeRadio.checked = true;
    if (colorRadio) colorRadio.checked = true;
    updateDisplay();
  }

  // 🔥 Inicijalno ažuriranje brojača korpe
  updateCartCount();
})();