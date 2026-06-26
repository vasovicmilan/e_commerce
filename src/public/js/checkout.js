/**
 * checkout.js
 * Checkout page functionality
 * Dependencies: Bootstrap 5 (already loaded)
 */

(function() {
    'use strict';

    document.addEventListener('DOMContentLoaded', function() {
        
        // --- DOM Elements ---
        const telephoneRadioSaved = document.querySelector('input[name="telephoneSelection"][value="saved"]');
        const telephoneRadioNew = document.querySelector('input[name="telephoneSelection"][value="new"]');
        const savedTelephoneDiv = document.getElementById('saved-telephone-container');
        const newTelephoneDiv = document.getElementById('new-telephone-container');
        const hasNewTelephoneInput = document.getElementById('hasNewTelephone');

        const addressRadioSaved = document.querySelector('input[name="addressSelection"][value="saved"]');
        const addressRadioNew = document.querySelector('input[name="addressSelection"][value="new"]');
        const savedAddressDiv = document.getElementById('saved-address-container');
        const newAddressDiv = document.getElementById('new-address-container');
        const hasNewAddressInput = document.getElementById('hasNewAddress');

        const couponInput = document.getElementById('couponCode');
        const applyCouponBtn = document.getElementById('applyCouponBtn');
        const couponMessageDiv = document.getElementById('couponMessage');
        const couponMessageText = document.getElementById('couponMessageText');
        const appliedCouponHidden = document.getElementById('appliedCoupon');
        const discountRow = document.getElementById('discountRow');
        const discountAmountSpan = document.getElementById('discountAmount');
        const totalPriceSpan = document.getElementById('totalPrice');
        const checkoutForm = document.getElementById('checkout-form');
        const submitBtn = document.getElementById('submitOrderBtn');

        const removeCouponBtn = document.getElementById('removeCouponBtn');
        const removeCouponWrapper = document.getElementById('removeCouponWrapper');

        // --- CSRF & API Token from meta tags ---
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
        const apiToken = document.querySelector('meta[name="api-token"]')?.content;

        let originalTotal = 0;
        let currentDiscount = 0;

        if (totalPriceSpan && totalPriceSpan.dataset.originalTotal) {
            originalTotal = parseFloat(totalPriceSpan.dataset.originalTotal);
        }

        // --- Toast Message ---
        function showToastMessage(message, type) {
            let toastContainer = document.getElementById('toast-container');
            if (!toastContainer) {
                toastContainer = document.createElement('div');
                toastContainer.id = 'toast-container';
                toastContainer.className = 'position-fixed bottom-0 end-0 p-3';
                toastContainer.style.zIndex = '1055';
                document.body.appendChild(toastContainer);
            }

            const bgClass = type === 'success' ? 'bg-success' : 'bg-danger';
            const toastEl = document.createElement('div');
            toastEl.className = 'toast align-items-center text-white border-0 mb-2';
            toastEl.setAttribute('role', 'alert');
            toastEl.setAttribute('aria-live', 'assertive');
            toastEl.setAttribute('aria-atomic', 'true');
            toastEl.setAttribute('data-bs-autohide', 'true');
            toastEl.setAttribute('data-bs-delay', '5000');
            
            toastEl.innerHTML = `
                <div class="d-flex ${bgClass} rounded">
                    <div class="toast-body">${message}</div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
            `;
            
            toastContainer.appendChild(toastEl);
            const toast = new bootstrap.Toast(toastEl);
            toast.show();
            toastEl.addEventListener('hidden.bs.toast', function() {
                toastEl.remove();
            });
        }

        // --- Coupon Message ---
        function showCouponMessage(message, type) {
            if (couponMessageDiv && couponMessageText) {
                couponMessageText.textContent = message;
                couponMessageDiv.classList.remove('d-none');
                couponMessageDiv.classList.remove('text-success', 'text-danger');
                couponMessageDiv.classList.add(type === 'success' ? 'text-success' : 'text-danger');
            }
        }

        // --- Update Total Price ---
        function updateTotalPrice() {
            if (totalPriceSpan) {
                const newTotal = originalTotal - currentDiscount;
                totalPriceSpan.textContent = newTotal.toFixed(0) + ' RSD';
            }
            if (discountAmountSpan) {
                discountAmountSpan.textContent = '-' + currentDiscount.toFixed(0) + ' RSD';
            }
            if (discountRow) {
                discountRow.classList.toggle('d-none', currentDiscount <= 0);
            }

            if (removeCouponWrapper) {
                if (currentDiscount > 0) {
                    removeCouponWrapper.classList.remove('d-none');
                } else {
                    removeCouponWrapper.classList.add('d-none');
                }
            }
        }

        // --- API Request (sa sigurnom ekstrakcijom poruke) ---
        async function apiRequest(endpoint, method = 'POST', data = null) {
            const headers = {
                'Content-Type': 'application/json',
            };
            if (csrfToken) headers['CSRFToken'] = csrfToken;
            if (apiToken) headers['Authorization'] = `Bearer ${apiToken}`;

            const options = { method, headers, credentials: 'same-origin' };
            if (data) options.body = JSON.stringify(data);

            const response = await fetch(`/api/v1/shop${endpoint}`, options);
            
            let result;
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                result = await response.json();
            } else {
                const text = await response.text();
                throw new Error(text || 'Neočekivani odgovor servera.');
            }

            // Ako je odgovor neuspešan (status ili success: false)
            if (!response.ok || (result && result.success === false)) {
                // 🔥 SIGURNO IZVLAČENJE PORUKE
                let msg = null;
                
                // 1. Pokušaj direktno iz result.message
                if (result.message && typeof result.message === 'string') {
                    msg = result.message;
                }
                // 2. Pokušaj iz result.error
                else if (result.error && typeof result.error === 'string') {
                    msg = result.error;
                }
                // 3. Pokušaj iz result.msg
                else if (result.msg && typeof result.msg === 'string') {
                    msg = result.msg;
                }
                // 4. Ako je message objekat, pokušaj da izvučeš prvu grešku
                else if (result.message && typeof result.message === 'object') {
                    if (result.message.errors && Array.isArray(result.message.errors)) {
                        const first = result.message.errors[0];
                        msg = first.msg || first.message || first || 'Greška u validaciji.';
                    } else if (result.message.error) {
                        msg = result.message.error;
                    } else {
                        const values = Object.values(result.message);
                        if (values.length > 0 && typeof values[0] === 'string') {
                            msg = values[0];
                        }
                    }
                }
                // 5. Ako ima error i on je objekat
                else if (result.error && typeof result.error === 'object') {
                    if (result.error.message) {
                        msg = result.error.message;
                    } else {
                        msg = JSON.stringify(result.error);
                    }
                }
                
                // 6. Ako nismo našli poruku, a imamo errorId – NE KORISTI GA!
                if (!msg || msg === '') {
                    msg = 'Došlo je do greške. Pokušajte ponovo.';
                }
                
                // Osiguraj da msg bude string
                if (typeof msg !== 'string') {
                    msg = String(msg);
                }
                
                throw new Error(msg);
            }
            return result;
        }

        // --- Apply Coupon ---
        async function applyCoupon() {
            if (!couponInput) return;
            const code = couponInput.value.trim();
            if (!code) {
                showCouponMessage('Unesite kod kupona.', 'error');
                return;
            }

            if (applyCouponBtn) {
                applyCouponBtn.disabled = true;
                const originalText = applyCouponBtn.innerHTML;
                applyCouponBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Proveravam...';

                try {
                    const result = await apiRequest('/cart/coupon', 'POST', { code });
                    currentDiscount = parseFloat(result.data.discount) || 0;
                    updateTotalPrice();
                    if (appliedCouponHidden) {
                        appliedCouponHidden.value = code;
                    }
                    showCouponMessage(`Kupon "${code}" primenjen! Popust: ${currentDiscount.toFixed(0)} RSD`, 'success');
                } catch (error) {
                    // ❌ Prikazujemo tačnu poruku sa servera
                    if (!appliedCouponHidden || !appliedCouponHidden.value) {
                        currentDiscount = 0;
                        updateTotalPrice();
                    }
                    showCouponMessage(error.message || 'Kupon nije validan.', 'error');
                } finally {
                    applyCouponBtn.disabled = false;
                    applyCouponBtn.innerHTML = originalText;
                }
            }
        }

        // --- Remove Coupon (manual) ---
        async function removeCoupon() {
            if (!appliedCouponHidden || !appliedCouponHidden.value) {
                showCouponMessage('Nema aktivnog kupona za uklanjanje.', 'warning');
                return;
            }
            try {
                await apiRequest('/cart/coupon', 'DELETE');
                currentDiscount = 0;
                updateTotalPrice();
                if (appliedCouponHidden) {
                    appliedCouponHidden.value = '';
                }
                if (couponInput) {
                    couponInput.value = '';
                }
                showCouponMessage('Kupon je uklonjen.', 'success');
            } catch (error) {
                console.error('Remove coupon error:', error);
                showCouponMessage('Greška pri uklanjanju kupona.', 'error');
            }
        }

        // --- Telephone Selection Logic ---
        if (telephoneRadioSaved && telephoneRadioNew) {
            function updateTelephoneVisibility() {
                const isSaved = telephoneRadioSaved.checked;
                if (savedTelephoneDiv) savedTelephoneDiv.classList.toggle('d-none', !isSaved);
                if (newTelephoneDiv) newTelephoneDiv.classList.toggle('d-none', isSaved);
                if (hasNewTelephoneInput) hasNewTelephoneInput.value = isSaved ? 'false' : 'true';

                const newTelInput = document.querySelector('input[name="newTelephone"]');
                const savedTelSelect = document.querySelector('select[name="telephoneId"]');
                if (newTelInput) {
                    newTelInput.disabled = isSaved;
                    if (isSaved) {
                        newTelInput.removeAttribute('required');
                    } else {
                        newTelInput.setAttribute('required', 'required');
                    }
                }
                if (savedTelSelect) {
                    savedTelSelect.disabled = !isSaved;
                    if (isSaved) {
                        savedTelSelect.setAttribute('required', 'required');
                    } else {
                        savedTelSelect.removeAttribute('required');
                    }
                }
            }
            telephoneRadioSaved.addEventListener('change', updateTelephoneVisibility);
            telephoneRadioNew.addEventListener('change', updateTelephoneVisibility);
            updateTelephoneVisibility();
        }

        // --- Address Selection Logic ---
        if (addressRadioSaved && addressRadioNew) {
            function updateAddressVisibility() {
                const isSaved = addressRadioSaved.checked;
                if (savedAddressDiv) savedAddressDiv.classList.toggle('d-none', !isSaved);
                if (newAddressDiv) newAddressDiv.classList.toggle('d-none', isSaved);
                if (hasNewAddressInput) hasNewAddressInput.value = isSaved ? 'false' : 'true';

                const newAddrInputs = document.querySelectorAll('input[name^="newAddress"]');
                const savedAddrSelect = document.querySelector('select[name="addressId"]');
                
                newAddrInputs.forEach(input => {
                    input.disabled = isSaved;
                    if (isSaved) {
                        input.removeAttribute('required');
                    } else {
                        input.setAttribute('required', 'required');
                    }
                });
                if (savedAddrSelect) {
                    savedAddrSelect.disabled = !isSaved;
                    if (isSaved) {
                        savedAddrSelect.setAttribute('required', 'required');
                    } else {
                        savedAddrSelect.removeAttribute('required');
                    }
                }
            }
            addressRadioSaved.addEventListener('change', updateAddressVisibility);
            addressRadioNew.addEventListener('change', updateAddressVisibility);
            updateAddressVisibility();
        }

        // --- Coupon: apply button ---
        if (applyCouponBtn) {
            applyCouponBtn.addEventListener('click', applyCoupon);
        }

        // --- Coupon: manual remove button ---
        if (removeCouponBtn) {
            removeCouponBtn.addEventListener('click', removeCoupon);
        }

        // --- Form submission validation ---
        if (checkoutForm) {
            checkoutForm.addEventListener('submit', function(e) {
                const acceptTerms = document.querySelector('input[name="acceptTerms"]');
                if (!acceptTerms || !acceptTerms.checked) {
                    e.preventDefault();
                    showToastMessage('Morate prihvatiti uslove korišćenja.', 'error');
                    return;
                }
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Obrada...';
                }
            });
        }

        // --- Prefill coupon auto-apply ---
        const prefillCoupon = document.getElementById('checkout-form')?.dataset.prefillCoupon;
        if (prefillCoupon && prefillCoupon !== '' && couponInput) {
            couponInput.value = prefillCoupon;
            applyCoupon();
        }

        // --- Initial update ---
        updateTotalPrice();
        
    });
})();