import Prediction from '../models/Prediction.js';
import { generateNumerologyPDF, generateCSV } from '../services/report.service.js';

export async function downloadPredictionPDF(req, res, next) {
  try {
    const { id } = req.params;
    const pred = await Prediction.findOne({ _id: id, user: req.dbUser._id });
    if (!pred) return res.status(404).json({ message: 'Not found' });
    if (pred.discipline === 'numerology' && pred.type === 'name-number') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="numerology-${pred._id}.pdf"`);
      const stream = generateNumerologyPDF({ name: pred.input.name, result: pred.result });
      stream.pipe(res);
    } else {
      res.status(400).json({ message: 'Unsupported prediction type for PDF' });
    }
  } catch (e) { next(e); }
}

export async function downloadPredictionsCSV(req, res, next) {
  try {
    const preds = await Prediction.find({ user: req.dbUser._id }).limit(200);
    const csv = generateCSV(preds.map(p => ({ id: p._id, discipline: p.discipline, type: p.type, createdAt: p.createdAt.toISOString() })));
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="predictions.csv"');
    res.send(csv);
  } catch (e) { next(e); }
}
