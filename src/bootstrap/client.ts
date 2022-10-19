import type { ProtocolVersion } from '../core/BaseProtocol';
import { loadProtocol } from '../protocols';

async function bootstrap() {
  const protocolVersion = process.env.PROTOCOL_VERSION as ProtocolVersion;
  const protocolInstance = loadProtocol(protocolVersion);

  return protocolInstance.bootstrap();
}

export default bootstrap;
