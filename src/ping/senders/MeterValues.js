const { EventQueue, EventCommandEnum } = require('../../libraries/EventQueue');
const { WebSocketSender, SendTypeEnum } = require('../../libraries/WebSocket');
const uuid = require('../../utils/uuid');

const state = require('../../state');

const event = EventCommandEnum.EVENT_METER_VALUES;

function sendHeartBeat({ messageId, connectorId, transactionId, meterValue }) {
  WebSocketSender.send({
    sendType: SendTypeEnum.Request,
    commandId: event,
    messageId: messageId,
    commandArgs: {
      connectorId: connectorId,
      transactionId: transactionId,
      meterValue: meterValue,
    },
  });
}

function sendHeartBeatHandler(messageId, connectorId, transactionId, meterValue) {
  const data = {
    connectorId: connectorId,
    messageId: messageId,
    transactionId: transactionId,
    meterValue: meterValue,
  };

  return EventQueue.register({
    commandId: event,
    connectorId: null,
    messageId: messageId,
    packetData: data,
    callback: sendHeartBeat,
  });
}

const ContextEnum = {
  INTERRUPTION_BEGIN: 'Interruption.Begin',
  INTERRUPTION_END: 'Interruption.End',
  SAMPLE_CLOCK: 'Sample.Clock',
  SAMPLE_PERIODIC: 'Sample.Periodic',
  TRANSACTION_BEGIN: 'Transaction.Begin',
  TRANSACTION_END: 'Transaction.End',
  TRIGGER: 'Trigger',
  OTHER: 'Other',
};

const MeasurandEnum = {
  ENERGY_ACTIVE_EXPORT_REGISTER: 'Energy.Active.Export.Register',
  ENERGY_ACTIVE_IMPORT_REGISTER: 'Energy.Active_IMPORT_REGISTER',
  ENERGY_REACTIVE_EXPORT_REGISTER: 'Energy.Reactive.Export.Register',
  ENERGY_REACTIVE_IMPORT_REGISTER: 'Energy.Reactive_IMPORT_REGISTER',
  ENERGY_ACTIVE_EXPORT_INTERVAL: 'Energy.Active.Export.Interval',
  ENERGY_ACTIVE_IMPORT_INTERVAL: 'Energy.Active_IMPORT_Interval',
  ENERGY_REACTIVE_EXPORT_INTERVAL: 'Energy.Reactive.Export.Interval',
  ENERGY_REACTIVE_IMPORT_INTERVAL: 'Energy.Reactive_IMPORT_Interval',
  POWER_ACTIVE_EXPORT: 'Power.Active.Export',
  POWER_ACTIVE_IMPORT: 'Power.Active.Import',
  POWER_OFFERED: 'Power.Offered',
  POWER_REACTIVE_EXPORT: 'Power.Reactive.Export',
  POWER_REACTIVE_IMPORT: 'Power.Reactive.Import',
  POWER_FACTOR: 'Power.Factor',
  CURRENT_IMPORT: 'Current.Import',
  CURRENT_EXPORT: 'Current.Export',
  CURRENT_OFFERED: 'Current.Offered',
  VOLTAGE: 'Voltage',
  FREQUENCY: 'Frequency',
  TEMPERATURE: 'Temperature',
  SOC: 'SoC',
  RPM: 'RPM',
};

const LocationEnum = {
  CABLE: 'Cable',
  EV: 'EV',
  INLET: 'Inlet',
  OUTLET: 'Outlet',
  BODY: 'Body',
};

const UnitEnum = {
  WH: 'Wh',
  KWH: 'kWh',
  VARH: 'varh',
  KVARH: 'kvarh',
  W: 'W',
  KW: 'kW',
  VA: 'VA',
  KVA: 'kVA',
  VAR: 'var',
  KVAR: 'kvar',
  A: 'A',
  V: 'V',
  K: 'K',
  CELCIUS: 'Celcius',
  CELSIUS: 'Celsius',
  FAHRENHEIT: 'Fahrenheit',
  PERCENT: 'Percent',
};

module.exports = {
  execute: sendHeartBeatHandler,
  ContextEnum: ContextEnum,
  MeasurandEnum: MeasurandEnum,
  LocationEnum: LocationEnum,
  UnitEnum: UnitEnum,
};
