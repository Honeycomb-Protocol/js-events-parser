/**
 * @fileoverview
 * This module provides utilities for converting Anchor IDL structures, which
 * are a way to define and interact with Solana programs, to Beet structures.
 * Beet is a framework that defines structures in a specific way, and this module
 * bridges the gap between Anchor and Beet. The utilities cover the conversion
 * of both enumeration types and structures, with support for nested types
 * and custom mappings.
 *
 * The primary export functions are:
 * - `mapIdlToAnchorType`: Maps IDL type definitions to an AnchorTypeMap.
 * - `getNestedBeet`: Fetches nested structs within an AnchorTypeMap.
 * - `getStructBeet`: Converts an Anchor struct to a Beet structure.
 * - `getEnumBeet`: Converts an Anchor enum to a Beet enumeration.
 *
 * Author: gmraza
 */

import * as beet from "@metaplex-foundation/beet";
import * as beetSolana from "@metaplex-foundation/beet-solana";
import type {
  DataEnumBeet,
  FixableBeet,
  FixedSizeBeet,
} from "@metaplex-foundation/beet";

/**
 * Represents an enumeration type with multiple possible variants.
 */
export interface Enum {
  kind: "enum";
  variants: EnumItem[];
}

/**
 * Represents a specific item/variant within an enumeration.
 */
export interface EnumItem {
  name: string;
  fields: Field[];
}

/**
 * Represents a structure with defined fields.
 */
export interface Struct {
  kind: "struct";
  fields: Field[];
}

/**
 * Represents an Anchor type which can either be an Enum or Struct.
 */
export type AnchorType = { name: string; type: Enum | Struct };

/**
 * Represents a mapping between type names and their respective definitions.
 */
export type AnchorTypeMap = Map<string, AnchorType>;

type inlineType = { defined: string } | string;

/**
 * Represents a specific field, which can either be a direct type, a custom defined type, or a vector of types.
 */
export interface Field {
  name: string;
  type: inlineType | { vec: inlineType };
}

/**
 * Map IDL definitions into an AnchorTypeMap.
 * @param accounts - Anchor account definitions.
 * @param types - Anchor type definitions.
 */
export const mapIdlToAnchorType = ({
  types,
  accounts,
}: {
  accounts: AnchorType[];
  types: AnchorType[];
}) => {
  const map: AnchorTypeMap = new Map();
  types.forEach((type) => {
    map.set(type.name, type);
  });
  accounts.forEach((type) => {
    map.set(type.name, type);
  });
  return map;
};

/**
 * Custom mapping between certain types and their beet representations.
 */
const customMapping = {
  string: beet.utf8String,
};

/**
 * Resolve a type string to its corresponding FixableBeet or FixedSizeBeet type.
 * @param type - Type string to resolve.
 */
const typeResolver = (
  type: string
): FixableBeet<any, any> | FixedSizeBeet<any, any> => {
  const beetTarget = customMapping[type] || beet[type] || beetSolana[type];
  if (!beetTarget) {
    throw new Error(`Unknown type: ${type}`);
  }
  return beetTarget;
};

/**
 * Recursively fetch nested structs within an AnchorTypeMap.
 * @param name - Name of the type to fetch.
 * @param extraStructs - Map of additional structs.
 * @param tree - Nested path tree (for debugging purposes).
 */
export const getNestedBeet = (
  name: string,
  extraStructs: AnchorTypeMap,
  tree: string = ""
): FixableBeet<any, any> => {
  const type = extraStructs.get(name);
  console.log(name);
  const nextTree = tree ? `${tree}["${name}"]` : name;
  if (!type) throw new Error("Variant is undefined in ");
  switch (type.type.kind) {
    case "enum":
      return getEnumBeet(type.type, extraStructs);
    case "struct":
      return getStructBeet(type.type, extraStructs, nextTree);
  }
};
/**
 * Map an Anchor struct to a Beet FixableBeetArgsStruct.
 * @param type - Struct definition to map.
 * @param extraStructs - Map of additional structs.
 * @param description - Description of the struct.
 */
export const getStructBeet = (
  type: { fields: Field[] },
  extraStructs: AnchorTypeMap,
  description: string = ""
): FixableBeet<any, any> => {
  return new beet.FixableBeetArgsStruct<any>(
    type.fields.map((field) => {
      const isVec = typeof field.type != "string" && "vec" in field.type;
      const type = isVec ? (field.type as any).vec : field.type;
      return [
        field.name,
        beet.array(
          typeof type == "string"
            ? typeResolver(type)
            : getNestedBeet(
                type.defined,
                extraStructs,
                `${description}["${type.defined}"]`
              )
        ),
      ];
    }),
    description
  );
};

/**
 * Map an Anchor enum to a Beet DataEnum.
 * @param type - Enum definition to map.
 * @param extraStructs - Map of additional structs.
 * @param description - Description of the enum.
 */
export const getEnumBeet = (
  type: Enum,
  extraStructs: AnchorTypeMap,
  description: string = ""
): FixableBeet<any, any> => {
  let data: DataEnumBeet<any, any>[] = [];

  // Iterate over each event variant
  type.variants.forEach((variant) => {
    // Convert the event variant to a Beet and add it to the data array
    data.push([
      variant.name,
      variant.fields
        ? getStructBeet(
            variant,
            extraStructs,
            `${description}["${variant.name}"]`
          )
        : beet.unit,
    ]);
  });

  // Return a Beet DataEnum with the generated data array
  return beet.dataEnum(data);
};
