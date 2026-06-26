// presenters/public/public.presenter.js

/* =====================================================
   STATIČKI SADRŽAJ ZA STRANICE (bogat, strukturiran, sa ikonama)
   ===================================================== */
const STATIC_CONTENT = {
  about: `
    <div class="mb-5">
      <p class="lead fs-4">Savremena online prodavnica ženske garderobe – jednostavno, brzo i sigurno.</p>
      <p>Tophelanke je online prodavnica posvećena reklamiranju i prodaji <strong>savremene ženske garderobe</strong>. Naša ponuda uključuje <strong>helanke, farmerice, kupaće, pantalone, trenerke, fitness komplete, majice, šorceve</strong> i još mnogo toga.</p>
      <p>Sa sedištem u <strong>Novom Sadu</strong>, naš cilj je da obezbedimo <strong>brzo i lako poručivanje, sigurnu kupovinu i vrhunsku uslugu</strong>.</p>
      <p>Nudimo mogućnost <strong>povrata novca ili zamene, PostExpress dostavu</strong>, te ogromnu paletu veličina, modela i boja kako bi svaka žena pronašla svoj savršen stil.</p>
    </div>

    <!-- 3 kolone benefita -->
    <div class="row g-4 mb-5">
      <div class="col-md-4">
        <div class="card h-100 border-0 shadow-sm text-center">
          <div class="card-body">
            <i class="bi bi-truck fs-1 text-primary mb-3"></i>
            <h3 class="h5">Brza dostava</h3>
            <p class="text-muted">Isporuka u roku od 2–5 radnih dana, mogućnost praćenja pošiljke.</p>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card h-100 border-0 shadow-sm text-center">
          <div class="card-body">
            <i class="bi bi-arrow-repeat fs-1 text-primary mb-3"></i>
            <h3 class="h5">Jednostavna zamena</h3>
            <p class="text-muted">Zamena ili povrat novca u roku od 14 dana, bez pitanja.</p>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card h-100 border-0 shadow-sm text-center">
          <div class="card-body">
            <i class="bi bi-shield-lock fs-1 text-primary mb-3"></i>
            <h3 class="h5">Sigurna kupovina</h3>
            <p class="text-muted">SSL enkripcija, sigurno plaćanje i zaštita podataka.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Benefiti naloga i misija u dve kolone -->
    <div class="row g-4 mb-5">
      <div class="col-md-6">
        <div class="card h-100 border-0 shadow-sm">
          <div class="card-body">
            <h3 class="h4 mb-3"><i class="bi bi-person-circle me-2"></i> Benefiti kreiranja naloga</h3>
            <ul class="list-unstyled">
              <li class="mb-2"><i class="bi bi-check-lg text-primary me-2"></i> Lako poručivanje i brzo plaćanje</li>
              <li class="mb-2"><i class="bi bi-check-lg text-primary me-2"></i> Praćenje statusa i istorije porudžbina</li>
              <li class="mb-2"><i class="bi bi-check-lg text-primary me-2"></i> Lista želja (wishlist)</li>
              <li class="mb-2"><i class="bi bi-check-lg text-primary me-2"></i> Newsletter sa najnovijim ponudama</li>
              <li class="mb-2"><i class="bi bi-check-lg text-primary me-2"></i> Personalizovana podrška</li>
            </ul>
          </div>
        </div>
      </div>
      <div class="col-md-6">
        <div class="card h-100 border-0 shadow-sm">
          <div class="card-body">
            <h3 class="h4 mb-3"><i class="bi bi-gem me-2"></i> Naša misija</h3>
            <p>Omogućiti ženama širom zemlje da uživaju u vrhunskom stilu uz pouzdanu i sigurnu online kupovinu. Kontinuirano unapređujemo sistem – od jednostavnog poručivanja do napredne administracije.</p>
            <p class="mb-0">Partnerima omogućavamo personalizovane prodavnice, dok se mi brinemo o logistici, dostavi i finansijama.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Pratite nas + dodatne informacije -->
    <div class="mb-4">
      <h3 class="h4"><i class="bi bi-share me-2"></i> Pratite nas</h3>
      <p>Budite u toku sa najnovijim trendovima i ekskluzivnim ponudama.</p>
      <div class="d-flex flex-wrap gap-3">
        <a href="https://www.instagram.com/tophelanke021" class="btn btn-outline-primary" target="_blank"><i class="bi bi-instagram me-1"></i> Instagram</a>
        <a href="https://www.tiktok.com/@tophelanke021" class="btn btn-outline-primary" target="_blank"><i class="bi bi-tiktok me-1"></i> TikTok</a>
        <a href="https://www.facebook.com/tophelanke" class="btn btn-outline-primary" target="_blank"><i class="bi bi-facebook me-1"></i> Facebook</a>
      </div>
    </div>
  `,

  privacy: `
    <p class="lead">Vaša privatnost nam je važna – ovde jasno objašnjavamo koje podatke prikupljamo, zašto ih obrađujemo i kako ih štitimo u skladu sa važećim propisima Republike Srbije.</p>
    
    <div class="accordion" id="privacyAccordion">
      <!-- 1 -->
      <div class="accordion-item">
        <h2 class="accordion-header" id="headingOne">
          <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapseOne" aria-expanded="true" aria-controls="collapseOne">
            1. Rukovalac podacima
          </button>
        </h2>
        <div id="collapseOne" class="accordion-collapse collapse show" aria-labelledby="headingOne" data-bs-parent="#privacyAccordion">
          <div class="accordion-body">
            <strong>TopHelanke</strong><br>
            Adresa: Boška Vrebalova 26, 21000 Novi Sad<br>
            Telefon: <a href="tel:+381659774000">+381 65 977 4000</a><br>
            Email: <a href="mailto:top.helanke.ns@gmail.com">top.helanke.ns@gmail.com</a><br>
            PIB: 100154658, Matični broj: 07566905
          </div>
        </div>
      </div>
      <!-- 2 -->
      <div class="accordion-item">
        <h2 class="accordion-header" id="headingTwo">
          <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseTwo" aria-expanded="false" aria-controls="collapseTwo">
            2. Prikupljanje podataka
          </button>
        </h2>
        <div id="collapseTwo" class="accordion-collapse collapse" aria-labelledby="headingTwo" data-bs-parent="#privacyAccordion">
          <div class="accordion-body">
            Prikupljamo: ime i prezime, email adresu, broj telefona, adresu za dostavu, podatke o porudžbinama, tehničke podatke (IP adresa, tip browsera, operativni sistem). <strong>Podaci o platnim karticama se ne čuvaju</strong> na našem sistemu.
          </div>
        </div>
      </div>
      <!-- 3 -->
      <div class="accordion-item">
        <h2 class="accordion-header" id="headingThree">
          <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseThree" aria-expanded="false" aria-controls="collapseThree">
            3. Upotreba podataka
          </button>
        </h2>
        <div id="collapseThree" class="accordion-collapse collapse" aria-labelledby="headingThree" data-bs-parent="#privacyAccordion">
          <div class="accordion-body">
            Realizacija porudžbina, izdavanje računa, komunikacija sa korisnicima, poboljšanje sajta, marketing (samo uz vašu saglasnost).
          </div>
        </div>
      </div>
      <!-- 4 -->
      <div class="accordion-item">
        <h2 class="accordion-header" id="headingFour">
          <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseFour" aria-expanded="false" aria-controls="collapseFour">
            4. Pravni osnov obrade
          </button>
        </h2>
        <div id="collapseFour" class="accordion-collapse collapse" aria-labelledby="headingFour" data-bs-parent="#privacyAccordion">
          <div class="accordion-body">
            Izvršenje ugovora (kupovina), zakonska obaveza (izdavanje računa), legitimni interes (poboljšanje usluge), saglasnost korisnika (marketing).
          </div>
        </div>
      </div>
      <!-- 5 -->
      <div class="accordion-item">
        <h2 class="accordion-header" id="headingFive">
          <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseFive" aria-expanded="false" aria-controls="collapseFive">
            5. Deljenje podataka
          </button>
        </h2>
        <div id="collapseFive" class="accordion-collapse collapse" aria-labelledby="headingFive" data-bs-parent="#privacyAccordion">
          <div class="accordion-body">
            Podaci se dele samo kada je neophodno: kurirske službe (adresa), platni provajderi, računovodstvo, IT partneri. Nikada ne prodajemo podatke trećim licima.
          </div>
        </div>
      </div>
      <!-- 6 -->
      <div class="accordion-item">
        <h2 class="accordion-header" id="headingSix">
          <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseSix" aria-expanded="false" aria-controls="collapseSix">
            6. Period čuvanja
          </button>
        </h2>
        <div id="collapseSix" class="accordion-collapse collapse" aria-labelledby="headingSix" data-bs-parent="#privacyAccordion">
          <div class="accordion-body">
            Podaci se čuvaju u skladu sa zakonskim rokovima (npr. računi 10 godina) ili dok postoji svrha obrade. Možete zahtevati brisanje ranije.
          </div>
        </div>
      </div>
      <!-- 7 -->
      <div class="accordion-item">
        <h2 class="accordion-header" id="headingSeven">
          <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseSeven" aria-expanded="false" aria-controls="collapseSeven">
            7. Vaša prava
          </button>
        </h2>
        <div id="collapseSeven" class="accordion-collapse collapse" aria-labelledby="headingSeven" data-bs-parent="#privacyAccordion">
          <div class="accordion-body">
            Imate pravo na pristup, ispravku, brisanje, ograničenje obrade, prigovor i prenosivost podataka. Saglasnost za marketing možete povući u bilo kom trenutku putem emaila ili linka za odjavu u newsletteru.
          </div>
        </div>
      </div>
      <!-- 8 -->
      <div class="accordion-item">
        <h2 class="accordion-header" id="headingEight">
          <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseEight" aria-expanded="false" aria-controls="collapseEight">
            8. Kolačići (cookies)
          </button>
        </h2>
        <div id="collapseEight" class="accordion-collapse collapse" aria-labelledby="headingEight" data-bs-parent="#privacyAccordion">
          <div class="accordion-body">
            Koristimo kolačiće za funkcionalnost, analitiku i marketing (uz vašu saglasnost). Možete ih kontrolisati ili obrisati kroz podešavanja vašeg browsera.
          </div>
        </div>
      </div>
      <!-- 9 -->
      <div class="accordion-item">
        <h2 class="accordion-header" id="headingNine">
          <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseNine" aria-expanded="false" aria-controls="collapseNine">
            9. Sigurnost podataka
          </button>
        </h2>
        <div id="collapseNine" class="accordion-collapse collapse" aria-labelledby="headingNine" data-bs-parent="#privacyAccordion">
          <div class="accordion-body">
            Koristimo HTTPS, ograničen pristup podacima, enkripciju osetljivih polja i redovne bezbednosne provere.
          </div>
        </div>
      </div>
      <!-- 10 -->
      <div class="accordion-item">
        <h2 class="accordion-header" id="headingTen">
          <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseTen" aria-expanded="false" aria-controls="collapseTen">
            10. Izmene politike
          </button>
        </h2>
        <div id="collapseTen" class="accordion-collapse collapse" aria-labelledby="headingTen" data-bs-parent="#privacyAccordion">
          <div class="accordion-body">
            Ovu politiku možemo povremeno ažurirati. Sve izmene objavljujemo na ovoj stranici. <strong>Poslednja izmena: 02.04.2026</strong>
          </div>
        </div>
      </div>
      <!-- 11 -->
      <div class="accordion-item">
        <h2 class="accordion-header" id="headingEleven">
          <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseEleven" aria-expanded="false" aria-controls="collapseEleven">
            11. Kontakt
          </button>
        </h2>
        <div id="collapseEleven" class="accordion-collapse collapse" aria-labelledby="headingEleven" data-bs-parent="#privacyAccordion">
          <div class="accordion-body">
            Za sva pitanja vezana za privatnost pišite na <a href="mailto:top.helanke.ns@gmail.com">top.helanke.ns@gmail.com</a> ili koristite <a href="/kontakt">kontakt formu</a>.
          </div>
        </div>
      </div>
    </div>
  `,

  terms: `
    <p class="lead">Korišćenjem našeg sajta potvrđujete da ste pročitali, razumeli i prihvatili ove Uslove korišćenja.</p>
    <div class="accordion" id="termsAccordion">
      <div class="accordion-item">
        <h2 class="accordion-header"><button class="accordion-button" data-bs-toggle="collapse" data-bs-target="#term1">1. Podaci o trgovcu</button></h2>
        <div id="term1" class="accordion-collapse collapse show" data-bs-parent="#termsAccordion"><div class="accordion-body">TopHelanke, Boška Vrebalova 26, Novi Sad, PIB 100154658, MB 07566905.</div></div>
      </div>
      <div class="accordion-item">
        <h2 class="accordion-header"><button class="accordion-button collapsed" data-bs-toggle="collapse" data-bs-target="#term2">2. Prihvaćanje uslova</button></h2>
        <div id="term2" class="accordion-collapse collapse" data-bs-parent="#termsAccordion"><div class="accordion-body">Kreiranjem naloga ili poručivanjem prihvatate ove uslove i Politiku privatnosti.</div></div>
      </div>
      <div class="accordion-item">
        <h2 class="accordion-header"><button class="accordion-button collapsed" data-bs-toggle="collapse" data-bs-target="#term3">3. Registracija i nalog</button></h2>
        <div id="term3" class="accordion-collapse collapse" data-bs-parent="#termsAccordion"><div class="accordion-body">Nalog omogućava upravljanje porudžbinama, praćenje statusa i listu želja. Korisnik je odgovoran za čuvanje lozinke.</div></div>
      </div>
      <div class="accordion-item">
        <h2 class="accordion-header"><button class="accordion-button collapsed" data-bs-toggle="collapse" data-bs-target="#term4">4. Porudžbine i plaćanje</button></h2>
        <div id="term4" class="accordion-collapse collapse" data-bs-parent="#termsAccordion"><div class="accordion-body">Porudžbine se obrađuju po redosledu. Plaćanje je moguće pouzećem ili online karticama.</div></div>
      </div>
      <div class="accordion-item">
        <h2 class="accordion-header"><button class="accordion-button collapsed" data-bs-toggle="collapse" data-bs-target="#term5">5. Otkazivanje porudžbine</button></h2>
        <div id="term5" class="accordion-collapse collapse" data-bs-parent="#termsAccordion"><div class="accordion-body">Otkazivanje je moguće pre nego što je roba poslata.</div></div>
      </div>
      <div class="accordion-item">
        <h2 class="accordion-header"><button class="accordion-button collapsed" data-bs-toggle="collapse" data-bs-target="#term6">6. Zamena i povraćaj novca</button></h2>
        <div id="term6" class="accordion-collapse collapse" data-bs-parent="#termsAccordion"><div class="accordion-body">Kupac ima pravo na odustanak u roku od 14 dana bez navođenja razloga. Povraćaj sredstava vrši se u zakonskom roku.</div></div>
      </div>
      <div class="accordion-item">
        <h2 class="accordion-header"><button class="accordion-button collapsed" data-bs-toggle="collapse" data-bs-target="#term7">7. Reklamacije</button></h2>
        <div id="term7" class="accordion-collapse collapse" data-bs-parent="#termsAccordion"><div class="accordion-body">Reklamacije se podnose na email top.helanke.ns@gmail.com, odgovor u roku od 8 dana.</div></div>
      </div>
      <div class="accordion-item">
        <h2 class="accordion-header"><button class="accordion-button collapsed" data-bs-toggle="collapse" data-bs-target="#term8">8. Dostava i rokovi</button></h2>
        <div id="term8" class="accordion-collapse collapse" data-bs-parent="#termsAccordion"><div class="accordion-body">Isporuka kurirskom službom, rok 2-5 radnih dana.</div></div>
      </div>
      <div class="accordion-item">
        <h2 class="accordion-header"><button class="accordion-button collapsed" data-bs-toggle="collapse" data-bs-target="#term9">9. Cene i dostupnost</button></h2>
        <div id="term9" class="accordion-collapse collapse" data-bs-parent="#termsAccordion"><div class="accordion-body">Sve cene su izražene u RSD sa uračunatim PDV-om. Zadržavamo pravo izmene cena.</div></div>
      </div>
      <div class="accordion-item">
        <h2 class="accordion-header"><button class="accordion-button collapsed" data-bs-toggle="collapse" data-bs-target="#term10">10. Intelektualna svojina</button></h2>
        <div id="term10" class="accordion-collapse collapse" data-bs-parent="#termsAccordion"><div class="accordion-body">Sav sadržaj (tekstovi, slike, logotipovi) zaštićen je autorskim pravima.</div></div>
      </div>
      <div class="accordion-item">
        <h2 class="accordion-header"><button class="accordion-button collapsed" data-bs-toggle="collapse" data-bs-target="#term11">11. Važeće pravo</button></h2>
        <div id="term11" class="accordion-collapse collapse" data-bs-parent="#termsAccordion"><div class="accordion-body">Primenjuje se pravo Republike Srbije.</div></div>
      </div>
      <div class="accordion-item">
        <h2 class="accordion-header"><button class="accordion-button collapsed" data-bs-toggle="collapse" data-bs-target="#term12">12. Kontakt</button></h2>
        <div id="term12" class="accordion-collapse collapse" data-bs-parent="#termsAccordion"><div class="accordion-body">Kontaktirajte nas putem emaila, telefona ili <a href="/kontakt">kontakt forme</a>.</div></div>
      </div>
    </div>
    <p class="text-muted mt-4"><i class="bi bi-calendar-event"></i> Poslednja izmena: 28.02.2026</p>
  `,

  partnership: `
    <div class="alert alert-info d-flex align-items-center mb-4" role="alert">
      <i class="bi bi-info-circle-fill fs-4 me-3"></i>
      <div>Partnerstvo je funkcionalnost koja je trenutno u pripremi. Uskoro otvaramo mogućnost saradnje za sve koji žele da promovišu Tophelanke i zarade kroz prodaju.</div>
    </div>

    <div class="row g-4 mb-5">
      <div class="col-md-6">
        <div class="card h-100 border-0 shadow-sm">
          <div class="card-body">
            <h3 class="h4"><i class="bi bi-diagram-3 me-2"></i> Kako funkcioniše?</h3>
            <p>Vi promovišete proizvode – kupac poručuje preko platforme – mi obrađujemo porudžbinu, pakujemo i šaljemo – vi ostvarujete zaradu od svake uspešne prodaje.</p>
          </div>
        </div>
      </div>
      <div class="col-md-6">
        <div class="card h-100 border-0 shadow-sm">
          <div class="card-body">
            <h3 class="h4"><i class="bi bi-cash-stack me-2"></i> Zašto se isplati?</h3>
            <ul class="mb-0">
              <li>Bez ulaganja u lager i pakovanje</li>
              <li>Brza dostava i pouzdana realizacija</li>
              <li>Jasan sistem praćenja i transparentna zarada</li>
              <li>Podrška i materijali za promociju</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <h3 class="h4 mb-3"><i class="bi bi-bar-chart-steps me-2"></i> Nivoi saradnje (planirano)</h3>
    <div class="row g-4 mb-5">
      <div class="col-md-6 col-lg-3">
        <div class="card h-100 border-0 shadow-sm text-center">
          <div class="card-body">
            <i class="bi bi-link-45deg fs-1 text-primary"></i>
            <h4 class="h5 mt-2">Affiliate / Preporuke</h4>
            <p class="small">Delite linkove ili kodove, provizija od svake kupovine.</p>
          </div>
        </div>
      </div>
      <div class="col-md-6 col-lg-3">
        <div class="card h-100 border-0 shadow-sm text-center">
          <div class="card-body">
            <i class="bi bi-star fs-1 text-primary"></i>
            <h4 class="h5 mt-2">Napredni partner</h4>
            <p class="small">Veći obim prodaje, dodatne pogodnosti i veća provizija.</p>
          </div>
        </div>
      </div>
      <div class="col-md-6 col-lg-3">
        <div class="card h-100 border-0 shadow-sm text-center">
          <div class="card-body">
            <i class="bi bi-shop fs-1 text-primary"></i>
            <h4 class="h5 mt-2">Personalizovana prodavnica</h4>
            <p class="small">Svoja mini prodavnica unutar Tophelanke platforme.</p>
          </div>
        </div>
      </div>
      <div class="col-md-6 col-lg-3">
        <div class="card h-100 border-0 shadow-sm text-center">
          <div class="card-body">
            <i class="bi bi-truck fs-1 text-primary"></i>
            <h4 class="h5 mt-2">Mi radimo logistiku</h4>
            <p class="small">Vi se fokusirate na prodaju, mi na dostavu i podršku.</p>
          </div>
        </div>
      </div>
    </div>

    <div class="card border-0 shadow-sm bg-light">
      <div class="card-body text-center">
        <h3 class="h4">Želite da budete među prvima?</h3>
        <p class="mb-3">Ostavite nam svoje podatke putem kontakt forme i javićemo vam se čim partnerstvo postane aktivno.</p>
        <a href="/kontakt" class="btn btn-primary"><i class="bi bi-envelope me-2"></i>Kontaktirajte nas</a>
      </div>
    </div>
  `,

  faqIntro: `
    <p class="lead">Odgovori na najčešća pitanja o porudžbinama, isporuci, plaćanju i povraćaju.</p>
    <p>Ako niste pronašli odgovor, slobodno nas <a href="/kontakt">kontaktirajte</a>.</p>
  `,

  contactIntro: `
    <p class="lead">Za sve informacije, pitanja i nedoumice – tu smo za vas.</p>
    <p>Odgovorićemo u najkraćem mogućem roku (obično u roku od 24h). Možete nas kontaktirati putem forme ili direktno na:</p>
    <div class="d-flex flex-wrap gap-4 my-4">
      <div><i class="bi bi-telephone-fill text-primary me-2"></i> <a href="tel:+381659774000">+381 65 977 4000</a></div>
      <div><i class="bi bi-envelope-fill text-primary me-2"></i> <a href="mailto:top.helanke.ns@gmail.com">top.helanke.ns@gmail.com</a></div>
      <div><i class="bi bi-geo-alt-fill text-primary me-2"></i> Boška Vrebalova 26, Novi Sad</div>
    </div>
  `,
};

/* ==============================
   PREPARER FUNKCIJE (ostaju iste)
   ============================== */
export function prepareHomeData(serviceData) {
  return {
    seo: serviceData.seo,
    featuredItems: serviceData.featuredItems || [],
    actionedItems: serviceData.actionedItems || [],
    featuredPosts: serviceData.featuredPosts || [],
    testimonials: serviceData.testimonials || [],
  };
}

export function prepareAboutData(serviceData) {
  return {
    seo: serviceData.seo,
    content: STATIC_CONTENT.about,
    showForm: false,
    showFaq: true,
  };
}

export function preparePrivacyData(serviceData) {
  return {
    seo: serviceData.seo,
    content: STATIC_CONTENT.privacy,
    showForm: false,
    showFaq: true,
  };
}

export function prepareTermsData(serviceData) {
  return {
    seo: serviceData.seo,
    content: STATIC_CONTENT.terms,
    showForm: false,
    showFaq: true,
  };
}

export function preparePartnershipData(serviceData) {
  return {
    seo: serviceData.seo,
    content: STATIC_CONTENT.partnership,
    showForm: false,
    showFaq: true,
  };
}

export function prepareContactData(serviceData, errors = null, formData = {}, success = false) {
  return {
    seo: serviceData.seo,
    content: STATIC_CONTENT.contactIntro,
    showForm: true,
    showFaq: false,
    success: success,
    formData: formData,
    errors: errors || {},
  };
}

export function prepareFaqData(serviceData) {
  return {
    seo: serviceData.seo,
    content: STATIC_CONTENT.faqIntro,
    showForm: false,
    showFaq: true,
  };
}