import BaseProtocol from '../../core/BaseProtocol';

class OcppProtocol extends BaseProtocol {
  constructor() {
    super('1.6');
  }
}

export default OcppProtocol;
