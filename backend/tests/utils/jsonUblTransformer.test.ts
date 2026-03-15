import { create } from 'xmlbuilder2';
import * as libxml from 'libxmljs2';
import { mapElementToJson, mapParty } from '../../src/utils/jsonUblTransformer';

describe('jsonUblTransformer', () => {
  it('maps XML elements with attributes and repeated children to JSON', () => {
    const xml = `
      <Root id="1">
        <Name>Example</Name>
        <Tag code="A">One</Tag>
        <Tag code="B">Two</Tag>
      </Root>
    `;

    const doc = libxml.parseXml(xml);
    const result = mapElementToJson(doc.root() as libxml.Element);

    expect(result['@id']).toBe('1');
    expect(result.Name).toBe('Example');
    expect(result.Tag).toEqual([
      { '@code': 'A', value: 'One' },
      { '@code': 'B', value: 'Two' },
    ]);
  });

  it('returns plain text for leaf nodes without attributes', () => {
    const doc = libxml.parseXml('<Root><Leaf>Value</Leaf></Root>');
    const root = doc.root() as libxml.Element;
    const leaf = root.get('Leaf') as unknown as libxml.Element;

    expect(mapElementToJson(leaf)).toBe('Value');
  });

  it('maps Party details including tax scheme and nested fields', () => {
    const root = create({ version: '1.0' }).ele('Root');

    mapParty(
      root.ele('cac:AccountingSupplierParty'),
      {
        EndpointID: { value: 'SUP-1' },
        PartyIdentification: { ID: { value: 'P1' } },
        PartyName: { Name: { value: 'Seller Name' } },
        PostalAddress: {
          StreetName: { value: 'Main' },
          BuildingNumber: { value: '1' },
          CityName: { value: 'Sydney' },
          PostalZone: { value: '2000' },
          Country: { IdentificationCode: { value: 'AU' } },
        },
        Contact: { ElectronicMail: { value: 'seller@example.com' } },
      },
      { companyId: 'ABN123', taxSchemeId: 'GST' },
    );

    const xml = root.end({ prettyPrint: false });

    expect(xml).toContain('<cbc:CompanyID>ABN123</cbc:CompanyID>');
    expect(xml).toContain('<cbc:ID>GST</cbc:ID>');
    expect(xml).toContain('<cbc:ElectronicMail>seller@example.com</cbc:ElectronicMail>');
  });

  it('is a no-op when no party data is provided', () => {
    const root = create({ version: '1.0' }).ele('Root');
    mapParty(root, undefined);

    const xml = root.end({ prettyPrint: false });
    expect(xml).toContain('<Root/>');
  });
});
