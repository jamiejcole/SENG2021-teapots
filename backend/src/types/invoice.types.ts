export default interface InvoiceSupplement {
    invoiceNumber?: string;
    issueDate?: string;
    dueDate?: string;
    currencyCode: string;
    taxRate: number;
    taxScheme: {
        id: string;
        taxTypeCode: string;
    };
    paymentMeans: {
        code: string;
        payeeFinancialAccount: {
            id: string;
            name: string;
            branchId?: string;
        }
    };
    customizationId: string;
    profileId: string;
}