import { concurrent, Exception } from "./utils.ts";

import type { Page } from "./filesystem.ts";

/**
 * Class to store and run the (pre)processors
 */
export default class Processors {
  processors = new Map<Processor, string[]>();

  /** Apply the processors to the provided pages */
  async run(pages: Page[]): Promise<void> {
    for (const [process, exts] of this.processors) {
      await concurrent(
        pages,
        async (page) => {
          try {
            if (
              ((page.src.ext && exts.includes(page.src.ext)) ||
                exts.includes(page.dest.ext))
            ) {
              await process(page);
            }
          } catch (cause) {
            throw new Exception("Error processing page", {
              cause,
              page,
              processor: process.name,
            });
          }
        },
      );
    }
  }
}

/** A (pre)processor */
export type Processor = (page: Page) => void;