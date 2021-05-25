import { DailyCandle, HourlyCandle, FourHourlyCandle, WeeklyCandle, MonthlyCandle } from '../generated/schema';
import { BigInt } from '@graphprotocol/graph-ts';

export function updateDailyCandle(dayID: number, synth: string, rate: BigInt): void {
  let newCandle = DailyCandle.load(dayID.toString() + '-' + synth);
  if (newCandle == null) {
    newCandle = new DailyCandle(dayID.toString() + '-' + synth);
    newCandle.synth = synth;
    newCandle.open = rate;
    newCandle.high = rate;
    newCandle.low = rate;
    newCandle.close = rate;
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

export function updateHourlyCandle(dayID: number, synth: string, rate: BigInt): void {
  let newCandle = HourlyCandle.load(dayID.toString() + '-' + synth);
  if (newCandle == null) {
    newCandle = new HourlyCandle(dayID.toString() + '-' + synth);
    newCandle.synth = synth;
    newCandle.open = rate;
    newCandle.high = rate;
    newCandle.low = rate;
    newCandle.close = rate;
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

export function updateFourHourlyCandle(dayID: number, synth: string, rate: BigInt): void {
  let newCandle = FourHourlyCandle.load(dayID.toString() + '-' + synth);
  if (newCandle == null) {
    newCandle = new FourHourlyCandle(dayID.toString() + '-' + synth);
    newCandle.synth = synth;
    newCandle.open = rate;
    newCandle.high = rate;
    newCandle.low = rate;
    newCandle.close = rate;
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

export function updateWeeklyCandle(dayID: number, synth: string, rate: BigInt): void {
  let newCandle = WeeklyCandle.load(dayID.toString() + '-' + synth);
  if (newCandle == null) {
    newCandle = new WeeklyCandle(dayID.toString() + '-' + synth);
    newCandle.synth = synth;
    newCandle.open = rate;
    newCandle.high = rate;
    newCandle.low = rate;
    newCandle.close = rate;
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

export function updateMonthlyCandle(dayID: number, synth: string, rate: BigInt): void {
  let newCandle = MonthlyCandle.load(dayID.toString() + '-' + synth);
  if (newCandle == null) {
    newCandle = new MonthlyCandle(dayID.toString() + '-' + synth);
    newCandle.synth = synth;
    newCandle.open = rate;
    newCandle.high = rate;
    newCandle.low = rate;
    newCandle.close = rate;
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
