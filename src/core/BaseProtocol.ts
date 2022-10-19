export type ProtocolVersion = '1.6' | '2.0' | '2.1';

abstract class BaseProtocol {
  constructor(protected readonly protocolVersion: ProtocolVersion) {
    // ...
  }

  async bootstrap() {}
}

export default BaseProtocol;
