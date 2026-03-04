export interface UBLValue {
    value: string;
    [key: string]: string | undefined;
}

export interface UBLPartyNode {
    Party: {
        PartyName?: { Name: string | UBLValue };
        PostalAddress?: Record<string, any>;
        [key: string]: any;
    };
}

export interface UBLOrderLine {
    LineItem: {
        ID: string | UBLValue;
        Quantity: UBLValue;
        LineExtensionAmount: UBLValue;
        Price: {
            PriceAmount: UBLValue;
        };
        Item: {
            Name: string | UBLValue;
            [key: string]: any;
        };
        [key: string]: any;
    };
}

/**
 * Represents a UBL Order JSON Object. 
 * 
 * Intentionally extremely vaguely typed...
 */
export interface OrderData {
    ID: string | UBLValue;
    IssueDate: string | UBLValue;
    DocumentCurrencyCode?: string | UBLValue;
    BuyerCustomerParty: UBLPartyNode;
    SellerSupplierParty: UBLPartyNode;
    OrderLine: UBLOrderLine | UBLOrderLine[];
    [key: string]: any;
}