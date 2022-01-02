// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

contract Email{
    struct Message {
        address to;
        address from;
        bytes data;
    }
    uint256 public messageId = 0;
    mapping (address =>mapping(uint=>Message) ) public messages;
    address public owner;
    mapping (address => bool) public recievers;

    event Msg_Recieved(address to, address from, bytes data, uint256 id);

    modifier onlySelf(address reciever){
        require(msg.sender == reciever, "you cannnot register someone else");
        _;
    }

    function register(address reciever) onlySelf(reciever) public {
        require(recievers[reciever]!=true,"Reciever already registed");
        recievers[reciever] = true;
    }

    function sendMessage(address to, bytes calldata data) public {
        require(recievers[to]==true,"Reciever is not registered");
        Message memory message = Message(to,msg.sender,data);
        messages[to][messageId]= message;
        messageId = messageId + 1;
        emit Msg_Recieved(to, msg.sender, data, messageId-1);
    }
}
