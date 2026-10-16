import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
import { APIEndpoint } from "./api-endpoint";

export function getMDXComponents(components?: MDXComponents): MDXComponents {
    return { ...defaultMdxComponents, APIEndpoint, ...components };
}
