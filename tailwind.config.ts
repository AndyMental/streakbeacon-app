import type { Config } from "tailwindcss";

const config = {
  theme: {
    extend: {
      colors: {
        brand: {
          green: "#27AE60",
          blue: "#2D9CDB"
        }
      }
    }
  }
} satisfies Config;

export default config;
