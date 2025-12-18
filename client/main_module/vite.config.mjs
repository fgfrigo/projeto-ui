import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";

// https://vitejs.dev/config/

export default defineConfig(({ command, mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), "");
  const VITE_PORT = process.env.VITE_PORT || 5173;
  const API_APP_PROTOCOL =
    process.env.APP_PROTOCOL || process.env.API_APP_PROTOCOL || "http";
  const API_APP_HOST =
    process.env.APP_HOST || process.env.API_APP_HOST || "0.0.0.0";
  const API_APP_PORT = process.env.APP_PORT || process.env.API_APP_PORT || 3000;
  const BASE_PREFIX =
    process.env.BASE_PREFIX || env.BASE_PREFIX || "/";
  return {
    // vite config
    plugins: [vue()],
    css: {
      postcss: {
        plugins: [
          tailwindcss("./client/main_module/tailwind.config.js"),
          autoprefixer
        ]
      }
    },
    define: {
      __APP_ENV__: JSON.stringify(env.APP_ENV)
    },
    root: "./client/main_module",
    base: BASE_PREFIX,
    server: {
      port: VITE_PORT,
      proxy: {
        "/static": `${API_APP_PROTOCOL}://${API_APP_HOST}:${API_APP_PORT}`
      },
      watch: {
        usePolling: true
      }
    }
  };
});
