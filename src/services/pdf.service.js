import PDFDocument from "pdfkit";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fontRegular = path.join(__dirname, "../public/fonts/NotoSans-Regular.ttf");
const fontBold = path.join(__dirname, "../public/fonts/NotoSans-Bold.ttf");

// ✅ Image root for product images – now points to /public/images/items
const imageRoot = path.join(__dirname, "../public/images/items");

const {
  EMAIL_BRAND,
  COMPANY_NAME,
  COMPANY_ADDRESS_CITY,
  COMPANY_PHONE,
  COMPANY_EMAIL,
  COMPANY_PIB,
  COMPANY_WEBSITE,
} = process.env;

const toCurrency = (value, locale = "sr-RS") => {
  const num = Number(value || 0);
  return `${num.toLocaleString(locale)} RSD`;
};

const formatDate = (date, locale = "sr-RS") => {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(locale);
};

const line = (doc) => {
  doc
    .moveDown(0.5)
    .lineWidth(0.5)
    .strokeColor("#e5e5e5")
    .moveTo(doc.page.margins.left, doc.y)
    .lineTo(doc.page.width - doc.page.margins.right, doc.y)
    .stroke()
    .moveDown(0.5);
};

async function getImageBufferForPdf(imagePath) {
  if (!imagePath) return null;
  if (!fs.existsSync(imagePath)) return null;

  try {
    const buffer = await sharp(imagePath).png().toBuffer();
    return buffer;
  } catch (err) {
    console.error(`Greška pri konverziji slike ${imagePath}:`, err.message);
    return null;
  }
}

export async function generateOrderPdf(order) {
  const doc = new PDFDocument({ margin: 50, size: "A4" });

  doc.registerFont("Regular", fontRegular);
  doc.registerFont("Bold", fontBold);

  const buffers = [];
  doc.on("data", buffers.push.bind(buffers));

  const pdfPromise = new Promise((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", reject);
  });

  const rightStart = doc.page.width - doc.page.margins.right - 200;

  doc
    .font("Bold")
    .fontSize(16)
    .text(COMPANY_NAME || EMAIL_BRAND || "Company", 50, 50);

  doc
    .font("Regular")
    .fontSize(10)
    .text(COMPANY_ADDRESS_CITY || "", 50)
    .text(`PIB: ${COMPANY_PIB || "-"}`)
    .text(`Telefon: ${COMPANY_PHONE || "-"}`)
    .text(`Email: ${COMPANY_EMAIL || "-"}`)
    .text(COMPANY_WEBSITE || "");

  doc
    .font("Bold")
    .fontSize(14)
    .text("INVOICE", rightStart, 50, { align: "right" });

  doc
    .font("Regular")
    .fontSize(10)
    .text(`Broj: ${order.orderNumber || order.id}`, rightStart, 75, { align: "right" })
    .text(`Datum: ${formatDate(order.date || order.createdAt)}`, { align: "right" })
    .text(`Status: ${order.status || "confirmed"}`, { align: "right" });

  doc.moveDown(3);
  line(doc);

  const buyerTop = doc.y;

  doc.font("Bold").fontSize(12).text("Kupac", 50, buyerTop);
  doc.font("Regular").fontSize(10);

  if (order.buyer) {
    doc
      .text(`${order.buyer.firstName} ${order.buyer.lastName}`, 50, buyerTop + 15)
      .text(order.buyer.email)
      .text(order.buyer.phone);
  }

  doc.font("Bold").text("Adresa isporuke", 300, buyerTop);

  if (order.address) {
    doc
      .font("Regular")
      .text(order.address.street, 300, buyerTop + 15)
      .text(`${order.address.postalCode} ${order.address.city}`)
      .text(order.address.country || "");
  }

  doc.moveDown(4);
  line(doc);

  doc.font("Bold").fontSize(12).text("Artikli");
  doc.moveDown();

  for (const item of order.items) {
    const startY = doc.y;

    // ✅ Extract image path safely – now imageRoot points to /public/images/items
    let imagePath = null;
    if (item.image) {
      if (typeof item.image === 'string') {
        imagePath = path.join(imageRoot, item.image);
      } else if (typeof item.image === 'object' && item.image.img) {
        imagePath = path.join(imageRoot, item.image.img);
      }
    }

    if (imagePath) {
      const imageBuffer = await getImageBufferForPdf(imagePath);
      if (imageBuffer) {
        doc.image(imageBuffer, 50, startY, {
          width: 60,
          height: 60,
        });
      }
    }

    const textX = 120;

    doc
      .font("Bold")
      .fontSize(11)
      .text(item.title, textX, startY);

    doc
      .font("Regular")
      .fontSize(10)
      .text(`Boja: ${item.color || "-"}`)
      .text(`Veličina: ${item.size || "-"}`)
      .text(`Količina: ${item.quantity}`)
      .text(`${toCurrency(item.price)} x ${item.quantity} = ${toCurrency(item.price * item.quantity)}`);

    doc.moveDown(2);
  }

  line(doc);

  doc.font("Regular").fontSize(11);

  doc.text(`Međuzbir: ${toCurrency(order.subtotal || 0)}`, { align: "right" });

  if (order.shipping > 0) {
    doc.text(`Dostava: ${toCurrency(order.shipping)}`, { align: "right" });
  }

  if (order.coupon?.discount > 0) {
    doc.text(`Popust (${order.coupon?.code || ""} - ${order.coupon?.discount}%)`, { align: "right" });
  }

  doc
    .moveDown(0.5)
    .font("Bold")
    .fontSize(13)
    .text(`UKUPNO: ${toCurrency(order.totalPrice || order.total || 0)}`, { align: "right" });

  if (order.note) {
    doc.moveDown(2);
    doc.font("Bold").fontSize(11).text("Napomena:");
    doc.font("Regular").text(order.note);
  }

  doc.moveDown(3);
  doc.fontSize(10).font("Regular").text("Hvala Vam na kupovini!", { align: "center" });

  doc.end();
  return pdfPromise;
}

export const pdfService = { generateOrderPdf };
export default pdfService;