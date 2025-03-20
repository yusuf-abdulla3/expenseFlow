declare module 'pdfjs-dist/legacy/build/pdf.js' {
  export const getDocument: any;
  export const GlobalWorkerOptions: {
    workerSrc: any;
  };
}

declare module 'pdfjs-dist/legacy/build/pdf.worker.js' {
  const worker: any;
  export default worker;
}

declare module 'pdfjs-dist/build/pdf' {
  export const getDocument: any;
  export const version: string;
}

declare module 'pdfjs-dist' {
  export function getDocument(data: Uint8Array | { data: Uint8Array }): {
    promise: Promise<{
      numPages: number;
      getPage(pageNumber: number): Promise<{
        getTextContent(): Promise<{
          items: Array<{ str?: string; [key: string]: any }>;
        }>;
      }>;
    }>;
  };
}

declare module 'pdf-parse' {
  interface PDFParseResult {
    numpages: number;
    numrender: number;
    info: any;
    metadata: any;
    text: string;
    version: string;
  }

  function PDFParse(dataBuffer: Buffer, options?: any): Promise<PDFParseResult>;
  
  export default PDFParse;
} 