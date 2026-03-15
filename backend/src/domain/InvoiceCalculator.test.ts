import { InvoiceCalculator, InvoiceIntegrityError } from './InvoiceCalculator';

describe('InvoiceCalculator', () => {
  const orderLines = [
    {
      LineItem: {
        Quantity: { value: '2' },
        Price: { PriceAmount: { value: '10.00' } },
      },
    },
    {
      LineItem: {
        Quantity: { value: '3' },
        Price: { PriceAmount: { value: '5.50' } },
      },
    },
  ];

  it('computes line totals and invoice summary correctly', () => {
    const calc = new InvoiceCalculator(orderLines, 0.1);

    expect(calc.lineTotals).toEqual([
      {
        lineId: 1,
        quantity: '2',
        unitPrice: '10.00',
        lineExtensionAmount: '20.00',
        lineTaxAmount: '2.00',
      },
      {
        lineId: 2,
        quantity: '3',
        unitPrice: '5.50',
        lineExtensionAmount: '16.50',
        lineTaxAmount: '1.65',
      },
    ]);

    expect(calc.summary).toEqual({
      lineExtensionTotal: '36.50',
      taxTotal: '3.65',
      taxExclusiveAmount: '36.50',
      taxInclusiveAmount: '40.15',
      payableAmount: '40.15',
    });
  });

  it('passes validate when no integrity violations exist', () => {
    const calc = new InvoiceCalculator(orderLines, 0.1);
    expect(() => calc.validate()).not.toThrow();
  });

  it('throws InvoiceIntegrityError when summary is tampered', () => {
    const calc = new InvoiceCalculator(orderLines, 0.1);

    (calc.summary as { payableAmount: string }).payableAmount = '999.99';

    expect(() => calc.validate()).toThrow(InvoiceIntegrityError);
    expect(calc.collectViolations().some((v) => v.rule === 'PAYABLE_MISMATCH')).toBe(true);
  });

  it('converts between decimal strings and cents', () => {
    expect(InvoiceCalculator.toCents('12.34')).toBe(1234);
    expect(InvoiceCalculator.toDecimal(1234)).toBe('12.34');
    expect(InvoiceCalculator.toCents('-1.20')).toBe(-120);
    expect(InvoiceCalculator.toDecimal(-120)).toBe('-1.20');
  });

  it('computes line extension cents with decimal quantity', () => {
    expect(InvoiceCalculator.computeLineExtensionCents('1.5', '10.00')).toBe(1500);
    expect(InvoiceCalculator.computeLineExtensionCents('0.25', '8.00')).toBe(200);
  });
});
