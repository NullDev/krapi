import { HomeLayout } from "fumadocs-ui/layouts/home";
import type { Metadata } from "next";
import Link from "next/link";
import spec from "@/public/openapi.json";
import { baseOptions } from "@/lib/layout.shared";

const SPEC_URL = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/openapi.json`;

export const metadata: Metadata = {
    title: "OpenAPI",
    description: "Every endpoint krapi wraps as an OpenAPI document, generated from the source",
};

const Badge = ({ children }: { children: string }) => (
    <span className="rounded-md border px-2 py-0.5 font-mono text-xs text-fd-muted-foreground">{children}</span>
);

export default function OpenApiPage() {
    const { info, openapi, paths } = spec;
    return (
        <HomeLayout {...baseOptions()}>
            <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 px-4 py-16">
                <div className="flex flex-wrap gap-2">
                    <Badge>{`v${info.version}`}</Badge>
                    <Badge>{`OpenAPI ${openapi}`}</Badge>
                    <Badge>{info.license.name}</Badge>
                    <Badge>{`${Object.keys(paths).length} paths`}</Badge>
                </div>
                <h1 className="text-3xl font-semibold tracking-tight">{info.title}</h1>
                <p className="text-fd-muted-foreground">{info.description}</p>
                <div className="flex flex-wrap gap-3">
                    <a href={SPEC_URL} download="openapi.json" className="rounded-md bg-fd-primary px-4 py-2 text-sm font-medium text-fd-primary-foreground">
                        Download OpenAPI Document
                    </a>
                    <Link href="/docs" className="rounded-md border px-4 py-2 text-sm font-medium">
                        Documentation
                    </Link>
                </div>
                <p className="text-sm text-fd-muted-foreground">
                    The request samples and response examples on the API pages are rendered from this document. It is generated from the library
                    source on every build, never edited by hand, and the same file is checked in at the repository root. Point any OpenAPI client
                    generator or API tool at the URL above.
                </p>
            </main>
        </HomeLayout>
    );
}
