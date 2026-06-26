// profile.js – Delete modal logic

document.addEventListener('DOMContentLoaded', function() {
  const deleteButtons = document.querySelectorAll('.delete-btn');
  const deleteForm = document.getElementById('deleteForm');

  if (!deleteForm) return;

  deleteButtons.forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      const action = this.dataset.action;
      if (action) {
        deleteForm.action = action;
        const modal = new bootstrap.Modal(document.getElementById('deleteModal'));
        modal.show();
      }
    });
  });
});