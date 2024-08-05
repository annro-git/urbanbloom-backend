const mongoose = require('mongoose');

const connectionString = "<connection-string>urbanbloom";

mongoose.connect(connectionString, { connectTimeoutMS: 2000 })
  .then(() => console.log('Database connected'))
  .catch(error => console.error(error));
