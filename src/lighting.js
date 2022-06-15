const { LightController } = require('./libraries/LightController');

// start lighting from 18:00 to next day 09:30
// check every 30 seconds

// LightController.start(30, '18:00', '09:30');
LightController.start(30, '18:00', '19:30');
