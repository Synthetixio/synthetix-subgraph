import { Address, BigInt, dataSource, ethereum, store } from '@graphprotocol/graph-ts';

import {
  AddCommunityMemberCall,
  AddTeamMemberCall,
  DeleteProposal,
  ExecuteProposal,
  GrantsDAO,
  NewProposal,
  RemoveCommunityMemberCall,
  RemoveTeamMemberCall,
  UpdateToPassCall,
  VoteProposal,
} from '../generated/subgraphs/grantsdao/GrantsDAO/GrantsDAO';

import { Account, Member, Proposal, SystemInfo, Vote, Tribute } from '../generated/subgraphs/grantsdao/schema';

import { toDecimal, ZERO, ONE } from './lib/util';

export function handleNewProposal(event: NewProposal): void {
  let dao = GrantsDAO.bind(event.address);

  let system = getSystemInfo(event.block, event.transaction);

  // Register new proposal
  let proposalData = dao.proposals(event.params.proposalNumber);
  let proposer = getMember(event.transaction.from);
  let receiver = getOrCreatedAccount(event.params.receiver);

  let proposal = new Proposal(event.params.proposalNumber.toString());
  proposal.number = event.params.proposalNumber;
  proposal.amount = toDecimal(event.params.amount);
  proposal.description = proposalData.value5;
  proposal.proposer = proposer.id;
  proposal.status = proposer.type == 'TEAM' ? 'APPROVED' : 'PROPOSED';
  proposal.receiver = receiver.id;
  proposal.url = proposalData.value6;
  proposal.approvals = ONE;
  proposal.teamApproval = proposer.type == 'TEAM';
  proposal.voteCount = ONE;
  proposal.createdAt = event.block.timestamp;
  proposal.createdAtBlock = event.block.number;
  proposal.createdAtTransaction = event.transaction.hash;
  proposal.save();

  // Register proposer's approval
  let vote = new Vote(proposal.id + '-' + proposer.id);
  vote.member = proposer.id;
  vote.proposal = proposal.id;
  vote.approve = true;
  vote.block = event.block.number;
  vote.timestamp = event.block.timestamp;
  vote.transaction = event.transaction.hash;
  vote.save();

  proposer.proposalCount = proposer.proposalCount.plus(ONE);
  proposer.voteCount = proposer.voteCount.plus(ONE);
  proposer.save();

  // Update entities summary
  system.proposalCount = system.proposalCount.plus(ONE);
  system.voteCount = system.voteCount.plus(ONE);
  system.save();
}

export function handleVoteProposal(event: VoteProposal): void {
  let proposal = Proposal.load(event.params.proposal.toString());

  if (proposal != null) {
    let system = getSystemInfo(event.block, event.transaction);

    let dao = GrantsDAO.bind(event.address);
    let completeProposals = dao.getCompleteProposals();

    let member = getMember(event.params.member);

    let vote = new Vote(proposal.id + '-' + member.id);
    vote.member = member.id;
    vote.proposal = proposal.id;
    vote.approve = event.params.vote;
    vote.block = event.block.number;
    vote.timestamp = event.block.timestamp;
    vote.transaction = event.transaction.hash;
    vote.save();

    // Update proposal state
    proposal.approvals = vote.approve ? proposal.approvals.plus(ONE) : proposal.approvals;
    proposal.teamApproval = member.type == 'TEAM' ? true : proposal.teamApproval;
    proposal.voteCount = proposal.voteCount.plus(ONE);
    proposal.modifiedAt = event.block.timestamp;
    proposal.modifiedAtBlock = event.block.number;
    proposal.modifiedAtTransaction = event.transaction.hash;

    if (member.type == 'TEAM') {
      proposal.status = 'APPROVED';
    }

    if (completeProposals.includes(proposal.number)) {
      proposal.status = 'COMPLETED';
    }

    proposal.save();

    // Count member votes
    member.voteCount = member.voteCount.plus(ONE);
    member.save();

    // Update entities summary
    system.voteCount = system.voteCount.plus(ONE);

    if (proposal.status == 'COMPLETED') {
      system.completedProposalCount = system.completedProposalCount.plus(ONE);
    }

    system.save();
  }
}

export function handleExecuteProposal(event: ExecuteProposal): void {
  let amount = toDecimal(event.params.amount);

  let receiver = getOrCreatedAccount(event.params.receiver);
  receiver.earned = receiver.earned.plus(amount);
  receiver.tributeCount = receiver.tributeCount.plus(ONE);
  receiver.save();

  let tribute = new Tribute(receiver.id + '-' + receiver.tributeCount.toString());
  tribute.receiver = receiver.id;
  tribute.amount = toDecimal(event.params.amount);
  tribute.block = event.block.number;
  tribute.timestamp = event.block.timestamp;
  tribute.transaction = event.transaction.hash;
  tribute.save();

  let system = getSystemInfo(event.block, event.transaction);
  system.totalExecuted = system.totalExecuted.plus(tribute.amount);
  system.save();
}

export function handleDeleteProposal(event: DeleteProposal): void {
  let proposal = Proposal.load(event.params.proposalNumber.toString());

  if (proposal != null) {
    if (proposal.status != 'COMPLETED') {
      proposal.status = 'REJECTED';
    }

    proposal.modifiedAt = event.block.timestamp;
    proposal.modifiedAtBlock = event.block.number;
    proposal.modifiedAtTransaction = event.transaction.hash;

    proposal.removedAt = event.block.timestamp;
    proposal.removedAtBlock = event.block.number;
    proposal.removedAtTransaction = event.transaction.hash;

    proposal.save();
  }
}

export function handleAddCommunityMember(call: AddCommunityMemberCall): void {
  let system = getSystemInfo(call.block, call.transaction);

  // Register member
  let member = getMember(call.inputs._member);

  if (member == null) {
    // New member to register
    member = createMember(call.inputs._member, 'COMMUNITY');
  } else {
    // Member was previously registered
    member.removedAt = null;
    member.removedAtBlock = null;
    member.removedAtTransaction = null;
  }

  member.save();

  // Update entities summary
  system.memberCount = system.memberCount.plus(ONE);
  system.communityMemberCount = system.communityMemberCount.plus(ONE);
  system.save();
}

export function handleRemoveCommunityMember(call: RemoveCommunityMemberCall): void {
  let system = getSystemInfo(call.block, call.transaction);

  // Remove member
  let member = getMember(call.inputs._member);
  member.removedAt = call.block.timestamp;
  member.removedAtBlock = call.block.number;
  member.removedAtTransaction = call.transaction.hash;
  member.save();

  system.memberCount = system.memberCount.minus(ONE);
  system.communityMemberCount = system.communityMemberCount.minus(ONE);
  system.save();

  // Remove member's votes from proposals
  call.inputs._proposals.forEach((proposalNumber) => {
    let proposal = Proposal.load(proposalNumber.toString());

    if (proposal != null) {
      let system = getSystemInfo(call.block, call.transaction);

      store.remove('Vote', proposal.id + '-' + call.inputs._member.toHexString());

      proposal.voteCount = proposal.voteCount.minus(ONE);
      proposal.save();

      system.voteCount = system.voteCount.minus(ONE);
      system.save();
    }
  });
}

export function handleAddTeamMember(call: AddTeamMemberCall): void {
  let system = getSystemInfo(call.block, call.transaction);

  // Register member
  let member = getMember(call.inputs._member);

  if (member == null) {
    // New member to register
    member = createMember(call.inputs._member, 'TEAM');
  } else {
    // Member was previously registered
    member.removedAt = null;
    member.removedAtBlock = null;
    member.removedAtTransaction = null;
  }

  member.save();

  // Update entities summary
  system.memberCount = system.memberCount.plus(ONE);
  system.teamMemberCount = system.teamMemberCount.plus(ONE);
  system.save();
}

export function handleRemoveTeamMember(call: RemoveTeamMemberCall): void {
  let system = getSystemInfo(call.block, call.transaction);

  // Remove member
  let member = getMember(call.inputs._member);
  member.removedAt = call.block.timestamp;
  member.removedAtBlock = call.block.number;
  member.removedAtTransaction = call.transaction.hash;
  member.save();

  system.memberCount = system.memberCount.minus(ONE);
  system.teamMemberCount = system.teamMemberCount.minus(ONE);
  system.save();
}

export function handleUpdateToPass(call: UpdateToPassCall): void {
  let system = getSystemInfo(call.block, call.transaction);

  system.votesToPass = call.inputs._toPass;
  system.save();
}

function createMember(address: Address, type: string): Member {
  let account = getOrCreatedAccount(address);

  let member = new Member(address.toHexString());
  member.account = account.id;
  member.type = type;
  member.proposalCount = ZERO;
  member.voteCount = ZERO;

  return member;
}

function getMember(address: Address): Member {
  return Member.load(address.toHexString()) as Member;
}

function getOrCreatedAccount(address: Address): Account {
  let account = Account.load(address.toHexString());

  if (account == null) {
    account = new Account(address.toHexString());
    account.address = address;
    account.earned = ZERO.toBigDecimal();
    account.tributeCount = ZERO;
    account.save();
  }

  return account as Account;
}

function getSystemInfo(block: ethereum.Block, transaction: ethereum.Transaction): SystemInfo {
  let dao = GrantsDAO.bind(dataSource.address());

  let state = SystemInfo.load('current');

  if (state == null) {
    let communityMembers = dao.getCommunityMembers();
    let teamMembers = dao.getTeamMembers();

    // Register community members
    communityMembers.forEach((address) => {
      createMember(address, 'COMMUNITY').save();
    });

    // Register team members
    teamMembers.forEach((address) => {
      createMember(address, 'TEAM').save();
    });

    // Create initial system summary entity
    state = new SystemInfo('current');

    state.votesToPass = dao.toPass();
    state.votingPhaseDuration = dao.VOTING_PHASE();

    state.memberCount = BigInt.fromI32(communityMembers.length + teamMembers.length);
    state.communityMemberCount = BigInt.fromI32(communityMembers.length);
    state.teamMemberCount = BigInt.fromI32(teamMembers.length);

    state.proposalCount = ZERO;
    state.completedProposalCount = ZERO;

    state.voteCount = ZERO;

    state.totalBalance = ZERO.toBigDecimal();
    state.totalExecuted = ZERO.toBigDecimal();

    state.updatedAt = block.timestamp;
    state.updatedAtBlock = block.number;
    state.updatedAtTransaction = transaction.hash;

    state.save();
  }

  let totalBalance = dao.try_totalBalance();

  if (!totalBalance.reverted && totalBalance.value != null) {
    state.totalBalance = toDecimal(totalBalance.value);
  }

  state.updatedAt = block.timestamp;
  state.updatedAtBlock = block.number;
  state.updatedAtTransaction = transaction.hash;

  return state as SystemInfo;
}
