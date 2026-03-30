import bwipjs from "bwip-js";
import jsPDF from "jspdf";
import { toast } from "sonner";

export interface LabelItem {
    barcode: string;
    sequenceNumber: string | number;
}

/**
 * Common code to generate barcode images using bwipjs.
 * Matches 50mm x 24mm sticker specs.
 */
export const generateBarcodeImages = async (items: LabelItem[]): Promise<any[]> => {
    return Promise.all(
        items.map(item => {
            return new Promise((resolve) => {
                const canvas = document.createElement("canvas");
                bwipjs.toCanvas(canvas, {
                    bcid: "code128",
                    text: item.barcode,
                    scale: 5,
                    height: 10,
                    includetext: false,
                });
                resolve({ 
                    barcode: item.barcode, 
                    sequenceNumber: item.sequenceNumber, 
                    dataUrl: canvas.toDataURL("image/png") 
                });
            });
        })
    );
};

/**
 * Standardized Printer Layout using a hidden iframe.
 * Prints 50mm x 24mm stickers centered on the page.
 * Matches Ladies Flavour styling with proper gaps and font weights.
 */
export const printLabels = async (items: LabelItem[], productCode: string) => {
    // Create a hidden iframe
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const images = await generateBarcodeImages(items);
    
    const printContent = `
      <html>
        <head>
          <title>Labels - ${productCode}</title>
          <style>
            @page { 
                size: 50mm 24mm; 
                margin: 0; 
            }
            * {
                box-sizing: border-box;
                -webkit-print-color-adjust: exact;
            }
            body { 
                margin: 0; 
                padding: 0; 
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                background: #fff; 
            }
            .print-container { 
                width: 50mm;
            }
            .sticker { 
                width: 50mm; 
                height: 24mm; 
                display: flex; 
                flex-direction: column; 
                align-items: center; 
                justify-content: center;
                overflow: hidden; 
                background: #fff;
                page-break-after: always;
                margin: 0;
                padding: 1mm 0;
            }
            .sku-name { 
                font-size: 10px; 
                font-weight: 800; 
                text-transform: uppercase; 
                color: #000; 
                line-height: 1.2;
                width: 100%; 
                text-align: center; 
                overflow: hidden; 
                white-space: nowrap;
                letter-spacing: 0.02em;
                margin-bottom: 1mm;
            }
            .barcode-wrapper {
                width: 100%;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 0.5mm;
            }
            .barcode-img { 
                width: 42mm; 
                height: 9mm;
                object-fit: contain;
                display: block;
            }
            .barcode-id { 
                font-size: 10px;
                font-weight: 800;
                text-transform: uppercase; 
                color: #000; 
                line-height: 1;
                text-align: center;
                width: 100%;
                letter-spacing: 0.1em;
            }
          </style>
        </head>
        <body>
          <div class="print-container">
          ${images.map((img: any) => `
            <div class="sticker">
              <div class="sku-name">${productCode || ''}</div>
              <div class="barcode-wrapper">
                <img src="${img.dataUrl}" class="barcode-img" />
                <div class="barcode-id">${img.sequenceNumber}</div>
              </div>
            </div>
          `).join('')}
          </div>
          <script>
            window.onload = function() { 
                setTimeout(() => { 
                    window.print(); 
                }, 500); 
            }
          </script>
        </body>
      </html>
    `;

    const doc = iframe.contentWindow?.document;
    if (doc) {
        doc.open();
        doc.write(printContent);
        doc.close();
        
        // Clean up the iframe after printing
        setTimeout(() => {
            if (document.body.contains(iframe)) {
                document.body.removeChild(iframe);
            }
        }, 2000);
    }
};

/**
 * Standardized PDF Download Layout using jsPDF.
 * Generates an A4 portrait document with 50mm x 24mm centered stickers.
 */
export const downloadLabelsPDF = async (items: LabelItem[], productCode: string, fileNamePart: string = "labels") => {
    const toastId = toast.loading("Generating Document...");
    try {
        const images = await generateBarcodeImages(items);
        const pdf = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4"
        });

        const stickerWidth = 50;
        const stickerHeight = 24;
        const gap = 4; // Matching the 4mm gap in print
        const pageHeight = 297;
        const margin = 10;
        let currentY = margin;
        const centerX = (210 - stickerWidth) / 2;

        images.forEach((img: any) => {
            if (currentY + stickerHeight > pageHeight - margin) {
                pdf.addPage();
                currentY = margin;
            }
            
            // Background / Border (Optional, can be removed for pure white)
            // pdf.setDrawColor(240);
            // pdf.rect(centerX, currentY, stickerWidth, stickerHeight);

            // Product Code (Top) - Small and Bold
            pdf.setFontSize(7);
            pdf.setFont("helvetica", "bold");
            const tw = pdf.getTextWidth(productCode);
            pdf.text(productCode.toUpperCase(), centerX + (stickerWidth - tw) / 2, currentY + 5);

            // Barcode image (Middle)
            pdf.addImage(img.dataUrl, "PNG", centerX + 3, currentY + 6, 44, 11);

            // Barcode String (Bottom) - Matching print:barcode-id
            pdf.setFontSize(9);
            pdf.setFont("helvetica", "bold");
            const idText = img.sequenceNumber.toString().toUpperCase();
            const idTw = pdf.getTextWidth(idText);
            pdf.text(idText, centerX + (stickerWidth - idTw) / 2, currentY + 21);

            currentY += stickerHeight + gap;
        });

        pdf.save(`${productCode}-${fileNamePart}-A4.pdf`);
        toast.success("PDF Downloaded", { id: toastId });
    } catch (err) {
        console.error(err);
        toast.error("Generation failed.");
    }
};
