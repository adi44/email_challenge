import { BigInt } from "@graphprotocol/graph-ts"
import { Email, Msg_Recieved } from "../generated/Email/Email"
import { Message } from "../generated/schema"

export function handleMsg_Recieved(event: Msg_Recieved): void {
  // Entities can be loaded from the store using a string ID; this ID
  // needs to be unique across all entities of the same type
  let id = event.params.to.toHex() + event.params.id.toHex();
  let message = Message.load(id)

  // Entities only exist after they have been saved to the store;
  // `null` checks allow to create entities on demand
  if (!message) {
    message = new Message(id)

    // Entity fields can be set using simple assignments
    message.to = event.params.to.toHex();
    message.from = event.params.from.toHex();
    message.data = event.params.data.toHex();
    message.timestamp = event.block.timestamp;
  }

  message.save()
}
