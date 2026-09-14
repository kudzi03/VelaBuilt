import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";

/**
 * TYPOGRAPHY: no straight apostrophes in copy.
 *
 * The site sets ’ (U+2019). A straight ' slipped into copy renders as a
 * typewriter mark beside correct ones — the same sentence has shipped both
 * ways. `npm run build` runs lint first, so this fails the build.
 *
 * Copy lives in three places, and each needs its own selector:
 *   JSX text          any ' at all (write ’ or &rsquo;)
 *   copy attributes   alt, title, aria-label, placeholder, label
 *   string literals   contractions and possessives (what's, clients') — most
 *                     copy is data in src/content and page-level arrays.
 *                     Code strings such as "'" or "a'b" selectors do not
 *                     match: the pattern needs letters either side.
 */
const STRAIGHT_APOSTROPHE_MESSAGE =
  "Straight apostrophe in copy. Use ’ (U+2019), or &rsquo; in JSX text.";
const CONTRACTION = "/[A-Za-z]'[A-Za-z]|[A-Za-z]s'(\\s|$)/";

const typographyRules = {
  files: ["src/**/*.{ts,tsx}"],
  // GLSL source held in template literals is code; its comments are not copy.
  ignores: ["src/**/*Shader.ts"],
  rules: {
    "no-restricted-syntax": [
      "error",
      { selector: "JSXText[value=/'/]", message: STRAIGHT_APOSTROPHE_MESSAGE },
      {
        // Any ' in a copy attribute; contractions are left to the Literal
        // selector below so one mistake is reported once.
        selector: `JSXAttribute[name.name=/^(alt|title|aria-label|placeholder|label)$/] Literal[value=/'/]:not([value=${CONTRACTION}])`,
        message: STRAIGHT_APOSTROPHE_MESSAGE,
      },
      { selector: `Literal[value=${CONTRACTION}]`, message: STRAIGHT_APOSTROPHE_MESSAGE },
      {
        selector: `TemplateElement[value.cooked=${CONTRACTION}]`,
        message: STRAIGHT_APOSTROPHE_MESSAGE,
      },
    ],
  },
};

/**
 * Flat config. eslint-config-next 16 ships flat configs directly, so no
 * eslintrc compatibility layer is needed.
 */
const config = [
  { ignores: [".next/**", "node_modules/**", "next-env.d.ts"] },
  ...coreWebVitals,
  ...typescript,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  typographyRules,
];

export default config;
