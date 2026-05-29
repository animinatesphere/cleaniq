const mongoose = require('mongoose');
const Service = require('./models/Service');

mongoose.connect('mongodb+srv://admin:admin@cluster0.p78z71f.mongodb.net/cleaniq?retryWrites=true&w=majority&appName=Cluster0')
  .then(async () => {
    const services = await Service.find({});
    const clean = (str) => str.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
    const baseNames = ['Residential Cleaning', 'Deep Clean', 'Airbnb Cleaning', 'Office Cleaning', 'End of Tenancy'];
    const roomNames = ['Bedroom', 'Bathroom', 'Cloakroom', 'Kitchen', 'Utility Room', 'Reception Room', 'Conservatory'];
    
    let updated = 0;
    for (let s of services) {
      let cat = 'Extras';
      if (baseNames.some(b => clean(b) === clean(s.name))) cat = 'Base';
      else if (roomNames.some(r => clean(r) === clean(s.name))) cat = 'Rooms';
      
      await Service.updateOne({ _id: s._id }, { $set: { category: cat } });
      updated++;
    }
    
    console.log('Updated ' + updated + ' services');
    process.exit(0);
  });
