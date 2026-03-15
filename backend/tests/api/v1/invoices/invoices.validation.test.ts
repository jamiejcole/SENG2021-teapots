import { validateCreateInvoiceRequest, validateUBL } from '../../../../src/api/v1/invoices/invoices.validation';
import { HttpError } from '../../../../src/errors/HttpError';

describe('validateCreateInvoiceRequest', () => {
  const validBody = {
    orderXml: '<Order></Order>',
    invoiceSupplement: {
      currencyCode: 'AUD',
      taxRate: 0.1,
      taxScheme: {
        id: 'GST',
        taxTypeCode: 'GST',
      },
      paymentMeans: {
        code: '30',
        payeeFinancialAccount: {
          id: '12345',
          name: 'Main Account',
        },
      },
    },
  };

  it('does not throw for a valid request body shape', () => {
    expect(() => validateCreateInvoiceRequest(validBody)).not.toThrow();
  });

  it('throws when required root field is missing', () => {
    const invalid = {
      invoiceSupplement: validBody.invoiceSupplement,
    };

    expect(() => validateCreateInvoiceRequest(invalid)).toThrow(HttpError);
    expect(() => validateCreateInvoiceRequest(invalid)).toThrow("missing required field 'orderXml'");
  });

  it('throws when nested required field is missing', () => {
    const invalid = {
      ...validBody,
      invoiceSupplement: {
        ...validBody.invoiceSupplement,
        paymentMeans: {
          code: '30',
        },
      },
    };

    expect(() => validateCreateInvoiceRequest(invalid)).toThrow(HttpError);
    expect(() => validateCreateInvoiceRequest(invalid)).toThrow('payeeFinancialAccount');
  });
});

describe('validateUBL', () => {
  it('throws HttpError for non-xml string payload', () => {
    expect(() => validateUBL('not xml', 'Order')).toThrow(HttpError);
    expect(() => validateUBL('not xml', 'Order')).toThrow('valid XML string');
  });

  it('throws HttpError for malformed xml', () => {
    expect(() => validateUBL('<Order>', 'Order')).toThrow(HttpError);
    expect(() => validateUBL('<Order>', 'Order')).toThrow('XML Syntax Error');
  });
});
