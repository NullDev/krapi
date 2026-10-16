import { createMDX } from "fumadocs-mdx/next";

// github pages serves the site under /krapio; an empty BASE_PATH is for a domain of its own
const basePath = process.env.BASE_PATH ?? "/krapio";

/** @type {import("next").NextConfig} */
const config = {
    output: "export",
    basePath,
    trailingSlash: true,
    images: { unoptimized: true },
    reactStrictMode: true,
    env: { NEXT_PUBLIC_BASE_PATH: basePath },
    // the library's lockfile one level up is not this app's root
    turbopack: { root: import.meta.dirname },
};

export default createMDX()(config);
