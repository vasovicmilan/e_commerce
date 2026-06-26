import methodOverride from "method-override";

export function setupMethodOverride(app) {
  app.use(methodOverride("_method", { methods: ["POST"] }));
}