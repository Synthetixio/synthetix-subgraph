import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts';

import {
  DeleteProposal,
  ExecuteProposal,
  GrantsDAO,
  NewProposal,
  VoteProposal,
} from '../generated/GrantsDAO/GrantsDAO';

import { Account, Member, Proposal, SystemInfo, Vote, Tribute } from '../generated/schema';

import { toDecimal, ZERO, ONE } from './common';

export function handleNewProposal(event: NewProposal): void {
  let dao = GrantsDAO.bind(event.address);

  let system = getSystemInfo(event);

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
  let vote = new Vote(proposal.id + '-' + proposal.voteCount.toString());
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
    let dao = GrantsDAO.bind(event.address);
    let completeProposals = dao.getCompleteProposals();

    let member = getMember(event.params.member);

    let vote = new Vote(proposal.id + '-' + proposal.voteCount.plus(ONE).toString());
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
    let system = getSystemInfo(event);
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

  let system = getSystemInfo(event);
  system.totalExecuted = system.totalExecuted.plus(tribute.amount);
  system.save();
}

export function handleDeleteProposal(event: DeleteProposal): void {
  let proposal = Proposal.load(event.params.proposalNumber.toString());

  if (proposal != null) {
    if (proposal.status != 'COMPLETED') {
      proposal.status = 'REJECTED';
    }

    proposal.deletedAt = event.block.timestamp;
    proposal.deletedAtBlock = event.block.number;
    proposal.deletedAtTransaction = event.transaction.hash;
    proposal.save();
  }
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

function getMember(address: Address): Member {
  return Member.load(address.toHexString()) as Member;
}

function getSystemInfo(event: ethereum.Event): SystemInfo {
  let dao = GrantsDAO.bind(event.address);

  let info = SystemInfo.load('current');

  if (info == null) {
    // Register community members
    let communityMembers = dao.getCommunityMembers();

    communityMembers.forEach(address => {
      let account = getOrCreatedAccount(address);

      let member = new Member(address.toHexString());
      member.account = account.id;
      member.type = 'COMMUNITY';
      member.proposalCount = ZERO;
      member.voteCount = ZERO;
      member.save();
    });

    // Register team members
    let teamMembers = dao.getTeamMembers();

    teamMembers.forEach(address => {
      let account = getOrCreatedAccount(address);

      let member = new Member(address.toHexString());
      member.account = account.id;
      member.type = 'TEAM';
      member.proposalCount = ZERO;
      member.voteCount = ZERO;
      member.save();
    });

    // Create initial system summary entity
    info = new SystemInfo('current');

    info.votesToPass = dao.toPass();
    info.votingPhaseDuration = dao.VOTING_PHASE();

    info.memberCount = BigInt.fromI32(communityMembers.length + teamMembers.length);
    info.communityMemberCount = BigInt.fromI32(communityMembers.length);
    info.teamMemberCount = BigInt.fromI32(teamMembers.length);

    info.proposalCount = ZERO;
    info.completedProposalCount = ZERO;

    info.voteCount = ZERO;

    info.totalBalance = ZERO.toBigDecimal();
    info.totalExecuted = ZERO.toBigDecimal();

    info.updatedAt = event.block.timestamp;
    info.updatedAtBlock = event.block.number;
    info.updatedAtTransaction = event.transaction.hash;

    info.save();
  }

  let totalBalance = dao.try_totalBalance();

  if (!totalBalance.reverted) {
    info.totalBalance = toDecimal(totalBalance.value);
  }

  info.updatedAt = event.block.timestamp;
  info.updatedAtBlock = event.block.number;
  info.updatedAtTransaction = event.transaction.hash;

  return info as SystemInfo;
}
