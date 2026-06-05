import express from 'express';
import path from 'path';
import { existsSync } from 'fs';
import PDFDocument from 'pdfkit';
import pool from '../db/db.js';

const router = express.Router();

const BRAND_COLOR  = '#5B4306';
const ACCENT_COLOR = '#8B6914';
const LINE_COLOR   = '#D4A94A';

function section(doc, title) {
  doc.moveDown(1)
     .fontSize(12)
     .fillColor(BRAND_COLOR)
     .font('Helvetica-Bold')
     .text(title.toUpperCase());
  doc.moveTo(doc.page.margins.left, doc.y + 2)
     .lineTo(doc.page.width - doc.page.margins.right, doc.y + 2)
     .strokeColor(LINE_COLOR)
     .lineWidth(1)
     .stroke();
  doc.moveDown(0.4)
     .font('Helvetica')
     .fontSize(10)
     .fillColor('#333333');
}

function row(doc, label, value) {
  if (!value && value !== 0) return;
  doc.font('Helvetica-Bold').fillColor(BRAND_COLOR).text(`${label}: `, { continued: true })
     .font('Helvetica').fillColor('#333333').text(String(value));
}

function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  return isNaN(d.getTime()) ? String(value) : d.toLocaleDateString('en-GB');
}

function resolveUploadPath(fileUrl) {
  if (!fileUrl) return null;
  return path.resolve(process.cwd(), fileUrl.replace(/^\//, ''));
}

// GET /api/medical/:petId/export-data  → returns raw JSON for client-side PDF generation
router.get('/:petId/export-data', async (req, res) => {
  const { petId } = req.params;

  try {
    const [[pet]] = await pool.query(
      `SELECT pet_id, owner_id, name, species, race, colour, age, gender,
              diagnosis, medication, behaviour, dietary_restrictions,
              medical_notes, weight
       FROM pets WHERE pet_id = ?`,
      [petId]
    );

    if (!pet) {
      return res.status(404).json({ message: 'Pet not found' });
    }

    const [medications] = await pool.query(
      `SELECT medication_name, medication_type, dosage, start_date, end_date
       FROM medications WHERE pet_id = ? ORDER BY start_date DESC`,
      [petId]
    );

    const [uploads] = await pool.query(
      `SELECT filename, note, uploaded_at
       FROM pet_uploads WHERE pet_id = ? ORDER BY uploaded_at DESC`,
      [petId]
    );

    return res.json({ pet, medications, uploads });
  } catch (error) {
    console.error('[GET /api/medical/:petId/export-data]', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/medical/:petId/export-pdf
router.get('/:petId/export-pdf', async (req, res) => {
  const { petId } = req.params;

  try {
    const [[pet]] = await pool.query(
      `SELECT pet_id, owner_id, name, species, race, colour, age, gender,
              diagnosis, medication, behaviour, dietary_restrictions,
              medical_notes, weight
       FROM pets WHERE pet_id = ?`,
      [petId]
    );

    if (!pet) {
      return res.status(404).json({ message: 'Pet not found' });
    }

    const [medications] = await pool.query(
      `SELECT medication_name, medication_type, dosage, start_date, end_date
       FROM medications WHERE pet_id = ? ORDER BY start_date DESC`,
      [petId]
    );

    const [uploads] = await pool.query(
      `SELECT filename, file_url, mime_type, note, uploaded_at
       FROM pet_uploads WHERE pet_id = ? ORDER BY uploaded_at DESC`,
      [petId]
    );

    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="medical-history-${petId}.pdf"`);
    doc.pipe(res);

    // Header
    doc.fontSize(20)
       .fillColor(BRAND_COLOR)
       .font('Helvetica-Bold')
       .text('Nutri-Paw', { align: 'center' });
    doc.fontSize(14)
       .font('Helvetica')
       .fillColor(ACCENT_COLOR)
       .text('Pet Medical History Report', { align: 'center' });
    doc.moveDown(0.3)
       .fontSize(9)
       .fillColor('#888888')
       .text(`Generated: ${new Date().toLocaleString('en-GB')}`, { align: 'center' });

    doc.moveTo(50, doc.y + 6)
       .lineTo(doc.page.width - 50, doc.y + 6)
       .strokeColor(LINE_COLOR)
       .lineWidth(2)
       .stroke();

    // Pet information
    section(doc, 'Pet Information');
    row(doc, 'Name',    pet.name);
    row(doc, 'Species', pet.species);
    row(doc, 'Race',    pet.race);
    row(doc, 'Age',     pet.age);
    row(doc, 'Gender',  pet.gender);
    row(doc, 'Colour',  pet.colour);
    row(doc, 'Weight',  pet.weight);

    // Diagnosis
    section(doc, 'Diagnosis');
    if (pet.diagnosis) {
      doc.fillColor('#333333').text(pet.diagnosis);
    } else {
      doc.fillColor('#888888').text('None recorded.');
    }

    // Dietary Restrictions
    section(doc, 'Dietary Restrictions');
    if (pet.dietary_restrictions) {
      doc.fillColor('#333333').text(pet.dietary_restrictions);
    } else {
      doc.fillColor('#888888').text('None recorded.');
    }

    // Behaviour
    section(doc, 'Behaviour');
    if (pet.behaviour) {
      doc.fillColor('#333333').text(pet.behaviour);
    } else {
      doc.fillColor('#888888').text('None recorded.');
    }

    // Medication
    section(doc, 'Medication');
    if (medications.length === 0 && !pet.medication) {
      doc.fillColor('#888888').text('No medications recorded.');
    } else {
      medications.forEach(med => {
        const end = med.end_date ? formatDate(med.end_date) : 'ongoing';
        doc.fillColor(ACCENT_COLOR).text('• ', { continued: true })
           .fillColor(BRAND_COLOR).font('Helvetica-Bold').text(med.medication_name, { continued: true })
           .font('Helvetica').fillColor('#333333')
           .text(
             ` — ${med.medication_type || ''}` +
             `  |  Dosage: ${med.dosage}` +
             `  |  ${formatDate(med.start_date)} – ${end}`
           );
      });
      // Fall back to legacy text field when no structured entries exist
      if (medications.length === 0 && pet.medication) {
        doc.fillColor('#333333').text(pet.medication);
      }
    }

    // Medical Notes
    section(doc, 'Medical Notes');
    if (pet.medical_notes) {
      doc.fillColor('#333333').text(pet.medical_notes);
    } else {
      doc.fillColor('#888888').text('None recorded.');
    }

    // Uploaded Documents
    section(doc, 'Uploaded Documents');
    if (uploads.length === 0) {
      doc.fillColor('#888888').text('No documents uploaded.');
    } else {
      uploads.forEach(u => {
        doc.fillColor(ACCENT_COLOR).text('• ', { continued: true })
           .fillColor(BRAND_COLOR).font('Helvetica-Bold').text(u.filename, { continued: true })
           .font('Helvetica').fillColor('#555555')
           .text(`  (${formatDate(u.uploaded_at)})${u.note ? ' — ' + u.note : ''}`);

        const imagePath = resolveUploadPath(u.file_url);
        if (u.mime_type?.startsWith('image/') && imagePath && existsSync(imagePath)) {
          doc.moveDown(0.3);
          try {
            doc.image(imagePath, { fit: [160, 160], align: 'left' });
          } catch (imageError) {
            console.warn('[export-pdf] Could not render image:', imageError.message);
          }
          doc.moveDown(0.2);
        }
      });
    }

    // Footer
    doc.fontSize(8)
       .fillColor('#aaaaaa')
       .text(
         `Nutri-Paw  •  Confidential pet health record  •  ${new Date().getFullYear()}`,
         50,
         doc.page.height - 40,
         { align: 'center', width: doc.page.width - 100 }
       );

    doc.end();
  } catch (error) {
    console.error('[GET /api/medical/:petId/export-pdf]', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
});

export default router;
