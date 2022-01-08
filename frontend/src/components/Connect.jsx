import { Button } from "react-bootstrap";

const Connect = ({ connect }) => {
  return (
    <Button variant="primary" onClick={connect}>
      Connect to metamask 🦊
    </Button>
  );
};

export default Connect;
