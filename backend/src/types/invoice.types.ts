export interface PartyTaxScheme {
    companyId?: string;
    taxSchemeId: string;
}

export interface InvoiceSupplement {
    invoiceNumber?: string;
    issueDate?: string;
    dueDate?: string;
    note?: string;
    currencyCode: string;
    taxRate: number;
    taxScheme: {
        id: string;
        taxTypeCode: string;
    };
    supplierPartyTaxScheme?: PartyTaxScheme;
    customerPartyTaxScheme?: PartyTaxScheme;
    paymentMeans: {
        code: string;
        payeeFinancialAccount: {
            id: string;
            name: string;
            branchId?: string;
        }
    };
    paymentTerms?: {
        note: string;
    };
    customizationId?: string;
    profileId?: string;
};

export const INVOICE_CUSTOMIZATION_ID = "urn:cen.eu:en16931:2017#conformant#urn:fdc:peppol.eu:2017:poacc:billing:international:aunz:3.0";
export const INVOICE_PROFILE_ID = "urn:fdc:peppol.eu:2017:poacc:billing:01:1.0";
export const INVOICE_TYPE_CODE = "380";
export const DEFAULT_PARTY_TAX_SCHEME: PartyTaxScheme = {
    taxSchemeId: "GST"
};