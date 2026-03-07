import path from "node:path";
import * as TJS from "typescript-json-schema";

const replaceDefinitionRefs = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(replaceDefinitionRefs);
  }

  if (value && typeof value === "object") {
    const updatedEntries = Object.entries(value as Record<string, unknown>).map(
      ([key, entryValue]) => {
        if (
          key === "$ref" &&
          typeof entryValue === "string" &&
          entryValue.startsWith("#/definitions/")
        ) {
          return [key, entryValue.replace("#/definitions/", "#/components/schemas/")];
        }

        return [key, replaceDefinitionRefs(entryValue)];
      }
    );

    return Object.fromEntries(updatedEntries);
  }

  return value;
};

/**
 * Generates a schema for the InvoiceSupplement Interface in /types/invoice.types.ts at runtime
 */
export const generateInvoiceSupplementSchemas = (): Record<string, unknown> => {
  const invoiceTypesPath = path.resolve(process.cwd(), "src/types/invoice.types.ts");

  const compilerOptions: TJS.CompilerOptions = {
    strictNullChecks: true,
  };

  const settings: TJS.PartialArgs = {
    required: true,
  };

  const program = TJS.getProgramFromFiles([invoiceTypesPath], compilerOptions, process.cwd());
  const schema = TJS.generateSchema(program, "InvoiceSupplement", settings);

  if (!schema) {
    throw new Error("Failed to generate schema for InvoiceSupplement");
  }

  const rawDefinitions = schema.definitions ?? {};
  const schemas = Object.fromEntries(
    Object.entries(rawDefinitions).map(([name, rawSchema]) => [
      name,
      replaceDefinitionRefs(rawSchema),
    ])
  );

  if (!schemas.InvoiceSupplement) {
    const { $schema, definitions, ...inlineSchema } = schema;
    void $schema;
    void definitions;
    schemas.InvoiceSupplement = replaceDefinitionRefs(inlineSchema);
  }

  return schemas;
};