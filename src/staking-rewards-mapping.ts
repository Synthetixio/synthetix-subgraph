import { Staked as StakedEvent, RewardPaid as RewardPaidEvent } from '../generated/iBTCStakingRewards_2/StakingRewards';

import { Staked, RewardPaid } from '../generated/schema';

export function handleStaked(event: StakedEvent): void {
  let stakedEntity = new Staked(event.transaction.hash.toHex() + '-' + event.logIndex.toString());
  stakedEntity.account = event.params.user;
  stakedEntity.amount = event.params.amount;
  stakedEntity.contract = event.address;
  stakedEntity.save();
}

export function handleRewardPaid(event: RewardPaidEvent): void {
  let rewardPaidEntity = new RewardPaid(event.transaction.hash.toHex() + '-' + event.logIndex.toString());
  rewardPaidEntity.account = event.params.user;
  rewardPaidEntity.amount = event.params.reward;
  rewardPaidEntity.contract = event.address;
  rewardPaidEntity.save();
}
