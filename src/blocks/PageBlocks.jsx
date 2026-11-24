// Draws a page from its block list (src/content/pages/<page>.json): { content: [{ type, props }] }.
// `blocks`: the page's own blocks (loaded with the page); anything else comes from the registry.
import { Suspense } from "react";
import { BLOCKS, isLazyBlock } from "./registry";

export default function PageBlocks({ data, blocks }) {
  return (
    <>
      {(data?.content || []).map((item, i) => {
        const own = blocks?.[item.type];
        const Block = own || BLOCKS[item.type];
        if (!Block) return null;
        const { id, ...props } = item.props || {};
        const el = <Block key={id || i} {...props} />;
        return !own && isLazyBlock(item.type) ? <Suspense key={id || i} fallback={null}>{el}</Suspense> : el;
      })}
    </>
  );
}
