/** Computed breakdown for a particular invoice line */
export interface LineTotals {
    lineId: number;
    quantity: string;
    unitPrice: string;
    lineExtensionAmount: string;
    lineTaxAmount: string;
}

/** Summed total for the entire invoice */
export interface InvoiceSummary {
    lineExtensionTotal: string;
    taxTotal: string;
    taxExclusiveAmount: string;
    taxInclusiveAmount: string;
    payableAmount: string;
}

export interface IntegrityViolation {
    rule: string;
    message: string;
}

/**
 * A financial computation engine for UBL invoices
 *
 * All internal arithmetic uses integer cents (minor currency units) to ensure
 * javascript floating point errors are avoided.
 */
export class InvoiceCalculator {
    readonly lineTotals: LineTotals[];
    readonly summary: InvoiceSummary;

    private readonly taxRate: number;

    /**
     * @param orderLines Array of order lines
     * @param taxRate Tax rate in decimal e.g. 0.10
     */
    constructor(orderLines: any[], taxRate: number) {
        this.taxRate = taxRate;
        this.lineTotals = orderLines.map((line, idx) => this.computeLine(line, idx));
        this.summary = this.computeSummary();
    }

    /**
     * Run all integrity checks and throw an `InvoiceIntegrityError` if any fail
     */
    validate(): void {
        const violations = this.collectViolations();
        if (violations.length > 0) {
            throw new InvoiceIntegrityError(violations);
        }
    }

    collectViolations(): IntegrityViolation[] {
        const violations: IntegrityViolation[] = [];

        // Rule 1: Each line extension must equal `qty x unitPrice`
        for (const lt of this.lineTotals) {
            const expectedCents = InvoiceCalculator.mulCents(
                InvoiceCalculator.toCents(lt.quantity),
                InvoiceCalculator.toCents(lt.unitPrice),
            );
            const actualCents = InvoiceCalculator.toCents(lt.lineExtensionAmount);
            if (expectedCents !== actualCents) {
                violations.push({
                    rule: 'LINE_EXT_MISMATCH',
                    message:
                        `Line ${lt.lineId}: expected lineExtensionAmount ` +
                        `${InvoiceCalculator.toDecimal(expectedCents)} ` +
                        `(qty ${lt.quantity} × price ${lt.unitPrice}) ` +
                        `but got ${lt.lineExtensionAmount}.`,
                });
            }
        }

        // Rule 2: Sum of line extensions must equal the document level lineExtensionTotal
        const sumOfLinesCents = this.lineTotals.reduce(
            (s, lt) => s + InvoiceCalculator.toCents(lt.lineExtensionAmount), 0,
        );
        const totalLineExtCents = InvoiceCalculator.toCents(this.summary.lineExtensionTotal);
        if (sumOfLinesCents !== totalLineExtCents) {
            violations.push({
                rule: 'LINE_SUM_MISMATCH',
                message:
                    `Sum of line extensions (${InvoiceCalculator.toDecimal(sumOfLinesCents)}) ` +
                    `does not equal lineExtensionTotal (${this.summary.lineExtensionTotal}).`,
            });
        }

        // Rule 3: taxTotal must equal sum of per line tax amounts
        const sumOfLineTaxCents = this.lineTotals.reduce(
            (s, lt) => s + InvoiceCalculator.toCents(lt.lineTaxAmount), 0,
        );
        const taxTotalCents = InvoiceCalculator.toCents(this.summary.taxTotal);
        if (sumOfLineTaxCents !== taxTotalCents) {
            violations.push({
                rule: 'TAX_SUM_MISMATCH',
                message:
                    `Sum of per-line tax amounts (${InvoiceCalculator.toDecimal(sumOfLineTaxCents)}) ` +
                    `does not equal taxTotal (${this.summary.taxTotal}).`,
            });
        }

        // Rule 4: taxExclusiveAmount must equal lineExtensionTotal
        if (this.summary.taxExclusiveAmount !== this.summary.lineExtensionTotal) {
            violations.push({
                rule: 'TAX_EXCLUSIVE_MISMATCH',
                message:
                    `taxExclusiveAmount (${this.summary.taxExclusiveAmount}) ` +
                    `must equal lineExtensionTotal (${this.summary.lineExtensionTotal}).`,
            });
        }

        // Rule 5: taxInclusiveAmount must equal `taxExclusive + taxTotal`
        const expectedInclusiveCents = totalLineExtCents + taxTotalCents;
        const actualInclusiveCents = InvoiceCalculator.toCents(this.summary.taxInclusiveAmount);
        if (expectedInclusiveCents !== actualInclusiveCents) {
            violations.push({
                rule: 'TAX_INCLUSIVE_MISMATCH',
                message:
                    `taxInclusiveAmount (${this.summary.taxInclusiveAmount}) ` +
                    `must equal taxExclusiveAmount + taxTotal ` +
                    `(${InvoiceCalculator.toDecimal(expectedInclusiveCents)}).`,
            });
        }

        // Rule 6: payableAmount must equal taxInclusiveAmount
        if (this.summary.payableAmount !== this.summary.taxInclusiveAmount) {
            violations.push({
                rule: 'PAYABLE_MISMATCH',
                message:
                    `payableAmount (${this.summary.payableAmount}) ` +
                    `must equal taxInclusiveAmount (${this.summary.taxInclusiveAmount}).`,
            });
        }

        // Rule 7: No negative totals!
        if (InvoiceCalculator.toCents(this.summary.payableAmount) < 0) {
            violations.push({
                rule: 'NEGATIVE_PAYABLE',
                message: `payableAmount (${this.summary.payableAmount}) must not be negative.`,
            });
        }

        return violations;
    }

    // Handle per-line calculations
    private computeLine(line: any, index: number): LineTotals {
        const item = line.LineItem;
        const quantity = String(item.Quantity?.value ?? item.Quantity ?? '0');
        const unitPrice = String(item.Price?.PriceAmount?.value ?? '0.00');

        const qtyCents = InvoiceCalculator.toCents(quantity);
        const priceCents = InvoiceCalculator.toCents(unitPrice);

        const lineExtCents = InvoiceCalculator.mulCents(qtyCents, priceCents);
        const lineTaxCents = InvoiceCalculator.applyRate(lineExtCents, this.taxRate);

        return {
            lineId: index + 1,
            quantity,
            unitPrice,
            lineExtensionAmount: InvoiceCalculator.toDecimal(lineExtCents),
            lineTaxAmount: InvoiceCalculator.toDecimal(lineTaxCents),
        };
    }

    // Computes a summary of all invoice lines
    private computeSummary(): InvoiceSummary {
        const lineExtTotalCents = this.lineTotals.reduce(
            (s, lt) => s + InvoiceCalculator.toCents(lt.lineExtensionAmount), 0,
        );
        const taxTotalCents = this.lineTotals.reduce(
            (s, lt) => s + InvoiceCalculator.toCents(lt.lineTaxAmount), 0,
        );
        const inclusiveCents = lineExtTotalCents + taxTotalCents;

        return {
            lineExtensionTotal: InvoiceCalculator.toDecimal(lineExtTotalCents),
            taxTotal: InvoiceCalculator.toDecimal(taxTotalCents),
            taxExclusiveAmount: InvoiceCalculator.toDecimal(lineExtTotalCents),
            taxInclusiveAmount: InvoiceCalculator.toDecimal(inclusiveCents),
            payableAmount: InvoiceCalculator.toDecimal(inclusiveCents),
        };
    }

    /**
     * Convert a decimal string/number to an integer count of cents. Handles 2 d.p
     */
    static toCents(value: string | number): number {
        const str = typeof value === 'number' ? value.toFixed(2) : value;
        const [whole = '0', frac = ''] = str.split('.');
        const paddedFrac = (frac + '00').slice(0, 2);
        const sign = whole.startsWith('-') ? -1 : 1;
        const absWhole = whole.replace('-', '');
        return sign * (parseInt(absWhole, 10) * 100 + parseInt(paddedFrac, 10));
    }

    /**
     * Convert integer cents back to a 2 d.p. string
     */
    static toDecimal(cents: number): string {
        const sign = cents < 0 ? '-' : '';
        const abs = Math.abs(cents);
        const whole = Math.floor(abs / 100);
        const frac = abs % 100;
        return `${sign}${whole}.${frac.toString().padStart(2, '0')}`;
    }

    /**
     * Multiply two cent values
     */
    static mulCents(aCents: number, bCents: number): number {
        return Math.round((aCents * bCents) / 10000);
    }

    /**
     * Apply a decimal tax rate to a cents amount
     */
    static applyRate(cents: number, rate: number): number {
        return Math.round(cents * rate);
    }
}

/**
 * Thrown when one or more financial integrity checks fail
 */
export class InvoiceIntegrityError extends Error {
    readonly violations: IntegrityViolation[];

    constructor(violations: IntegrityViolation[]) {
        const summary = violations.map(v => `  [${v.rule}] ${v.message}`).join('\n');
        super(`Invoice financial integrity check failed:\n${summary}`);
        this.name = 'InvoiceIntegrityError';
        this.violations = violations;
        Object.setPrototypeOf(this, InvoiceIntegrityError.prototype);
    }
}
