import { searchByExtension } from "../utils.ts";
import { basename, extname, join } from "../../deps/path.ts";

import type { Data, Loader } from "../../core.ts";
import type Reader from "../reader.ts";

/**
 * Class to load data files.
 */
export default class DataLoader {
  /** The filesystem reader */
  reader: Reader;

  /** List of extensions to load page files and the loader used */
  loaders = new Map<string, Loader>();

  constructor(reader: Reader) {
    this.reader = reader;
  }

  /** Load a _data.* file */
  async load(path: string): Promise<Data | undefined> {
    const result = searchByExtension(path, this.loaders);

    if (!result) {
      return;
    }

    const [, loader] = result;

    return await this.reader.read(path, loader);
  }

  /** Load a _data directory */
  async loadDirectory(path: string): Promise<Data> {
    const data: Data = {};

    for await (const entry of this.reader.readDir(path)) {
      await this.loadEntry(path, entry, data);
    }

    return data;
  }

  /** Load a data entry inside a _data directory */
  async loadEntry(path: string, entry: Deno.DirEntry, data: Data) {
    if (
      entry.isSymlink ||
      entry.name.startsWith(".") || entry.name.startsWith("_")
    ) {
      return;
    }

    if (entry.isFile) {
      const name = basename(entry.name, extname(entry.name));
      const fileData = await this.load(join(path, entry.name)) || {};

      if (fileData.content && Object.keys(fileData).length === 1) {
        data[name] = fileData.content;
      } else {
        data[name] = Object.assign(data[name] || {}, fileData);
      }

      return;
    }

    if (entry.isDirectory) {
      data[entry.name] = await this.loadDirectory(join(path, entry.name));
    }
  }
}