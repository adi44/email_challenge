import { Form, Button } from "react-bootstrap";

const MessageForm = ({ formInput, setFormInput, sendMessage }) => {
  return (
    <div className="email-form" onSubmit={sendMessage}>
      <Form>
        <Form.Group className="mb-3" controlId="formBasicEmail">
          <Form.Label>To</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter address"
            onChange={(e) =>
              setFormInput({ ...formInput, address: e.target.value })
            }
            value={formInput.address}
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="formBasicPassword">
          <Form.Label>Message</Form.Label>
          <Form.Control
            as="textarea"
            placeholder="Enter your message here"
            style={{ height: "100px" }}
            onChange={(e) =>
              setFormInput({ ...formInput, message: e.target.value })
            }
            value={formInput.message}
          />
        </Form.Group>
        <Button variant="primary" type="submit">
          Send Message
        </Button>
      </Form>
    </div>
  );
};

export default MessageForm;
