import * as indexService from "../../services/index.service.js";
import * as newsletterService from "../../services/newsletter.service.js";
import {
  prepareHomeData,
  prepareAboutData,
  preparePrivacyData,
  prepareTermsData,
  preparePartnershipData,
  prepareContactData,
  prepareFaqData,
} from "../../presenters/public/public.presenter.js";
import { flashAndRedirect } from "../../utils/flash.util.js";

export async function homePage(req, res, next) {
  try {
    const serviceData = await indexService.getLandingPageData();
    const viewData = prepareHomeData(serviceData);
    return res.render("landing/home", {
      pageTitle: viewData.seo.pageTitle,
      pageDescription: viewData.seo.pageDescription,
      data: viewData,
    });
  } catch (error) {
    next(error);
  }
}

export async function aboutPage(req, res, next) {
  try {
    const serviceData = await indexService.getAboutPageData();
    const viewData = prepareAboutData(serviceData);
    return res.render("public/_page", {
      pageTitle: viewData.seo.pageTitle,
      pageDescription: viewData.seo.pageDescription,
      content: viewData.content,
      showForm: viewData.showForm,
      showFaq: viewData.showFaq,
      data: {},
    });
  } catch (error) {
    next(error);
  }
}

export async function privacyPage(req, res, next) {
  try {
    const serviceData = await indexService.getPrivacyPolicyPageData();
    const viewData = preparePrivacyData(serviceData);
    return res.render("public/_page", {
      pageTitle: viewData.seo.pageTitle,
      pageDescription: viewData.seo.pageDescription,
      content: viewData.content,
      showForm: viewData.showForm,
      showFaq: viewData.showFaq,
      data: {},
    });
  } catch (error) {
    next(error);
  }
}

export async function termsPage(req, res, next) {
  try {
    const serviceData = await indexService.getTermsAndConditionsPageData();
    const viewData = prepareTermsData(serviceData);
    return res.render("public/_page", {
      pageTitle: viewData.seo.pageTitle,
      pageDescription: viewData.seo.pageDescription,
      content: viewData.content,
      showForm: viewData.showForm,
      showFaq: viewData.showFaq,
      data: {},
    });
  } catch (error) {
    next(error);
  }
}

export async function partnershipPage(req, res, next) {
  try {
    const serviceData = await indexService.getPartnershipPageData();
    const viewData = preparePartnershipData(serviceData);
    return res.render("public/_page", {
      pageTitle: viewData.seo.pageTitle,
      pageDescription: viewData.seo.pageDescription,
      content: viewData.content,
      showForm: viewData.showForm,
      showFaq: viewData.showFaq,
      data: {},
    });
  } catch (error) {
    next(error);
  }
}

export async function contactPage(req, res, next) {
  try {
    const serviceData = await indexService.getContactPageData();
    const viewData = prepareContactData(serviceData);
    return res.render("public/_page", {
      pageTitle: viewData.seo.pageTitle,
      pageDescription: viewData.seo.pageDescription,
      content: viewData.content,
      showForm: viewData.showForm,
      showFaq: viewData.showFaq,
      data: {
        success: viewData.success,
        formData: viewData.formData,
        errors: viewData.errors,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function faqPage(req, res, next) {
  try {
    const serviceData = await indexService.getFaqPageData();
    const viewData = prepareFaqData(serviceData);
    return res.render("public/_page", {
      pageTitle: viewData.seo.pageTitle,
      pageDescription: viewData.seo.pageDescription,
      content: viewData.content,
      showForm: viewData.showForm,
      showFaq: viewData.showFaq,
      data: {},
    });
  } catch (error) {
    next(error);
  }
}

export async function submitContact(req, res, next) {
  try {
    if (req.validationErrors) {
      const serviceData = await indexService.getContactPageData();
      const viewData = prepareContactData(serviceData, req.validationErrors, req.body, false);
      return res.render("public/_page", {
        pageTitle: viewData.seo.pageTitle,
        pageDescription: viewData.seo.pageDescription,
        content: viewData.content,
        showForm: viewData.showForm,
        showFaq: viewData.showFaq,
        data: {
          success: viewData.success,
          formData: viewData.formData,
          errors: viewData.errors,
        },
      });
    }

    await indexService.submitContactForm(req.body);

    const serviceData = await indexService.getContactPageData();
    const viewData = prepareContactData(serviceData, null, {}, true);
    return res.render("public/_page", {
      pageTitle: viewData.seo.pageTitle,
      pageDescription: viewData.seo.pageDescription,
      content: viewData.content,
      showForm: viewData.showForm,
      showFaq: viewData.showFaq,
      data: {
        success: viewData.success,
        formData: viewData.formData,
        errors: viewData.errors,
      },
    });
  } catch (error) {
    if (error.statusCode === 400) {
      const serviceData = await indexService.getContactPageData();
      const viewData = prepareContactData(serviceData, { general: error.message }, req.body, false);
      return res.render("public/_page", {
        pageTitle: viewData.seo.pageTitle,
        pageDescription: viewData.seo.pageDescription,
        content: viewData.content,
        showForm: viewData.showForm,
        showFaq: viewData.showFaq,
        data: {
          success: viewData.success,
          formData: viewData.formData,
          errors: viewData.errors,
        },
      });
    }
    next(error);
  }
}

export async function submitNewsletter(req, res, next) {
  try {
    if (req.validationErrors) {
      return flashAndRedirect(
        req, res, "error",
        Object.values(req.validationErrors).join(", "),
        req.get("referer") || "/"
      );
    }
    await newsletterService.subscribe(req.body);
    return flashAndRedirect(
      req, res, "success",
      "Uspešno ste se prijavili na newsletter!",
      req.get("referer") || "/"
    );
  } catch (error) {
    if (error.statusCode === 400 || error.statusCode === 409) {
      return flashAndRedirect(req, res, "error", error.message, req.get("referer") || "/");
    }
    next(error);
  }
}

export async function submitTestimonial(req, res, next) {
  try {
    if (req.validationErrors) {
      return flashAndRedirect(
        req, res, "error",
        Object.values(req.validationErrors).join(", "),
        req.get("referer") || "/"
      );
    }
    await indexService.submitTestimonial(req.body);
    return flashAndRedirect(
      req, res, "success",
      "Hvala na utisku! Biće objavljen nakon odobrenja.",
      req.get("referer") || "/"
    );
  } catch (error) {
    if (error.statusCode === 400) {
      return flashAndRedirect(req, res, "error", error.message, req.get("referer") || "/");
    }
    next(error);
  }
}

export async function unsubscribeNewsletter(req, res, next) {
  try {
    const { email } = req.query;
    if (!email) {
      return flashAndRedirect(req, res, "error", "Email adresa je obavezna za odjavu.", "/");
    }
    await newsletterService.unsubscribe(email);
    return flashAndRedirect(req, res, "success", "Uspešno ste se odjavili sa newsletter-a.", "/");
  } catch (error) {
    if (error.statusCode === 404) {
      return flashAndRedirect(req, res, "error", "Email adresa nije pronađena.", "/");
    }
    next(error);
  }
}

export default {
  homePage,
  aboutPage,
  privacyPage,
  termsPage,
  partnershipPage,
  contactPage,
  faqPage,
  submitContact,
  submitNewsletter,
  submitTestimonial,
  unsubscribeNewsletter,
};