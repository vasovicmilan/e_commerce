  document.addEventListener('DOMContentLoaded', function() {
    const mobileSearchIcon = document.querySelector('a[href="/prodavnica/pretraga"].d-lg-none');
    const mobileSearchBar = document.getElementById('mobileSearchBar');
    
    if (mobileSearchIcon && mobileSearchBar) {
      mobileSearchIcon.addEventListener('click', function(e) {
        e.preventDefault();
        mobileSearchBar.classList.toggle('d-none');
      });
    }
  });