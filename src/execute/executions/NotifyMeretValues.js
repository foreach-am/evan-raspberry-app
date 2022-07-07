// const state = require('../../state');
// const ping = require('../../ping');
// const uuid = require('../../utils/uuid');

// function getCosFi() {
//   // @TODO: calculate real value
//   return 1;
// }

// function createMeterValue(context, measurand, location, unit, value) {
//   return {
//     timestamp: new Date().toISOString(),
//     sampledValue: [
//       {
//         context: context,
//         measurand: measurand,
//         location: location,
//         unit: unit,
//         value: value.toString(),
//       },
//     ],
//   };
// }

// module.exports = async function (parsedServerData, connectorId) {
//   const meterValue = [
//     createMeterValue(
//       ping.MeterValues.ContextEnum.SAMPLE_PERIODIC,
//       ping.MeterValues.MeasurandEnum.CURRENT_IMPORT,
//       ping.MeterValues.LocationEnum.OUTLET,
//       ping.MeterValues.UnitEnum.A,
//       state.statistic.plugs.currentMeasureA[connectorId]
//     ),
//     createMeterValue(
//       ping.MeterValues.ContextEnum.SAMPLE_PERIODIC,
//       ping.MeterValues.MeasurandEnum.POWER_OFFERED,
//       ping.MeterValues.LocationEnum.OUTLET,
//       ping.MeterValues.UnitEnum.KW,
//       7 // @TODO: replace with maximum power of plug.
//     ),
//     createMeterValue(
//       ping.MeterValues.ContextEnum.SAMPLE_PERIODIC,
//       ping.MeterValues.MeasurandEnum.POWER_ACTIVE_IMPORT,
//       ping.MeterValues.LocationEnum.OUTLET,
//       ping.MeterValues.UnitEnum.KW,
//       parseFloat(
//         (
//           (state.statistic.common.highVoltageMeasure *
//             state.statistic.plugs.currentMeasureA[connectorId] *
//             getCosFi()) /
//           1000
//         ).toFixed(3)
//       )
//     ),
//     createMeterValue(
//       ping.MeterValues.ContextEnum.SAMPLE_PERIODIC,
//       ping.MeterValues.MeasurandEnum.ENERGY_ACTIVE_IMPORT_REGISTER,
//       ping.MeterValues.LocationEnum.OUTLET,
//       ping.MeterValues.UnitEnum.WH,
//       state.statistic.plugs.powerKwh[connectorId] * 1000
//     ),
//     // createMeterValue(
//     //   ping.MeterValues.ContextEnum.SAMPLE_PERIODIC,
//     //   ping.MeterValues.MeasurandEnum.SOC,
//     //   ping.MeterValues.LocationEnum.EV,
//     //   ping.MeterValues.UnitEnum.PERCENT,
//     //   0 // @TODO: replace with charged percent
//     // ),
//     createMeterValue(
//       ping.MeterValues.ContextEnum.SAMPLE_PERIODIC,
//       ping.MeterValues.MeasurandEnum.VOLTAGE,
//       ping.MeterValues.LocationEnum.OUTLET,
//       ping.MeterValues.UnitEnum.V,
//       state.statistic.common.highVoltageMeasure
//     ),
//   ];

//   await ping.MeterValues.execute(
//     uuid(),
//     connectorId,
//     state.state.plugs.transactionId[connectorId],
//     meterValue
//   );
// };

const state = require('../../state');
const ping = require('../../ping');
const uuid = require('../../utils/uuid');

function getCosFi() {
  // @TODO: calculate real value
  return 1;
}

function createMeterValue(context, measurand, location, unit, value) {
  return {
    context: context,
    measurand: measurand,
    location: location,
    unit: unit,
    value: value.toString(),
  };
}

module.exports = async function (parsedServerData, connectorId) {
  const meterValue = [
    {
      timestamp: new Date().toISOString(),
      sampledValue: [
        createMeterValue(
          ping.MeterValues.ContextEnum.SAMPLE_PERIODIC,
          ping.MeterValues.MeasurandEnum.CURRENT_IMPORT,
          ping.MeterValues.LocationEnum.OUTLET,
          ping.MeterValues.UnitEnum.A,
          state.statistic.plugs.currentMeasureA[connectorId]
        ),
        createMeterValue(
          ping.MeterValues.ContextEnum.SAMPLE_PERIODIC,
          ping.MeterValues.MeasurandEnum.POWER_OFFERED,
          ping.MeterValues.LocationEnum.OUTLET,
          ping.MeterValues.UnitEnum.KW,
          7 // @TODO: replace with maximum power of plug.
        ),
        createMeterValue(
          ping.MeterValues.ContextEnum.SAMPLE_PERIODIC,
          ping.MeterValues.MeasurandEnum.POWER_ACTIVE_IMPORT,
          ping.MeterValues.LocationEnum.OUTLET,
          ping.MeterValues.UnitEnum.KW,
          parseFloat(
            (
              (state.statistic.common.highVoltageMeasure *
                state.statistic.plugs.currentMeasureA[connectorId] *
                getCosFi()) /
              1000
            ).toFixed(3)
          )
        ),
        createMeterValue(
          ping.MeterValues.ContextEnum.SAMPLE_PERIODIC,
          ping.MeterValues.MeasurandEnum.ENERGY_ACTIVE_IMPORT_REGISTER,
          ping.MeterValues.LocationEnum.OUTLET,
          ping.MeterValues.UnitEnum.WH,
          state.statistic.plugs.powerKwh[connectorId] * 1000
        ),
        // createMeterValue(
        //   ping.MeterValues.ContextEnum.SAMPLE_PERIODIC,
        //   ping.MeterValues.MeasurandEnum.SOC,
        //   ping.MeterValues.LocationEnum.EV,
        //   ping.MeterValues.UnitEnum.PERCENT,
        //   0 // @TODO: replace with charged percent
        // ),
        createMeterValue(
          ping.MeterValues.ContextEnum.SAMPLE_PERIODIC,
          ping.MeterValues.MeasurandEnum.VOLTAGE,
          ping.MeterValues.LocationEnum.OUTLET,
          ping.MeterValues.UnitEnum.V,
          state.statistic.common.highVoltageMeasure
        ),
      ],
    },
  ];

  await ping.MeterValues.execute(
    uuid(),
    connectorId,
    state.state.plugs.transactionId[connectorId],
    meterValue
  );
};
