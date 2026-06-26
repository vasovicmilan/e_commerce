// public/js/admin.js

(function() {
  'use strict';

  // Progress bar – postavlja širinu na osnovu data-progress atributa
  function initProgressBars() {
    const progressBars = document.querySelectorAll('[data-progress-bar]');
    progressBars.forEach(function(bar) {
      const progressContainer = bar.closest('.progress');
      if (progressContainer) {
        const progressValue = parseFloat(progressContainer.getAttribute('data-progress')) || 0;
        bar.style.width = progressValue + '%';
      }
    });
  }

  // Submit button spinner
  function initFormSpinners() {
    const forms = document.querySelectorAll('[data-form]');
    forms.forEach(function(form) {
      form.addEventListener('submit', function(e) {
        const submitBtn = form.querySelector('[data-submit-btn]');
        if (!submitBtn) return;

        const spinner = submitBtn.querySelector('[data-submit-spinner]');
        const label = submitBtn.querySelector('[data-submit-label]');

        // Disable button and show spinner
        submitBtn.disabled = true;
        if (spinner) {
          spinner.classList.remove('d-none');
        }
        if (label) {
          label.textContent = 'Slanje...';
        }
      });
    });
  }

  // File input preview
  function initFilePreviews() {
    const fileInputs = document.querySelectorAll('[data-file-preview]');
    fileInputs.forEach(function(input) {
      const previewContainerId = input.getAttribute('data-file-preview');
      const previewContainer = document.getElementById(previewContainerId);
      if (!previewContainer) return;

      input.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) {
          previewContainer.classList.add('d-none');
          return;
        }

        const reader = new FileReader();
        reader.onload = function(event) {
          const img = previewContainer.querySelector('img');
          if (img) {
            img.src = event.target.result;
            previewContainer.classList.remove('d-none');
          }
        };
        reader.readAsDataURL(file);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      initProgressBars();
      initFormSpinners();
      initFilePreviews();
    });
  } else {
    initProgressBars();
    initFormSpinners();
    initFilePreviews();
  }

})();


document.addEventListener('DOMContentLoaded', function() {
  const autoSubmitElements = document.querySelectorAll('[data-auto-submit]');
  let debounceTimer;

  autoSubmitElements.forEach(function(element) {
    const eventType = element.tagName === 'SELECT' ? 'change' : 'input';

    element.addEventListener(eventType, function(e) {
      if (element.type === 'radio' || element.type === 'checkbox') {
        if (!element.checked) return;
      }

      const form = this.closest('form');
      if (!form) return;

      // Ako je input (text, search, email), sačekaj 300ms pre slanja
      if (element.tagName === 'INPUT' && (element.type === 'text' || element.type === 'search' || element.type === 'email')) {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(function() {
          form.submit();
        }, 300);
      } else {
        form.submit();
      }
    });
  });
});