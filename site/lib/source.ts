import { loader } from "fumadocs-core/source";
import { applyMdxPreset } from "fumadocs-mdx/config";
import { defineDocs } from "fumadocs-mdx/macro";
import { remarkOpenApi } from "./remark-openapi.mjs";

// content/docs is filled by scripts/sync.mjs from ../docs plus the typedoc output, never edited by hand.
// the openapi plugin puts Scalar's operation block under every endpoint of the API docs
const docs = defineDocs({
    dir: "content/docs",
    docs: { mdxOptions: applyMdxPreset({ remarkPlugins: (plugins) => [...plugins, remarkOpenApi] }) },
});

export const source = loader({
    baseUrl: "/docs",
    source: docs.toFumadocsSource(),
});
