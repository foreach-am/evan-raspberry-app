import BaseProtocol, { ProtocolVersion } from '../core/BaseProtocol';

import { OcppProtocol as Ocpp16Protocol } from './1.6';
import { OcppProtocol as Ocpp20Protocol } from './2.0';
import { OcppProtocol as Ocpp21Protocol } from './2.1';

const protocols: Record<ProtocolVersion, AnyType> = {
  '1.6': Ocpp16Protocol,
  '2.0': Ocpp20Protocol,
  '2.1': Ocpp21Protocol,
};

export function loadProtocol(protocolVersion: ProtocolVersion): BaseProtocol {
  const ProtocolClass = protocols[protocolVersion];
  return new ProtocolClass();
}
