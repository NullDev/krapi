import { loader } from "fumadocs-core/source";
import { defineDocs } from "fumadocs-mdx/macro";

// content/docs is filled by scripts/sync.mjs from ../docs plus the typedoc output, never edited by hand
const docs = defineDocs({ dir: "content/docs" });

export const source = loader({
    baseUrl: "/docs",
    source: docs.toFumadocsSource(),
});
