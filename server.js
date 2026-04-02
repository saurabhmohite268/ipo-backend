const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

const app = express();   // ✅ FIRST CREATE APP

app.use(cors());
app.use(express.json());

/* ✅ Serve PDF Folder */
app.use('/reports', express.static('reports'));

/* ✅ Mongo Connection */
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB Connected ✅"))
.catch(err => console.log(err));

const Ipo = require('./models/Ipo');
const Equity = require('./models/Equity')

/* ===== MULTER STORAGE ===== */

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'reports'); // folder name
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files allowed'));
    }
  }
});

app.post('/api/upload-report', upload.single('pdf'), async (req, res) => {

  try {

    const { company, name } = req.body;

    const pdfUrl = `${process.env.BASE_URL}/reports/${req.file.filename}`;

    const newReport = new Equity({
      company,
      name,
      pdfUrl
    });

    await newReport.save();

    res.json({
      message: "Report Uploaded ✅",
      data: newReport
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }

});

app.post('/api/upload-report-ipo', upload.single('pdf'), async (req, res) => {
  try {

    console.log("BODY:", req.body);
    console.log("FILE:", req.file);

    if (!req.file) {
      return res.status(400).json({ error: "PDF file not received" });
    }

    const { company, name } = req.body;

    const pdfUrl = `${process.env.BASE_URL}/reports/${req.file.filename}`;

    const newReport = new Ipo({
      company,
      name,
      pdfUrl
    });

    await newReport.save();

    res.json({
      message: "Report Uploaded ✅",
      data: newReport
    });

  } catch (error) {
    console.error("UPLOAD IPO ERROR:", error);
    res.status(500).json({ error: error.message });
  }
});

/* ✅ Test Route */
app.get('/', (req,res)=>{
  res.send("Backend Running ✅");
});

/* ✅ Mongo Dynamic API */
app.get('/api/ipos', async (req, res) => {

  try {

    const ipos = await Ipo.find();
    res.json(ipos);

  } catch (error) {

    console.error("IPO Fetch Error:", error);
    res.status(500).json({ error: "Failed to fetch IPO data" });

  }

});

app.get('/api/reports', async (req, res) => {

  try {

    const reports = await Equity.find();
    res.json(reports);

  } catch (error) {

    console.error("Reports Fetch Error:", error);
    res.status(500).json({ error: "Failed to fetch reports" });

  }

});

const fs = require('fs');

/* ===== UPDATE EQUITY REPORT ===== */
app.put('/api/reports/:id', upload.single('pdf'), async (req, res) => {

  try {

    const report = await Equity.findById(req.params.id);
    if (!report) return res.status(404).json({ message: "Not Found" });

    // Delete old file if new uploaded
    if (req.file && report.pdfUrl) {
      const oldPath = report.pdfUrl.replace(
  `${process.env.BASE_URL}/`,
  ''
);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
      report.pdfUrl =
  `${process.env.BASE_URL}/reports/${req.file.filename}`;
    }

    report.company = req.body.company || report.company;
    report.name = req.body.name || report.name;

    await report.save();

    res.json({ message: "Updated ✅", report });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }

});

/* ===== DELETE EQUITY REPORT ===== */
app.delete('/api/reports/:id', async (req, res) => {

  try {

    const report = await Equity.findById(req.params.id);
    if (!report) return res.status(404).json({ message: "Not Found" });

    // Delete file from server
    if (report.pdfUrl) {
      const filePath = report.pdfUrl.replace(
        `${process.env.BASE_URL}/`, ''
      );
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await report.deleteOne();

    res.json({ message: "Deleted Successfully ✅" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }

});

/* ===== UPDATE IPO REPORT ===== */
app.put('/api/ipos/:id', upload.single('pdf'), async (req, res) => {

  try {

    const report = await Ipo.findById(req.params.id); // ✅ FIXED
    if (!report) return res.status(404).json({ message: "Not Found" });

    if (req.file && report.pdfUrl) {
      const oldPath = report.pdfUrl.replace(
  `${process.env.BASE_URL}/`,
  ''
);

      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }

      report.pdfUrl =
  `${process.env.BASE_URL}/reports/${req.file.filename}`;
    }

    report.company = req.body.company || report.company;
    report.name = req.body.name || report.name;

    await report.save();

    res.json({ message: "IPO Updated ✅", report });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }

});

/* ===== DELETE IPO REPORT ===== */
app.delete('/api/ipos/:id', async (req, res) => {

  try {

    const report = await Ipo.findById(req.params.id); // ✅ FIXED
    if (!report) return res.status(404).json({ message: "Not Found" });

    if (report.pdfUrl) {
      const filePath = report.pdfUrl.replace(
        `${process.env.BASE_URL}/`, ''
      );

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await report.deleteOne();

    res.json({ message: "IPO Deleted Successfully ✅" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }

});

const PORT = process.env.PORT || 5000;

app.listen(PORT, ()=>{
  console.log(`Server running on port ${PORT}`);
});