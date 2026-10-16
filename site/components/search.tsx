"use client";

import { useDocsSearch } from "fumadocs-core/search/client";
import { staticClient } from "fumadocs-core/search/client/orama-static";
import {
    SearchDialog,
    SearchDialogClose,
    SearchDialogContent,
    SearchDialogHeader,
    SearchDialogIcon,
    SearchDialogInput,
    SearchDialogList,
    SearchDialogOverlay,
    type SharedProps,
} from "fumadocs-ui/components/dialog/search";
import { useMemo } from "react";

// the index that app/static.json/route.ts exports at build time; fetched once, searched in the browser
const INDEX_URL = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/static.json`;

export function StaticSearchDialog(props: SharedProps) {
    const client = useMemo(() => staticClient({ from: INDEX_URL }), []);
    const search = useDocsSearch({ client });
    return (
        <SearchDialog {...search} {...props}>
            <SearchDialogOverlay />
            <SearchDialogContent>
                <SearchDialogHeader>
                    <SearchDialogIcon />
                    <SearchDialogInput />
                    <SearchDialogClose />
                </SearchDialogHeader>
                <SearchDialogList />
            </SearchDialogContent>
        </SearchDialog>
    );
}
