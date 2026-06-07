import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { Loader2 } from "lucide-react";

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

type Props = {
  file: { url: string };
  pageNum: number;
  width: number;
  onLoadSuccess: (info: { numPages: number }) => void;
  onLoadError: (err: unknown) => void;
};

export default function PdfViewerInner({ file, pageNum, width, onLoadSuccess, onLoadError }: Props) {
  return (
    <Document
      file={file}
      onLoadSuccess={onLoadSuccess}
      onLoadError={onLoadError}
      loading={
        <div className="mt-20 flex items-center gap-2 text-[14px]" style={{ color: "#5b7a8f" }}>
          <Loader2 className="animate-spin" size={20} /> Processando PDF…
        </div>
      }
    >
      <div className="overflow-auto rounded-lg bg-white shadow-[0_2px_12px_rgba(0,0,0,0.25)]">
        <Page
          pageNumber={pageNum}
          width={width}
          renderTextLayer={false}
          renderAnnotationLayer={false}
        />
      </div>
    </Document>
  );
}
