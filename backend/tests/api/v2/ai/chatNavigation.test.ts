import {
    finalizeNavigationSuggestions,
    inferNavigationFromKeywords,
    resolveNavKeys,
} from "../../../../src/api/v2/ai/chatNavigation";

describe("chatNavigation", () => {
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

    it("inferNavigationFromKeywords matches user intent", () => {
        expect(inferNavigationFromKeywords("show my invoice history")).toEqual(
            expect.arrayContaining([expect.objectContaining({ to: "/invoices" })]),
        );
        expect(inferNavigationFromKeywords("despatch status")).toEqual(
            expect.arrayContaining([expect.objectContaining({ to: "/despatch" })]),
        );
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
});
