import { useEffect, useMemo, useRef, useState } from "react";
import type { RefObject } from "react";
import {
  estimatedLabelWidth,
  keptNameRoom,
  placeMapLabels,
} from "./map-labels";
import type { LabelledMark, MapLabels, PlacedLabels } from "./map-labels";

// Before a browser measures the plot, the labels take their places in the plot of a phone 360 pixels wide, the narrowest that Portolab lays out, in which the marks lie closest together. Its size is in sizes of the text of the labels.
const phonePlot = { width: 22 - keptNameRoom, height: 17 };

/** Where the labels of a map stand, as decision 0035 sets: where the server placed them from estimated widths in the plot of a phone, until the browser has measured each label and the plot, which it does once the fonts load and again whenever the plot changes its size. The refs go on the area of the plot, on the drawing, whose size of text every length of the map counts in, and on a hidden text in the font of the labels. textSize gives that size in pixels once the drawing is on the page. */
export function useMapLabels(
  labels: MapLabels,
  marks: readonly LabelledMark[],
): {
  placed: PlacedLabels;
  areaRef: RefObject<HTMLDivElement | null>;
  drawingRef: RefObject<SVGSVGElement | null>;
  measureRef: RefObject<SVGTextElement | null>;
  textSize: () => number | undefined;
} {
  const areaRef = useRef<HTMLDivElement>(null);
  const drawingRef = useRef<SVGSVGElement>(null);
  const measureRef = useRef<SVGTextElement>(null);
  const [measured, setMeasured] = useState<PlacedLabels | undefined>(undefined);
  useEffect(() => {
    const area = areaRef.current;
    const drawing = drawingRef.current;
    const measure = measureRef.current;
    if (area === null || drawing === null || measure === null) {
      return undefined;
    }
    let isLive = true;
    const place = (): void => {
      const size = textSizeOf(drawing);
      // The labels of the lines are lighter than the names of the points, so the width of a name in semibold leaves them room too.
      const widthOf = (text: string): number => {
        measure.textContent = text;
        return measure.getComputedTextLength() / size;
      };
      setMeasured(
        placeMapLabels(labels, {
          size: {
            width: area.clientWidth / size,
            height: area.clientHeight / size,
          },
          marks,
          widthOf,
        }),
      );
    };
    const observer = new ResizeObserver(place);
    observer.observe(area);
    // Until the fonts load, the browser measures the texts in a fallback font, whose widths differ.
    void document.fonts.ready.then(() => {
      if (isLive) {
        place();
      }
    });
    return () => {
      isLive = false;
      observer.disconnect();
    };
  }, [labels, marks]);
  const estimated = useMemo(
    () =>
      placeMapLabels(labels, {
        size: phonePlot,
        marks,
        widthOf: estimatedLabelWidth,
      }),
    [labels, marks],
  );
  return {
    placed: measured ?? estimated,
    areaRef,
    drawingRef,
    measureRef,
    textSize: () =>
      drawingRef.current === null ? undefined : textSizeOf(drawingRef.current),
  };
}

function textSizeOf(drawing: SVGSVGElement): number {
  return Number.parseFloat(getComputedStyle(drawing).fontSize);
}
