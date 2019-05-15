import {
  SynthExchange as SynthExchangeEvent,
  Transfer as TransferEvent,
  Approval as ApprovalEvent,
  TokenStateUpdated as TokenStateUpdatedEvent,
  ProxyUpdated as ProxyUpdatedEvent,
  SelfDestructTerminated as SelfDestructTerminatedEvent,
  SelfDestructed as SelfDestructedEvent,
  SelfDestructInitiated as SelfDestructInitiatedEvent,
  SelfDestructBeneficiaryUpdated as SelfDestructBeneficiaryUpdatedEvent,
  OwnerNominated as OwnerNominatedEvent,
  OwnerChanged as OwnerChangedEvent
} from "../generated/Contract/Contract"
import {
  SynthExchange,
  Transfer,
  Approval,
  TokenStateUpdated,
  ProxyUpdated,
  SelfDestructTerminated,
  SelfDestructed,
  SelfDestructInitiated,
  SelfDestructBeneficiaryUpdated,
  OwnerNominated,
  OwnerChanged
} from "../generated/schema"

export function handleSynthExchange(event: SynthExchangeEvent): void {
  let entity = new SynthExchange(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.account = event.params.account
  entity.fromCurrencyKey = event.params.fromCurrencyKey
  entity.fromAmount = event.params.fromAmount
  entity.toCurrencyKey = event.params.toCurrencyKey
  entity.toAmount = event.params.toAmount
  entity.toAddress = event.params.toAddress
  entity.save()
}

export function handleTransfer(event: TransferEvent): void {
  let entity = new Transfer(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.from = event.params.from
  entity.to = event.params.to
  entity.value = event.params.value
  entity.save()
}

export function handleApproval(event: ApprovalEvent): void {
  let entity = new Approval(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.owner = event.params.owner
  entity.spender = event.params.spender
  entity.value = event.params.value
  entity.save()
}

export function handleTokenStateUpdated(event: TokenStateUpdatedEvent): void {
  let entity = new TokenStateUpdated(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.newTokenState = event.params.newTokenState
  entity.save()
}

export function handleProxyUpdated(event: ProxyUpdatedEvent): void {
  let entity = new ProxyUpdated(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.proxyAddress = event.params.proxyAddress
  entity.save()
}

export function handleSelfDestructTerminated(
  event: SelfDestructTerminatedEvent
): void {
  let entity = new SelfDestructTerminated(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )

  entity.save()
}

export function handleSelfDestructed(event: SelfDestructedEvent): void {
  let entity = new SelfDestructed(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.beneficiary = event.params.beneficiary
  entity.save()
}

export function handleSelfDestructInitiated(
  event: SelfDestructInitiatedEvent
): void {
  let entity = new SelfDestructInitiated(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.selfDestructDelay = event.params.selfDestructDelay
  entity.save()
}

export function handleSelfDestructBeneficiaryUpdated(
  event: SelfDestructBeneficiaryUpdatedEvent
): void {
  let entity = new SelfDestructBeneficiaryUpdated(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.newBeneficiary = event.params.newBeneficiary
  entity.save()
}

export function handleOwnerNominated(event: OwnerNominatedEvent): void {
  let entity = new OwnerNominated(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.newOwner = event.params.newOwner
  entity.save()
}

export function handleOwnerChanged(event: OwnerChangedEvent): void {
  let entity = new OwnerChanged(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.oldOwner = event.params.oldOwner
  entity.newOwner = event.params.newOwner
  entity.save()
}
