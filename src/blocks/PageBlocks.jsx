// Draws a page from its block list (src/content/pages/<page>.json): { content: [{ type, props }] }.
import { BLOCKS } from "./registry";

export default function PageBlocks({ data }) {
  return (
    <>
      {(data?.content || []).map((item, i) => {
        const Block = BLOCKS[item.type];
        if (!Block) return null;
        const { id, ...props } = item.props || {};
        return <Block key={id || i} {...props} />;
      })}
    </>
  );
}
