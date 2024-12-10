const PlugStateEnum = {
  UNPLUGGED: 1,
  CAR_DETECTED: 2,
  CHARGING: 3,
  NO_POWER_ABORT: 4,
  CAR_ERROR_12V_ERROR: 5,
  PLUG_SOFT_LOCK: 6,
  OVER_CURRENT_ERROR: 7,
  PLUG_RESERVE: 8,
  CHARGE_COMPLETED: 9,

  // non-standard codes
  CONNECTOR_MISSING: 17,
};

module.exports = {
  PlugStateEnum: PlugStateEnum,
};
