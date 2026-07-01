import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { firebaseService } from '../firebase/firebase.service';
import { newPanTemplate } from './templates/new-pan-template';
import { panCorrectionTemplate } from './templates/pan-correction-template';

export class GovernmentFormPdfGenerator {
  /**
   * Generates a printable PDF representing the official government application form
   * dynamically filled with user details, including embedded photos, signatures,
   * and consolidated document uploads (PDF or scaled images).
   */
  static async generate(serviceSlug: string, payload: any): Promise<Buffer> {
    // 1. Resolve configuration template
    let template;
    if (serviceSlug === 'new-pan-apply') {
      template = newPanTemplate;
    } else if (serviceSlug === 'pan-correction') {
      template = panCorrectionTemplate;
    } else {
      throw new Error(`Unsupported service slug for PDF generation: ${serviceSlug}`);
    }

    // 2. Initialize PDFDocument
    const pdfDoc = await PDFDocument.create();
    
    // Embed standard Helvetica fonts
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    // 3. Create Page 1 (NSDL application template sheet)
    const page = pdfDoc.addPage([template.pageWidth, template.pageHeight]);
    
    // 4. Draw template elements
    for (const element of template.elements) {
      const { 
        type, x, y, width, height, text, fieldKey, 
        fontSize = 8, bold = false, charCount, boxSize = 12, 
        spacing = 2, checkedValue 
      } = element;
      
      const activeFont = bold ? boldFont : font;
      const black = rgb(0, 0, 0);
      const blueInk = rgb(0.07, 0.22, 0.65); // Royal blue handwritten pen color
      
      // Resolve dynamic form field value
      let value = '';
      if (fieldKey) {
        value = payload[fieldKey] ? String(payload[fieldKey]).trim() : '';
        // Format Date of Birth (dob) grid from YYYY-MM-DD to DDMMYYYY
        if (fieldKey === 'dob' && type === 'grid' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
          const [yyyy, mm, dd] = value.split('-');
          value = `${dd}${mm}${yyyy}`;
        }
      }

      if (type === 'rect') {
        page.drawRectangle({
          x,
          y,
          width: width || 0,
          height: height || 0,
          borderColor: black,
          borderWidth: 1,
        });
      } else if (type === 'line') {
        page.drawLine({
          start: { x, y },
          end: { x: x + (width || 0), y: y + (height || 0) },
          color: black,
          thickness: 1,
        });
      } else if (type === 'text') {
        const drawTextStr = fieldKey ? value : (text || '');
        if (drawTextStr) {
          page.drawText(drawTextStr, {
            x,
            y,
            size: fontSize,
            font: activeFont,
            color: fieldKey ? blueInk : black,
          });
        }
      } else if (type === 'checkbox') {
        // Draw checkbox square
        page.drawRectangle({
          x,
          y,
          width: width || 10,
          height: height || 10,
          borderColor: black,
          borderWidth: 1,
        });
        // Check condition
        if (value && value.toLowerCase() === checkedValue?.toLowerCase()) {
          // Draw a tick mark checkmark using lines (blue ink)
          page.drawLine({
            start: { x: x + 1.5, y: y + 4.5 },
            end: { x: x + 4, y: y + 1.5 },
            color: blueInk,
            thickness: 1.5,
          });
          page.drawLine({
            start: { x: x + 4, y: y + 1.5 },
            end: { x: x + 8.5, y: y + 8.5 },
            color: blueInk,
            thickness: 1.5,
          });
        }
      } else if (type === 'grid' && charCount) {
        // Draw separate boxes for characters
        for (let i = 0; i < charCount; i++) {
          const cellX = x + i * (boxSize + spacing);
          page.drawRectangle({
            x: cellX,
            y,
            width: boxSize,
            height: boxSize,
            borderColor: black,
            borderWidth: 1,
          });
          
          const char = value[i] || '';
          if (char) {
            // Draw character centered inside box (blue ink)
            page.drawText(char.toUpperCase(), {
              x: cellX + (boxSize - activeFont.widthOfTextAtSize(char.toUpperCase(), fontSize)) / 2,
              y: y + (boxSize - fontSize) / 2 + 1,
              size: fontSize,
              font: activeFont,
              color: blueInk,
            });
          }
        }
      } else if (type === 'image' && fieldKey) {
        // Embed uploaded photo or signature image
        const docMetadata = payload.uploads?.[fieldKey];
        if (docMetadata && docMetadata.storagePath) {
          try {
            const imageBuffer = await firebaseService.downloadFile(docMetadata.storagePath);
            let img;
            try {
              img = await pdfDoc.embedJpg(imageBuffer);
            } catch (jpgErr) {
              try {
                img = await pdfDoc.embedPng(imageBuffer);
              } catch (pngErr) {
                console.warn(`Could not embed image for field ${fieldKey}: unsupported format`);
              }
            }
            
            if (img && width && height) {
              page.drawImage(img, {
                x,
                y,
                width,
                height,
              });
            }
          } catch (err) {
            console.error(`Failed to load and draw image for field ${fieldKey}:`, err);
          }
        }
      }
    }

    // 5. Append uploaded documents (Aadhaar, DOB proofs) at the end of the dossier
    for (const docKey of template.appendDocuments) {
      const docMetadata = payload.uploads?.[docKey];
      if (docMetadata && docMetadata.storagePath) {
        try {
          const docBuffer = await firebaseService.downloadFile(docMetadata.storagePath);
          const isPdf = docBuffer.slice(0, 4).toString() === '%PDF';
          
          if (isPdf) {
            // Merge source PDF pages directly
            try {
              const srcPdf = await PDFDocument.load(docBuffer);
              const copiedPages = await pdfDoc.copyPages(srcPdf, srcPdf.getPageIndices());
              copiedPages.forEach((srcPage) => {
                pdfDoc.addPage(srcPage);
              });
            } catch (pdfErr) {
              console.error(`Failed to copy PDF pages for document ${docKey}:`, pdfErr);
            }
          } else {
            // Draw image centered on a blank A4 sheet
            let img;
            try {
              img = await pdfDoc.embedJpg(docBuffer);
            } catch (jpgErr) {
              try {
                img = await pdfDoc.embedPng(docBuffer);
              } catch (pngErr) {
                console.warn(`Could not embed attachment ${docKey}: unsupported format`);
              }
            }
            
            if (img) {
              const docPage = pdfDoc.addPage([template.pageWidth, template.pageHeight]);
              
              const scale = Math.min(
                (template.pageWidth - 40) / img.width,
                (template.pageHeight - 40) / img.height,
                1
              );
              
              const imgW = img.width * scale;
              const imgH = img.height * scale;
              const imgX = (template.pageWidth - imgW) / 2;
              const imgY = (template.pageHeight - imgH) / 2;
              
              docPage.drawImage(img, {
                x: imgX,
                y: imgY,
                width: imgW,
                height: imgH,
              });
            }
          }
        } catch (err) {
          console.error(`Failed to append document file for ${docKey}:`, err);
        }
      }
    }

    const finalPdfBytes = await pdfDoc.save();
    return Buffer.from(finalPdfBytes);
  }
}
