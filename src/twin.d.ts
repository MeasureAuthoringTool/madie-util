import "twin.macro";
import styledImport, { css as cssImport } from "styled-components";

declare module "twin.macro" {
  const styled: typeof styledImport;
  const css: typeof cssImport;
}

// Allow the `tw`/`css` props (added by the twin.macro transform) so tsc accepts them.
declare module "react" {
  interface HTMLAttributes<T> {
    tw?: string;
    css?: any;
  }
  interface SVGAttributes<T> {
    tw?: string;
    css?: any;
  }
}
