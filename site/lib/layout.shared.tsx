import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";

export function baseOptions(): BaseLayoutProps {
    return {
        nav: { title: "krapio" },
        githubUrl: "https://github.com/NullDev/krapio",
        links: [
            { text: "Documentation", url: "/docs", active: "nested-url" },
            { text: "Reference", url: "/docs/reference", active: "nested-url" },
            { text: "OpenAPI", url: "/openapi", active: "nested-url" },
            { text: "npm", url: "https://www.npmjs.com/package/krapio", external: true },
        ],
    };
}
