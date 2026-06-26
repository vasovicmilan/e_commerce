import { buildBaseSeo } from "./base.builder.js";

export function buildTagSeo(contract, items = []) {
  if (!contract) {
    return buildBaseSeo({ title: "Tag nije pronađen", description: "", canonical: "/404" });
  }

  const title = contract.title || contract.name || 'Tag';
  const description = contract.description || `Pregledajte ${items?.length || 0} artikala sa oznakom "${title}".`;

  return buildBaseSeo({
    ...contract,
    title: title,
    description: description,
    type: "website",
  });
}