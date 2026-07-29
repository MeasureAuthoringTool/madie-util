module.exports = {
  purge: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      colors: {
        slate: {
          DEFAULT: "#EDEDED",
          90: "#242424",
          80: "#333333",
        },
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
};
