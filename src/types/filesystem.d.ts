/** Minimal type declarations for the File System Access API (webkitGetAsEntry). */

interface FileSystemEntry {
  readonly isFile: boolean;
  readonly isDirectory: boolean;
  readonly name: string;
}

interface FileSystemFileEntry extends FileSystemEntry {
  readonly isFile: true;
  readonly isDirectory: false;
  file(successCallback: (file: File) => void, errorCallback?: (err: DOMException) => void): void;
}

interface FileSystemDirectoryEntry extends FileSystemEntry {
  readonly isFile: false;
  readonly isDirectory: true;
  createReader(): FileSystemDirectoryReader;
}

interface FileSystemDirectoryReader {
  readEntries(
    successCallback: (entries: FileSystemEntry[]) => void,
    errorCallback?: (err: DOMException) => void
  ): void;
}

interface DataTransferItem {
  webkitGetAsEntry(): FileSystemEntry | null;
}
