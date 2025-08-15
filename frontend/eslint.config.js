// @ts-check
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import reactPlugin from "eslint-plugin-react";
import hooksPlugin from "eslint-plugin-react-hooks";
import tailwind from "eslint-plugin-tailwindcss";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import tseslint from "typescript-eslint";

export default tseslint.config(
    { ignores: ["dist-*/**", "dist/**", "node_modules/**"] },
    {
        files: ["src/**/*.{ts,tsx}", "vite.*.config.ts"],
        languageOptions: {
            parserOptions: {
                ecmaVersion: 2022,
                sourceType: "module",
                projectService: true,
                tsconfigRootDir: fileURLToPath(new URL(".", import.meta.url)),
            },
        },
        plugins: {
            react: reactPlugin,
            "react-hooks": hooksPlugin,
            tailwindcss: tailwind,
            "simple-import-sort": simpleImportSort,
            "@typescript-eslint": tseslint.plugin,
        },
        settings: {
            react: { version: "detect" },
            tailwindcss: {
                callees: ["classnames", "clsx", "ctl"],
                config: "./tailwind.config.js",
            },
        },
        rules: {
            ...js.configs.recommended.rules,
            ...reactPlugin.configs.recommended.rules,
            ...hooksPlugin.configs.recommended.rules,
            ...tseslint.configs.recommendedTypeChecked.rules,
            ...tseslint.configs.stylisticTypeChecked.rules,
            "react/react-in-jsx-scope": "off",
            "react/prop-types": "off",
            "tailwindcss/classnames-order": "warn",
            "tailwindcss/no-custom-classname": "off",
            "simple-import-sort/imports": "warn",
            "simple-import-sort/exports": "warn",
            "@typescript-eslint/no-floating-promises": "error",
            "@typescript-eslint/consistent-type-imports": [
                "warn",
                { prefer: "type-imports", fixStyle: "inline-type-imports" }
            ],
        },
    }
);


