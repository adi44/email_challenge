import Message from "./Message";

const Messages = ({ messages }) => {
  return (
    <div className="messages">
      {messages.length > 0 ? (
        <div className="messages">
          <h3>You have {messages.length} messages</h3>
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
