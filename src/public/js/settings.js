document.addEventListener('DOMContentLoaded', function() {
  const deactivateBtn = document.getElementById('deactivateBtn');
  if (deactivateBtn) {
    deactivateBtn.addEventListener('click', function(e) {
      if (!confirm('Da li ste sigurni da želite da deaktivirate nalog?')) {
        e.preventDefault();
      }
    });
  }
});