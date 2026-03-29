/**
 * Traverses a dropped directory (via webkitGetAsEntry) to find conversations.json.
 * Returns the parsed JSON array, or null if not found.
 */

function readEntriesPromise(
  reader: FileSystemDirectoryReader
): Promise<FileSystemEntry[]> {
  return new Promise((resolve, reject) => {
    reader.readEntries(resolve, reject);
  });
}

function fileFromEntry(entry: FileSystemFileEntry): Promise<File> {
  return new Promise((resolve, reject) => {
    entry.file(resolve, reject);
  });
}

async function findFileInDirectory(
  dirEntry: FileSystemDirectoryEntry,
  targetName: string
): Promise<File | null> {
  const reader = dirEntry.createReader();
  let allEntries: FileSystemEntry[] = [];

  // readEntries may return results in batches
  let batch = await readEntriesPromise(reader);
  while (batch.length > 0) {
    allEntries = allEntries.concat(batch);
    batch = await readEntriesPromise(reader);
  }

  for (const entry of allEntries) {
    if (entry.isFile && entry.name === targetName) {
      return fileFromEntry(entry as FileSystemFileEntry);
    }
    if (entry.isDirectory) {
      const found = await findFileInDirectory(
        entry as FileSystemDirectoryEntry,
        targetName
      );
      if (found) return found;
    }
  }

  return null;
}

export async function findConversationsInEntries(
  items: DataTransferItemList
): Promise<Record<string, unknown>[] | null> {
  for (let i = 0; i < items.length; i++) {
    const entry = items[i].webkitGetAsEntry();
    if (!entry) continue;

    if (entry.isDirectory) {
      const file = await findFileInDirectory(
        entry as FileSystemDirectoryEntry,
        "conversations.json"
      );
      if (file) {
        const text = await file.text();
        const parsed: unknown = JSON.parse(text);
        if (Array.isArray(parsed)) {
          return parsed as Record<string, unknown>[];
        }
      }
    }
  }

  return null;
}

/**
 * Finds conversations.json in a FileList from a webkitdirectory input.
 * The browser flattens the directory structure into a flat file list.
 */
export async function findConversationsInFileList(
  files: FileList
): Promise<Record<string, unknown>[] | null> {
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (file.name === "conversations.json") {
      const text = await file.text();
      const parsed: unknown = JSON.parse(text);
      if (Array.isArray(parsed)) {
        return parsed as Record<string, unknown>[];
      }
    }
  }
  return null;
}
