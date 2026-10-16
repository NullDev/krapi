import Link from "next/link";
import { HomeLayout } from "fumadocs-ui/layouts/home";
import { baseOptions } from "@/lib/layout.shared";

export default function HomePage() {
    return (
        <HomeLayout {...baseOptions()}>
            <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 text-center">
                <h1 className="text-4xl font-semibold tracking-tight">krapi</h1>
                <p className="max-w-xl text-fd-muted-foreground">
                    A typed client for the Krunker.io APIs, and the documentation of the developer API, the endpoints the game reads without
                    auth, and the ones bound to a player token.
                </p>
                <div className="flex gap-3">
                    <Link href="/docs" className="rounded-md bg-fd-primary px-4 py-2 text-sm font-medium text-fd-primary-foreground">
                        Documentation
                    </Link>
                    <Link href="/docs/reference" className="rounded-md border px-4 py-2 text-sm font-medium">
                        Library reference
                    </Link>
                    <Link href="/openapi" className="rounded-md border px-4 py-2 text-sm font-medium">
                        OpenAPI
                    </Link>
                </div>
            </main>
        </HomeLayout>
    );
}
