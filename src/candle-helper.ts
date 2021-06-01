import { DailyCandle, HourlyCandle, FourHourlyCandle, WeeklyCandle, MonthlyCandle } from '../generated/schema';
import { BigInt } from '@graphprotocol/graph-ts';

export function updateDailyCandle(timestamp: BigInt, synth: string, rate: BigInt): void {
  let dayID = timestamp.toI32() / 86400;
  let newCandle = DailyCandle.load(dayID.toString() + '-' + synth);
  if (newCandle == null) {
    newCandle = new DailyCandle(dayID.toString() + '-' + synth);
    newCandle.synth = synth;
    newCandle.open = rate;
    newCandle.high = rate;
    newCandle.low = rate;
    newCandle.close = rate;
    newCandle.timestamp = timestamp;
    newCandle.save();
    return;
  }
  if (newCandle.low > rate) {
    newCandle.low = rate;
  }
  if (newCandle.high < rate) {
    newCandle.high = rate;
  }
  newCandle.close = rate;
  newCandle.save();
}

export function updateHourlyCandle(timestamp: BigInt, synth: string, rate: BigInt): void {
  let hourID = timestamp.toI32() / 3600;
  let newCandle = HourlyCandle.load(hourID.toString() + '-' + synth);
  if (newCandle == null) {
    newCandle = new HourlyCandle(hourID.toString() + '-' + synth);
    newCandle.synth = synth;
    newCandle.open = rate;
    newCandle.high = rate;
    newCandle.low = rate;
    newCandle.close = rate;
    newCandle.timestamp = timestamp;
    newCandle.save();
    return;
  }
  if (newCandle.low > rate) {
    newCandle.low = rate;
  }
  if (newCandle.high < rate) {
    newCandle.high = rate;
  }
  newCandle.close = rate;
  newCandle.save();
}

export function updateFourHourlyCandle(timestamp: BigInt, synth: string, rate: BigInt): void {
  let fourHourID = timestamp.toI32() / 14400;
  let newCandle = FourHourlyCandle.load(fourHourID.toString() + '-' + synth);
  if (newCandle == null) {
    newCandle = new FourHourlyCandle(fourHourID.toString() + '-' + synth);
    newCandle.synth = synth;
    newCandle.open = rate;
    newCandle.high = rate;
    newCandle.low = rate;
    newCandle.close = rate;
    newCandle.timestamp = timestamp;
    newCandle.save();
    return;
  }
  if (newCandle.low > rate) {
    newCandle.low = rate;
  }
  if (newCandle.high < rate) {
    newCandle.high = rate;
  }
  newCandle.close = rate;
  newCandle.save();
}

export function updateWeeklyCandle(timestamp: BigInt, synth: string, rate: BigInt): void {
  let weekID = timestamp.toI32() / 604800;
  let newCandle = WeeklyCandle.load(weekID.toString() + '-' + synth);
  if (newCandle == null) {
    newCandle = new WeeklyCandle(weekID.toString() + '-' + synth);
    newCandle.synth = synth;
    newCandle.open = rate;
    newCandle.high = rate;
    newCandle.low = rate;
    newCandle.close = rate;
    newCandle.timestamp = timestamp;
    newCandle.save();
    return;
  }
  if (newCandle.low > rate) {
    newCandle.low = rate;
  }
  if (newCandle.high < rate) {
    newCandle.high = rate;
  }
  newCandle.close = rate;
  newCandle.save();
}

export function updateMonthlyCandle(timestamp: BigInt, synth: string, rate: BigInt): void {
  let monthID = timestamp.toI32() / 2629743;
  let newCandle = MonthlyCandle.load(monthID.toString() + '-' + synth);
  if (newCandle == null) {
    newCandle = new MonthlyCandle(monthID.toString() + '-' + synth);
    newCandle.synth = synth;
    newCandle.open = rate;
    newCandle.high = rate;
    newCandle.low = rate;
    newCandle.close = rate;
    newCandle.timestamp = timestamp;
    newCandle.save();
    return;
  }
  if (newCandle.low > rate) {
    newCandle.low = rate;
  }
  if (newCandle.high < rate) {
    newCandle.high = rate;
  }
  newCandle.close = rate;
  newCandle.save();
}
