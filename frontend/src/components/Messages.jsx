import { Badge } from "react-bootstrap";

import Message from "./Message";

const Messages = ({ messages }) => {
  return (
    <div
      className="messages"
      style={{
        marginTop: "12px",
      }}
    >
      {messages.length > 0 ? (
        <div className="messages">
          <h3>
            You have <Badge bg="primary"> {messages.length} </Badge> messages
          </h3>
          {messages.map((message) => (
            <Message key={message.id} message={message} />
          ))}
        </div>
      ) : (
        <h3>You don't have any messages</h3>
      )}
    </div>
  );
};

export default Messages;
