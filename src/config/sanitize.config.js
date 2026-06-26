import mongoSanitize from "mongo-sanitize";

function sanitizeObject(obj, skipKeys = []) {
  if (!obj || typeof obj !== 'object') return obj;

  for (const key of Object.keys(obj)) {
    // Preskoči ključeve koji sadrže reč 'email' (case-insensitive)
    if (skipKeys.some(sk => key.toLowerCase().includes(sk.toLowerCase()))) {
      continue;
    }

    const value = obj[key];

    if (typeof value === 'string') {
      obj[key] = mongoSanitize(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitizeObject(value, skipKeys);
    }
  }
  return obj;
}

export function setupSanitize(app) {
  const skipKeys = ['email',"mail","password", "confirmedPassword", "confirmePassword"]; // dodaj i 'mail' ako treba

  app.use((req, res, next) => {
    if (req.body) {
      sanitizeObject(req.body, skipKeys);
    }

    if (req.query) {
      sanitizeObject(req.query, skipKeys);
    }

    if (req.params) {
      sanitizeObject(req.params, skipKeys);
    }

    next();
  });
}