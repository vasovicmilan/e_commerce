/**
 * profile.js
 * Upravljanje modalom za brisanje na profilu
 */
document.addEventListener('DOMContentLoaded', function() {
  const deleteButtons = document.querySelectorAll('.delete-btn');
  const deleteForm = document.getElementById('deleteForm');

  if (deleteForm) {
    deleteButtons.forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        const action = this.dataset.action;
        if (action) {
          deleteForm.action = action;
        }
      });
    });
  }

  // CSRF token za fetch zahteve (ako se koriste)
  const csrfToken = document.querySelector('input[name="CSRFToken"]')?.value;
  if (csrfToken) {
    window.csrfToken = csrfToken;
  }
});