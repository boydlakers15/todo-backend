const mongoose = require('mongoose');

const MONGODBURI = 'mongodb+srv://jboyd:OibvL7Uxyzpeqq1J@cluster0.klbynli.mongodb.net/test?retryWrites=true&w=majority';
mongoose.connect(MONGODBURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB connected successfully'))
  .catch(error => console.log(error));