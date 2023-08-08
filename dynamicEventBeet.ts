// Import beet and beet-solana modules
import * as beet from "@metaplex-foundation/beet";
import * as beetSolana from "@metaplex-foundation/beet-solana";

// Import required types from beet
import type {
  DataEnumBeet,
  FixableBeet,
  FixedSizeBeet,
} from "@metaplex-foundation/beet";

/**
 * EventEnum interface represents a specific event with multiple possible variants
 */
export interface EventEnum {
  kind: string; // Name of the event
  variants: Event[]; // Array of possible event variants
}

/**
 * Event interface represents a specific variant of an event
 */
export interface Event {
  name: string; // Name of the variant
  fields: Field[]; // Fields related to the variant
}

/**
 * Field interface represents a specific field in an event variant
 */
export interface Field {
  name: string; // Name of the field
  type: string; // Type of the field
}

/**
 * getEventEnumBeet function converts an EventEnum to a Beet DataEnum
 * @param event - An EventEnum object
 * @returns A DataEnumBeet
 */
export const getEventEnumBeet = (event: EventEnum) => {
  let data: DataEnumBeet<any, any>[] = [];

  // Iterate over each event variant
  event.variants.forEach((variant) => {
    // Convert the event variant to a Beet and add it to the data array
    data.push([
      variant.name,
      getEventStructBeet(variant) as FixableBeet<any, any>,
    ]);
  });

  // Return a Beet DataEnum with the generated data array
  return beet.dataEnum(data);
};

/**
 * Type resolver function
 * @param type - A string representing the type
 * @returns A FixableBeet or FixedSizeBeet based on the type
 */
const typeResolver = (
  type: string
): FixableBeet<any, any> | FixedSizeBeet<any, any> => {
  // Resolve the type to either a beet or beetSolana type
  // @ts-ignore
  const beetTarget = beet[type] || beetSolana[type];
  if (!beetTarget) {
    throw new Error(`Unknown type: ${type}`);
  }
  return beetTarget;
};

/**
 * getEventStructBeet function converts an Event to a Beet FixableBeetArgsStruct
 * @param variant - An Event object
 * @returns A FixableBeetArgsStruct object
 */
const getEventStructBeet = (variant: Event) => {
  // Map each field in the event variant to a new array with the field name and resolved type
  // Then create a new Beet FixableBeetArgsStruct with the mapped fields and the variant name
  return new beet.FixableBeetArgsStruct<any>(
    variant.fields.map((field) => [field.name, typeResolver(field.type)]),
    `EventRecord["${variant.name}"]`
  );
};
