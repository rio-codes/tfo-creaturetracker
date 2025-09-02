import { defineConfig } from "eslint/config";

export default defineConfig([
	{
		extends: [
			"next/core-web-vitals",
			"plugin:prettier/recommended", 
			"eslint:recommended", 
			"plugin:@typescript-eslint/recommended",
		]
	},
]);
