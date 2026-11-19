import type { Attributes, ReactNode } from "react";

// The types of React name no element of MathML, which app/math-notation.tsx writes. Each element takes only the attributes that the notation sets on it.
interface MathElementProperties extends Attributes {
  children?: ReactNode;
}

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      math: MathElementProperties & {
        className?: string | undefined;
        displaystyle?: "true";
      };
      mfrac: MathElementProperties;
      mi: MathElementProperties;
      mn: MathElementProperties;
      mo: MathElementProperties;
      mover: MathElementProperties & { accent: "true" };
      mrow: MathElementProperties;
      mspace: { width: string };
      msqrt: MathElementProperties;
      msub: MathElementProperties;
      msubsup: MathElementProperties;
      msup: MathElementProperties;
      mtable: MathElementProperties & { displaystyle: "true" };
      mtd: MathElementProperties;
      mtext: MathElementProperties;
      mtr: MathElementProperties;
      munder: MathElementProperties;
    }
  }
}
