module.exports = {
  // https://eslint.org/docs/user-guide/configuring#configuration-cascading-and-hierarchy
  // This option interrupts the configuration hierarchy at this file
  // Remove this if you have an higher level ESLint config file (it usually happens into a monorepos)
  root: true,

  parserOptions: {
    parser: "babel-eslint",
    ecmaVersion: 2018, // Allows for the parsing of modern ECMAScript features
    sourceType: "module" // Allows for the use of imports
  },

  env: {
    browser: true
  },

  // Rules order is important, please avoid shuffling them
  extends: [
    // Base ESLint recommended rules
    // 'eslint:recommended',

    // Uncomment any of the lines below to choose desired strictness,
    // but leave only one uncommented!
    // See https://eslint.vuejs.org/rules/#available-rules
    "plugin:vue/essential", // Priority A: Essential (Error Prevention)
    // 'plugin:vue/strongly-recommended', // Priority B: Strongly Recommended (Improving Readability)
    // 'plugin:vue/recommended', // Priority C: Recommended (Minimizing Arbitrary Choices and Cognitive Overhead)

    "standard"

  ],

  plugins: [
    // https://eslint.vuejs.org/user-guide/#why-doesn-t-it-work-on-vue-file
    // required to lint *.vue files
    "vue",

  ],

  globals: {
    ga: true, // Google Analytics
    cordova: true,
    __statics: true,
    process: true,
    Capacitor: true,
    chrome: true
  },

  // add your custom rules here
  rules: {
    // allow async-await
    "generator-star-spacing": "off",
    // allow paren-less arrow functions
    "arrow-parens": "off",
    "one-var": "off",

    "import/first": "off",
    "import/named": "error",
    "import/namespace": "error",
    "import/default": "error",
    "import/export": "error",
    "import/extensions": "off",
    "import/no-unresolved": "off",
    "import/no-extraneous-dependencies": "off",
    "prefer-promise-reject-errors": "off",

    "quotes": [1, "double"],
    "semi": [2, "always"],
    "no-unused-vars": "off",
    "no-trailing-spaces": 1,
    /*
    "no-lonely-if": "off",
    "linebreak-style": 0,
    "vue/require-v-for-key": 0,
    "indent": 0,
    "quotes": [1, "double"],
    "quote-props": 0,
    "object-shorthand": 0,
    "max-len": 0,
    "arrow-body-style": "off",
    "prefer-arrow-callback": 1,
    "comma-style": 0,
    "comma-dangle": 0,
    "no-alert": 0,
    "no-trailing-spaces": 1,
    "no-plusplus": 0,
    "object-curly-spacing": 0,
    "no-param-reassign": 0,
    "import/first": 0,
    "import/named": 2,
    "import/namespace": 2,
    "import/default": 2,
    "import/export": 2,
    "import/extensions": 0,
    "import/no-unresolved": 0,
    "import/no-extraneous-dependencies": 0,
    * */

    // allow debugger during development only
    "no-debugger": process.env.NODE_ENV === "production" ? "error" : "off"
  }
};
