// TODO: Include logic for invoice validation
export function validateCreateInvoice(input: any) {
    if (!input.lines || !Array.isArray(input.lines) || input.lines.length === 0) {
        throw new Error("At least one invoice line is required");
    }
}