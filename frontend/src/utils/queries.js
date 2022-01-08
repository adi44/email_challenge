import { gql } from "@apollo/client";

export const FETCH_MESSAGES = gql`
  query($to: String!) {
    messages(where: { to: $to }) {
      id
      to
      from
      data
      timestamp
    }
  }
`;
