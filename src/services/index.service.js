import * as itemService from "./item.service.js";
import * as postService from "./post.service.js";
import * as contactService from "./contact.service.js";
import * as testimonialService from "./testimonial.service.js";
import { buildPageSeo } from "../seo/index.js";
import {
  validationError,
} from "../utils/error.util.js";

export async function getLandingPageData({
  featuredItemLimit = 4,
  actionedItemLimit = 4,
  featuredPostLimit = 4,
  featuredTestimonialLimit = 6,
} = {}) {
  const [featuredItems, actionedItems, featuredPosts, featuredTestimonials] = await Promise.all([
    itemService.findFeaturedItems({ limit: featuredItemLimit, page: 1 }),
    itemService.findActionedItems({ limit: actionedItemLimit, page: 1 }),
    postService.findPublishedPosts({ limit: featuredPostLimit, page: 1 }), // published + featured
    testimonialService.getFeaturedTestimonials(featuredTestimonialLimit),
  ]);

  const seo = buildPageSeo({
    title: "TopHelanke | Ženske helanke i online kupovina",
    description: "Kupite ženske helanke, donji veš i modnu garderobu online. Akcije, istaknuti proizvodi i brza isporuka.",
    canonical: "/",
    isIndexable: true,
    type: "website",
  });

  return {
    featuredItems: featuredItems.data || [],
    actionedItems: actionedItems.data || [],
    featuredPosts: featuredPosts.data || [],
    testimonials: featuredTestimonials || [],
    seo,
  };
}

export async function getAboutPageData() {
  const seo = buildPageSeo({
    title: "O nama | TopHelanke",
    description: "Saznajte više o TopHelanke brendu, našoj misiji, vrednostima i načinu poslovanja.",
    canonical: "/o-nama",
    pageType: "about",
    isIndexable: true,
  });

  return { seo };
}

export async function getPrivacyPolicyPageData() {
  const seo = buildPageSeo({
    title: "Politika privatnosti | TopHelanke",
    description: "Informacije o zaštiti podataka o ličnosti i privatnosti korisnika TopHelanke sajta.",
    canonical: "/politika-privatnosti",
    pageType: "privacy",
    isIndexable: true,
  });

  return { seo };
}

export async function getTermsAndConditionsPageData() {
  const seo = buildPageSeo({
    title: "Uslovi korišćenja | TopHelanke",
    description: "Uslovi korišćenja TopHelanke online prodavnice i pravila kupovine.",
    canonical: "/uslovi-koriscenja",
    pageType: "terms",
    isIndexable: true,
  });

  return { seo };
}

export async function getPartnershipPageData() {
  const seo = buildPageSeo({
    title: "Partnerstvo | TopHelanke",
    description: "Informacije o poslovnoj saradnji i partnerstvima sa TopHelanke brendom.",
    canonical: "/partnerstva",
    pageType: "partnership",
    isIndexable: true,
  });

  return { seo };
}

export async function getContactPageData() {
  const seo = buildPageSeo({
    title: "Kontakt | TopHelanke",
    description: "Kontaktirajte TopHelanke tim za pitanja, saradnju ili podršku.",
    canonical: "/kontakt",
    pageType: "contact",
    isIndexable: false,
  });

  return { seo };
}

export async function getFaqPageData() {
  const seo = buildPageSeo({
    title: "Česta pitanja (FAQ) | TopHelanke",
    description: "Odgovori na najčešća pitanja o porudžbinama, isporuci, plaćanju i povraćaju.",
    canonical: "/faq",
    pageType: "faq",
    isIndexable: true,
  });

  return { seo };
}

export async function submitContactForm(data) {
  if (!data?.firstName || !data?.email || !data?.message) {
    validationError("Sva polja su obavezna");
  }

  return contactService.createContact(data);
}

export async function submitTestimonial(data) {
  if (!data?.rating || !data?.comment) {
    validationError("Ocena i komentar su obavezni");
  }

  return testimonialService.submitTestimonial(data);
}

export default {
  getLandingPageData,
  getAboutPageData,
  getPrivacyPolicyPageData,
  getTermsAndConditionsPageData,
  getPartnershipPageData,
  getContactPageData,
  getFaqPageData,
  submitContactForm,
  submitTestimonial,
};