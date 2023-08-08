import { getEventEnumBeet } from "../dynamicEventBeet";

export const eventBeet = getEventEnumBeet(require("./event.json"));

export function parseEvent(data: Buffer): Event {
  let event = eventBeet.toFixedFromData(data, 0);

  return event.read(data, 0);
}

console.log(
  parseEvent(
    Buffer.from(
      "00375b0199df596927c32c052c6621d7da2058f2e04133b51bbc71f4462539099ef6000000fab670e1e655ea69ae80c06cbfd04bd6c56b8e57058caa5c7f888e7edf8051ceef393f07df10fb7a31d49cadb174d745ba8f1ac9d668718fe19b2dac124088bdafb01c75fbbad364eded114be6e2811177ac23575d4ba4a0ef9a0bc3c77563784f9c0ecd640000000000040000008500000000000000000000420b6f5c000000010fa5ae8d0520c66cfba67c0a147a67fd5f914181c127a15a5d8a39e6536c6f170000ed4d3e0900000001bf9ceefb97f1ee9b1be51f237974aa5ba053d64dd7ff22d0807eca6783cb8ed30000e5bd1803000000014769a6489b6ccb13d15033b081f2220c112850e0c372160b1be37f312756ed23009b0ecd6400000000",
      "hex"
    )
  )
);
