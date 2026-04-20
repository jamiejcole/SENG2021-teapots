import {
    dedupeNav,
    finalizeNavigationSuggestions,
    inferNavigationFromKeywords,
    resolveNavKeys,
} from "../../../../src/api/v2/ai/chatNavigation";

describe("chatNavigation", () => {
    it("resolveNavKeys returns empty for non-array input", () => {
        expect(resolveNavKeys(null as unknown as string[])).toEqual([]);
    });

    it("resolveNavKeys skips non-string entries", () => {
        expect(resolveNavKeys(["invoices", 1 as unknown as string, "orders"])).toEqual([
            { to: "/invoices", label: "Invoices" },
            { to: "/orders", label: "Orders" },
        ]);
    });

    it("resolveNavKeys maps allowed keys and ignores unknown", () => {
        const got = resolveNavKeys(["invoices", "not-a-route", "orders"]);
        expect(got).toEqual([
            { to: "/invoices", label: "Invoices" },
            { to: "/orders", label: "Orders" },
        ]);
    });

    it("resolveNavKeys normalizes slashes and hyphens", () => {
        expect(resolveNavKeys(["/invoice-studio"])).toEqual([{ to: "/invoice-studio", label: "Invoice Studio" }]);
        expect(resolveNavKeys(["orders_create"])).toEqual([{ to: "/orders/create", label: "Create order" }]);
    });

    it("inferNavigationFromKeywords returns empty for blank text", () => {
        expect(inferNavigationFromKeywords("   ")).toEqual([]);
    });

    it("inferNavigationFromKeywords respects max", () => {
        const got = inferNavigationFromKeywords("dashboard and my invoices list", 1);
        expect(got).toHaveLength(1);
    });

    it("inferNavigationFromKeywords matches user intent", () => {
        expect(inferNavigationFromKeywords("show my invoice history")).toEqual(
            expect.arrayContaining([expect.objectContaining({ to: "/invoices" })]),
        );
        expect(inferNavigationFromKeywords("despatch status")).toEqual(
            expect.arrayContaining([expect.objectContaining({ to: "/despatch" })]),
        );
    });

    it("dedupeNav removes duplicate paths", () => {
        expect(
            dedupeNav([
                { to: "/a", label: "A" },
                { to: "/a", label: "A2" },
                { to: "/b", label: "B" },
            ]),
        ).toEqual([
            { to: "/a", label: "A" },
            { to: "/b", label: "B" },
        ]);
    });

    it("finalizeNavigationSuggestions prefers tool results over fallback", () => {
        const fromTool = [{ to: "/dashboard", label: "Overview" }];
        expect(finalizeNavigationSuggestions(fromTool, "my invoices")).toEqual(fromTool);
    });

    it("finalizeNavigationSuggestions uses fallback when tool empty", () => {
        const got = finalizeNavigationSuggestions([], "validate order against the schema");
        expect(got.length).toBeGreaterThan(0);
        expect(got[0]?.to).toBe("/validate");
    });

    it("finalizeNavigationSuggestions caps at max", () => {
        const many = [
            { to: "/dashboard", label: "Overview" },
            { to: "/invoices", label: "Invoices" },
            { to: "/orders", label: "Orders" },
            { to: "/despatch", label: "Despatches" },
        ];
        expect(finalizeNavigationSuggestions(many, "x", 2)).toHaveLength(2);
    });
});
