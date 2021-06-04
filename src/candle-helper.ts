import { DailyCandle } from '../generated/schema';
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
