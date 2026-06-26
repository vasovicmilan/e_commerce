export function prepareLoginFormData() {
  return {
    formTitle: "Prijavite se",
    formAction: "/auth/prijava",
    submitLabel: "Prijavi se",
    fields: [
      { name: "email", type: "email", label: "Email", required: true, value: "" },
      { name: "password", type: "password", label: "Lozinka", required: true },
    ],
    footerLinks: [
      { label: "Nemate nalog? Registrujte se", url: "/auth/registracija" },
      { label: "Zaboravili ste lozinku?", url: "/auth/zaboravljena-lozinka" },
    ],
    errors: {},
    formData: {},
  };
}

export function prepareLoginFormDataWithErrors(errors, formData) {
  return {
    ...prepareLoginFormData(),
    errors,
    formData,
  };
}

export function prepareRegisterFormData() {
  return {
    formTitle: "Kreirajte nalog",
    formAction: "/auth/registracija",
    submitLabel: "Registruj se",
    fields: [
      { name: "firstName", type: "text", label: "Ime", required: true, value: "" },
      { name: "lastName", type: "text", label: "Prezime", required: true, value: "" },
      { name: "email", type: "email", label: "Email", required: true, value: "" },
      { name: "password", type: "password", label: "Lozinka", required: true },
      { name: "passwordConfirm", type: "password", label: "Potvrdi lozinku", required: true },
    ],
    footerLinks: [
      { label: "Već imate nalog? Prijavite se", url: "/auth/prijava" },
    ],
    errors: {},
    formData: {},
  };
}

export function prepareRegisterFormDataWithErrors(errors, formData) {
  return {
    ...prepareRegisterFormData(),
    errors,
    formData,
  };
}

export function prepareForgotPasswordFormData() {
  return {
    formTitle: "Zaboravljena lozinka",
    formAction: "/auth/zaboravljena-lozinka",
    submitLabel: "Pošalji reset link",
    fields: [
      { name: "email", type: "email", label: "Unesite vaš email", required: true, value: "" },
    ],
    footerLinks: [
      { label: "Nazad na prijavu", url: "/auth/prijava" },
    ],
    errors: {},
    formData: {},
  };
}

export function prepareResetPasswordFormData(token = "") {
  return {
    formTitle: "Nova lozinka",
    formAction: "/auth/nova-lozinka",
    submitLabel: "Postavi lozinku",
    fields: [
      { name: "token", type: "hidden", value: token },
      { name: "password", type: "password", label: "Nova lozinka", required: true },
      { name: "passwordConfirm", type: "password", label: "Potvrdi lozinku", required: true },
    ],
    footerLinks: [
      { label: "Nazad na prijavu", url: "/auth/prijava" },
    ],
    errors: {},
    formData: { token },
  };
}