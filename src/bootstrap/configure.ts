import path from 'path';
import dotenv from 'dotenv';

function bootstrap() {
  dotenv.config({
    path: path.join(__dirname, '..', '..', '.env'),
  });

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  global.ROOT_DIR = __dirname;
}

export default bootstrap;
