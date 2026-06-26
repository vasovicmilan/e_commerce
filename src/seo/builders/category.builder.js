import { buildBaseSeo } from "./base.builder.js";

export function buildCategorySeo(contract, items = []) {
  if (!contract) {
    return buildBaseSeo({ title: "Kategorija nije pronađena", description: "", canonical: "/404" });
  }

  // 🔥 Osiguraj da title postoji
  const title = contract.title || contract.name || 'Kategorija';
  const description = contract.description || `Pregledajte ${items?.length || 0} artikala u kategoriji "${title}".`;

  return buildBaseSeo({
    ...contract,
    title: title,
    description: description,
    type: "website",
  });
}