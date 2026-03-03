const mongoose = require('mongoose');

const ipoSchema = new mongoose.Schema({
  company:String,
  name:String,
  pdfUrl:String
});

module.exports = mongoose.model('Ipo', ipoSchema);