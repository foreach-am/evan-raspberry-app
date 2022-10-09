const { EventQueue, EventCommandEnum } = require('../../libraries/EventQueue');
const { WebSocketSender, SendTypeEnum } = require('../../libraries/WebSocket');

const event = EventCommandEnum.EVENT_METER_VALUES;

function sendMeterValue({ messageId, connectorId, transactionId, meterValue }) {
  const commandArgs = {
    connectorId: connectorId,
    transactionId: transactionId,
    meterValue: meterValue,
  };

  WebSocketSender.send({
    sendType: SendTypeEnum.Request,
    commandId: event,
    messageId: messageId,
    commandArgs: commandArgs,
  });
}

function sendMeterValueHandler(
  messageId,
  connectorId,
  transactionId,
  meterValue
) {
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
    callback: sendMeterValue,
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
  ENERGY_ACTIVE_IMPORT_REGISTER: 'Energy.Active.Import.Register',
  ENERGY_REACTIVE_EXPORT_REGISTER: 'Energy.Reactive.Export.Register',
  ENERGY_REACTIVE_IMPORT_REGISTER: 'Energy.Reactive.Import.Register',
  ENERGY_ACTIVE_EXPORT_INTERVAL: 'Energy.Active.Export.Interval',
  ENERGY_ACTIVE_IMPORT_INTERVAL: 'Energy.Active.Import.Interval',
  ENERGY_REACTIVE_EXPORT_INTERVAL: 'Energy.Reactive.Export.Interval',
  ENERGY_REACTIVE_IMPORT_INTERVAL: 'Energy.Reactive.Import.Interval',
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
  execute: sendMeterValueHandler,
  ContextEnum: ContextEnum,
  MeasurandEnum: MeasurandEnum,
  LocationEnum: LocationEnum,
  UnitEnum: UnitEnum,
};
