import "./global.css";
import { RootProvider } from "fumadocs-ui/provider/next";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { StaticSearchDialog } from "@/components/search";

export const metadata: Metadata = {
    title: { template: "%s | krapio", default: "krapio" },
    description: "Typed client and documentation for the Krunker.io APIs",
};

export default function Layout({ children }: { children: ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className="flex flex-col min-h-screen">
                <RootProvider search={{ SearchDialog: StaticSearchDialog }}>{children}</RootProvider>
            </body>
        </html>
    );
}
