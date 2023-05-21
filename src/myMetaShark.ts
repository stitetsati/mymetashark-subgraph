import { BigInt } from "@graphprotocol/graph-ts";
import { Transfer } from "../generated/MyMetaShark/MyMetaShark";
import { User, Shark } from "../generated/schema";

export function handleTransfer(event: Transfer): void {
  let fromAddress = event.params.from;
  let toAddress = event.params.to;
  let sharkId = event.params.tokenId;
  let fromUser = User.load(fromAddress.toHexString());
  let toUser = User.load(toAddress.toHexString());
  let shark = Shark.load(sharkId.toString());
  if (shark == null) {
    shark = new Shark(sharkId.toString());
    shark.wonTickets = [];
  }
  if (fromUser == null) {
    fromUser = new User(fromAddress.toHexString());
    fromUser.save();
  }

  if (toUser == null) {
    toUser = new User(toAddress.toHexString());
    toUser.save();
  }

  shark.user = toUser.id;
  shark.save();
}
