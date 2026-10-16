"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const SCALAR_URL = "https://cdn.jsdelivr.net/npm/@scalar/api-reference@1.75.0";

type ScalarApp = { destroy?: () => void; updateConfiguration?: (config: Record<string, unknown>) => void };
type ScalarGlobal = { createApiReference: (target: HTMLElement, config: Record<string, unknown>) => ScalarApp };

const scalarOf = (): ScalarGlobal | undefined => (window as unknown as { Scalar?: ScalarGlobal }).Scalar;
const isDark = (): boolean => document.documentElement.classList.contains("dark");

/** loads Scalar's bundle once per page */
function loadScalar(onReady: () => void): () => void {
    if (scalarOf()){
        onReady();
        return () => {};
    }
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCALAR_URL}"]`);
    const script = existing ?? document.createElement("script");
    script.addEventListener("load", onReady);
    if (!existing){
        script.src = SCALAR_URL;
        script.async = true;
        document.body.appendChild(script);
    }
    return () => script.removeEventListener("load", onReady);
}

// Scalar routes by hash and rewrites it on mount and while scrolling (`#.../GET/api/player/{playerName}`); the docs own
// the hash (their section anchors never contain a slash), so those writes are dropped
let hashKept = false;
function keepHash(): void {
    if (hashKept) return;
    hashKept = true;
    for (const method of ["replaceState", "pushState"] as const){
        const original = history[method].bind(history);
        history[method] = (state, unused, url) => {
            if (typeof url === "string" && /#[^/]*\//.test(url)) return;
            original(state, unused, url);
        };
    }
}

/** one operation as Scalar renders it, over its slice of openapi.json; mounts when scrolled near, the pages hold dozens */
function ScalarOperation({ spec, className }: { spec: string; className: string }) {
    const container = useRef<HTMLDivElement>(null);
    const [near, setNear] = useState(false);

    useEffect(() => {
        const target = container.current;
        if (!target || near) return undefined;
        const observer = new IntersectionObserver((entries) => {
            if (entries.some((entry) => entry.isIntersecting)) setNear(true);
        }, { rootMargin: "800px 0px" });
        // the split embed is `display: contents` and has no box of its own, its section has one
        observer.observe(target.closest(".api-endpoint") ?? target);
        return () => observer.disconnect();
    }, [near]);

    useEffect(() => {
        const target = container.current;
        if (!target || !near) return undefined;
        let app: ScalarApp | undefined;
        let cancelled = false;
        const theme = (): Record<string, unknown> => ({ forceDarkModeState: isDark() ? "dark" : "light" });
        const observer = new MutationObserver(() => app?.updateConfiguration?.(theme()));
        // the auth of the tier is selected from the start: the key on developer endpoints, the bearer token on token ones.
        // operation ids are the routes: `player.profile` (developer), `game.turf.clan`, `token.player.me`
        const preferred = spec.startsWith("game.") ? undefined : spec.startsWith("token.") ? "accessToken" : "developerApiKey";
        const unload = loadScalar(() => {
            const scalar = scalarOf();
            if (cancelled || !scalar) return;
            keepHash();
            app = scalar.createApiReference(target, {
                url: `${BASE}/openapi/${spec}.json`,
                showSidebar: false,
                showToolbar: "never",
                showDeveloperTools: "never",
                agent: { disabled: true },
                authentication: preferred ? { preferredSecurityScheme: preferred } : undefined,
                hideModels: true,
                hideSearch: true,
                documentDownloadType: "none",
                hideDarkModeToggle: true,
                hideClientButton: true,
                withDefaultFonts: false,
                theme: "none",
                ...theme(),
            });
            observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
            // Scalar lays its sections out lazily from real boxes; the grid takes its parts apart only once the operation is rendered
            const rendered = new MutationObserver(() => {
                if (!target.querySelector(".operation-details")) return;
                target.classList.add("scalar-ready");
                rendered.disconnect();
            });
            rendered.observe(target, { childList: true, subtree: true });
        });
        return () => {
            cancelled = true;
            observer.disconnect();
            unload();
            app?.destroy?.();
        };
    }, [spec, near]);

    return <div ref={container} className={className} />;
}

/**
 * an endpoint section of the docs: the markdown (prose, tables, notes) on the left followed by Scalar's parameter and
 * response lists, Scalar's request and response examples sticky on the right. a section naming several endpoints keeps
 * Scalar's own layout for each of them under the markdown
 */
export function APIEndpoint({ operations, children }: { operations: string; children: ReactNode }) {
    const ids = operations.split(" ");
    return (
        <section className={`api-endpoint ${ids.length === 1 ? "api-endpoint-single" : "api-endpoint-multi"}`}>
            <div className="api-endpoint-prose">{children}</div>
            {ids.map((id) => <ScalarOperation key={id} spec={id} className="scalar-embed not-prose" />)}
        </section>
    );
}
