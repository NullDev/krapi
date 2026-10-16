import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";

export function baseOptions(): BaseLayoutProps {
    return {
        nav: { title: "krapi" },
        githubUrl: "https://github.com/NullDev/krapi",
        links: [
            { text: "Documentation", url: "/docs", active: "nested-url" },
            { text: "Reference", url: "/docs/reference", active: "nested-url" },
            { text: "npm", url: "https://www.npmjs.com/package/krapi", external: true },
        ],
    };
}
