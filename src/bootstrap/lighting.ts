import LightController from '../core/LightController';

function bootstrap() {
  // start lighting from 18:00 to next day 09:30
  // check every 30 seconds

  LightController.getInstance().start(30, '18:00', '09:30');
}

export default bootstrap;
