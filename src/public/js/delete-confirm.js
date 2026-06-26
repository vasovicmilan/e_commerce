document.addEventListener('DOMContentLoaded', function() {
  let currentForm = null;
  const modalElement = document.getElementById('deleteConfirmModal');
  const confirmBtn = document.getElementById('deleteConfirmBtn');
  const messageElement = document.getElementById('deleteConfirmMessage');

  if (!modalElement || !confirmBtn || !messageElement) {
    console.warn('Delete confirmation modal not found – using fallback confirm().');
    document.querySelectorAll('[data-delete]').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        const form = this.closest('form');
        if (!form) return;
        const msg = this.getAttribute('data-confirm') || 'Da li ste sigurni?';
        e.preventDefault();
        if (window.confirm(msg)) {
          form.submit();
        }
      });
    });
    return;
  }

  const bsModal = new bootstrap.Modal(modalElement);

  document.querySelectorAll('[data-delete]').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      const form = this.closest('form');
      if (!form) return;
      currentForm = form;
      const msg = this.getAttribute('data-confirm') || 'Da li ste sigurni da želite da obrišete ovaj zapis?';
      messageElement.textContent = msg;
      bsModal.show();
    });
  });

  confirmBtn.addEventListener('click', function() {
    if (currentForm) {
      currentForm.submit();
      bsModal.hide();
      currentForm = null;
    }
  });

  modalElement.addEventListener('hidden.bs.modal', function() {
    currentForm = null;
  });
});