/**
 * Export d'un nœud DOM en PDF A4 (jsPDF + html2canvas).
 * Gère la pagination si le contenu dépasse une page.
 */
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export async function exportNodeToPdf(node, filename = "export.pdf", opts = {}) {
  if (!node) return;
  const { title = null, orientation = "portrait" } = opts;

  const canvas = await html2canvas(node, {
    scale: 2,
    backgroundColor: "#ffffff",
    useCORS: true,
    logging: false,
  });
  const img = canvas.toDataURL("image/png");

  const pdf    = new jsPDF({ orientation, unit: "mm", format: "a4" });
  const pageW  = pdf.internal.pageSize.getWidth();
  const pageH  = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const usableW = pageW - margin * 2;
  const imgH    = (canvas.height * usableW) / canvas.width;

  let top = margin;
  if (title) {
    pdf.setFontSize(14);
    pdf.setTextColor(15, 23, 42);
    pdf.text(title, margin, top + 2);
    top += 8;
  }

  // Tient sur une page
  if (imgH <= pageH - top - margin) {
    pdf.addImage(img, "PNG", margin, top, usableW, imgH);
  } else {
    // Pagination : on décale l'image vers le haut page après page
    let heightLeft = imgH;
    let position = top;
    pdf.addImage(img, "PNG", margin, position, usableW, imgH);
    heightLeft -= pageH - position - margin;
    while (heightLeft > 0) {
      pdf.addPage();
      position = margin - (imgH - heightLeft);
      pdf.addImage(img, "PNG", margin, position, usableW, imgH);
      heightLeft -= pageH - margin * 2;
    }
  }

  pdf.save(filename);
}
