/**
 * cart.js – upravljanje korpom na stranici korpe
 */
(function() {
  'use strict';

  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
  const apiToken = document.querySelector('meta[name="api-token"]')?.content;

  // Dugmad za potpuno brisanje
  const removeButtons = document.querySelectorAll('[data-remove-from-cart]');
  // Dugmad za smanjenje količine za 1
  const decreaseButtons = document.querySelectorAll('[data-decrease-quantity]');
  // Dugmad za povećanje količine za 1
  const increaseButtons = document.querySelectorAll('[data-increase-quantity]');

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

  // 🔥 Funkcija za promenu količine
  async function updateCartItem(itemId, variationId, quantity) {
    try {
      await apiRequest('/cart/remove', 'POST', { itemId, variationId, quantity });
      window.location.reload();
    } catch (error) {
      alert(error.message || 'Greška pri ažuriranju korpe');
    }
  }

  // 🔥 Potpuno brisanje – šalje trenutnu količinu
  removeButtons.forEach(btn => {
    btn.addEventListener('click', function(e) {
      const itemId = this.dataset.itemId;
      const variationId = this.dataset.variationId;
      const quantity = parseInt(this.dataset.quantity) || 1;

      if (!itemId || !variationId) {
        alert('Nedostaju podaci o artiklu');
        return;
      }

      if (!confirm('Da li ste sigurni da želite da uklonite ovaj artikal iz korpe?')) {
        return;
      }

      this.disabled = true;
      this.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span>';

      updateCartItem(itemId, variationId, quantity)
        .catch(() => {
          this.disabled = false;
          this.innerHTML = '<i class="bi bi-trash"></i>';
        });
    });
  });

  // 🔥 Smanjenje za 1 – šalje quantity: 1 (ili ako je količina 1, briše artikal)
  decreaseButtons.forEach(btn => {
    btn.addEventListener('click', function(e) {
      const itemId = this.dataset.itemId;
      const variationId = this.dataset.variationId;
      if (!itemId || !variationId) {
        alert('Nedostaju podaci o artiklu');
        return;
      }

      // Opcionalno: proveri da li je količina već 1
      const parent = this.closest('[data-cart-item]');
      const quantitySpan = parent?.querySelector('.fw-bold');
      const currentQuantity = quantitySpan ? parseInt(quantitySpan.textContent) : 0;
      
      if (currentQuantity <= 1) {
        if (!confirm('Količina će biti 0. Da li želite da uklonite artikal?')) {
          return;
        }
      }

      this.disabled = true;
      this.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span>';

      updateCartItem(itemId, variationId, 1)
        .catch(() => {
          this.disabled = false;
          this.innerHTML = '<i class="bi bi-dash"></i>';
        });
    });
  });

  // 🔥 Povećanje za 1 – šalje negativnu količinu? Ne, moramo drugačije.
  // Za povećanje, treba dodati artikal sa quantity: 1, a ne ukloniti.
  // Zato koristimo /cart/add umesto /cart/remove.

  increaseButtons.forEach(btn => {
    btn.addEventListener('click', function(e) {
      const itemId = this.dataset.itemId;
      const variationId = this.dataset.variationId;
      if (!itemId || !variationId) {
        alert('Nedostaju podaci o artiklu');
        return;
      }

      this.disabled = true;
      this.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span>';

      // 🔥 Pozivamo /cart/add sa quantity: 1
      apiRequest('/cart/add', 'POST', { itemId, variationId, quantity: 1 })
        .then(() => {
          window.location.reload();
        })
        .catch((error) => {
          alert(error.message || 'Greška pri dodavanju');
          this.disabled = false;
          this.innerHTML = '<i class="bi bi-plus"></i>';
        });
    });
  });

})();