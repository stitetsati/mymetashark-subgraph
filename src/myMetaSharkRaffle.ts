import { RandomNumberRequested, Explored, RaffleConcluded, RaffleCreated, TicketClaimed, MyMetaSharkRaffle } from "../generated/MyMetaSharkRaffle/MyMetaSharkRaffle";
import { Shark, Raffle, Ticket, Exploration, SharkParticipation, UserParticipation } from "../generated/schema";

export function handleRaffleCreated(event: RaffleCreated): void {
  let raffle = Raffle.load(event.params.raffleIndex.toString());
  if (raffle == null) {
    raffle = new Raffle(event.params.raffleIndex.toString());
    raffle.duration = event.params.duration.toI32();
    raffle.startTime = event.params.startTime.toI32();
    raffle.duration = event.params.duration.toI32();
    raffle.endTime = raffle.startTime + raffle.duration;
    raffle.ticketInterval = event.params.ticketInterval.toI32();
    raffle.winnerCount = event.params.winnerCount.toI32();
    raffle.ticketsClaimed = 0;
    raffle.randomNumber = "";
    raffle.sharkParticipationCount = 0;
    raffle.userParticipationCount = 0;
    raffle.randomNumberRequested = false;
    raffle.wonTickets = [];
    raffle.save();
  }
}

export function handleExplored(event: Explored): void {
  let raffle = Raffle.load(event.params.raffleIndex.toString()) as Raffle;
  let shark = Shark.load(event.params.sharkTokenId.toString()) as Shark;

  const explorationId = event.params.raffleIndex.toString() + "-" + event.params.sharkTokenId.toString() + "-" + event.params.timestamp.toHexString();
  let exploration = new Exploration(explorationId);
  exploration.startTime = event.params.timestamp.toI32();
  exploration.endTime = event.params.timestamp.toI32() + raffle.ticketInterval;
  exploration.raffle = event.params.raffleIndex.toString();
  exploration.shark = event.params.sharkTokenId.toString();
  exploration.save();

  const sharkExplorationId = event.params.raffleIndex.toString() + "-" + event.params.sharkTokenId.toString();
  let sharkParticipation = SharkParticipation.load(sharkExplorationId);
  if (sharkParticipation == null) {
    // new participation
    sharkParticipation = new SharkParticipation(sharkExplorationId);
    sharkParticipation.shark = event.params.sharkTokenId.toString();
    sharkParticipation.raffle = event.params.raffleIndex.toString();
    sharkParticipation.save();

    // update raffle
    raffle.sharkParticipationCount += 1;
  }
  const userParticipationId = event.params.raffleIndex.toString() + "-" + shark.user;
  let userParticipation = UserParticipation.load(userParticipationId);
  if (userParticipation == null) {
    // new participation
    userParticipation = new UserParticipation(userParticipationId);
    userParticipation.user = shark.user;
    userParticipation.raffle = event.params.raffleIndex.toString();
    userParticipation.save();

    // update raffle
    raffle.userParticipationCount += 1;
  }
  raffle.save();
}

export function handleTicketClaimed(event: TicketClaimed): void {
  let raffle = Raffle.load(event.params.raffleIndex.toString()) as Raffle;
  raffle.ticketsClaimed += 1;
  raffle.save();

  let ticketId = event.params.raffleIndex.toString() + "-" + event.params.ticketNumber.toString();
  let ticket = new Ticket(ticketId);
  ticket.raffle = event.params.raffleIndex.toString();
  ticket.shark = event.params.sharkTokenId.toString();
  ticket.ticketNumber = event.params.ticketNumber.toI32();
  ticket.won = false;
  ticket.save();
}

export function handleRandomNumberRequested(event: RandomNumberRequested): void {
  let raffle = Raffle.load(event.params.raffleIndex.toString()) as Raffle;
  raffle.randomNumberRequested = true;
  raffle.save();
}
export function handleRaffleConcluded(event: RaffleConcluded): void {
  let raffle = Raffle.load(event.params.raffleIndex.toString()) as Raffle;
  raffle.randomNumber = event.params.randomNumber.toHexString();

  let raffleContract = MyMetaSharkRaffle.bind(event.address);
  let winners = raffleContract.getRaffleWinners(event.params.raffleIndex);
  for (let i = 0; i < winners.length; i++) {
    let winner = winners[i];
    let ticketId = event.params.raffleIndex.toString() + "-" + winner.toString();
    let ticket = Ticket.load(ticketId) as Ticket;
    ticket.won = true;
    ticket.save();

    // doc: Updating array properties is a little more involved,
    // as the getting an array from an entity creates a copy of that array.
    // This means array properties have to be set again explicitly after changing the array.

    let shark = Shark.load(ticket.shark) as Shark;
    let sharkWonTickets = shark.wonTickets;
    sharkWonTickets.push(ticket.id);
    shark.wonTickets = sharkWonTickets;
    shark.save();

    let raffleWonTickets = raffle.wonTickets;
    raffleWonTickets.push(ticket.id);
    raffle.wonTickets = raffleWonTickets;
  }
  raffle.save();
}
