import { createFromSource } from "fumadocs-core/search/server";
import { source } from "@/lib/source";

// the whole search index as one file, queried in the browser; a static export has no route handlers at runtime
export const { staticGET: GET } = createFromSource(source, { language: "english" });
export const dynamic = "force-static";
