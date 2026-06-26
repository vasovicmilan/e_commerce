import { buildBaseSeo } from "./base.builder.js";

export function buildPageSeo(contract) {
  if (!contract) return buildBaseSeo({ title: "Stranica", description: "", canonical: "/" });

  return buildBaseSeo({
    ...contract,
    isIndexable: contract.isIndexable !== false,
  });
}