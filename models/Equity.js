const mongoose = require('mongoose');

const equitySchema = new mongoose.Schema({
  company: String,
  name: String,
  pdfUrl: String
},{
  collection: 'equity'   // ✅ VERY IMPORTANT
});

module.exports = mongoose.model('Equity', equitySchema);