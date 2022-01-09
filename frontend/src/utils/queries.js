import { gql } from "@apollo/client";

export const FETCH_MESSAGES = gql`
  query($to: String!) {
    messages(where: { to: $to }, orderBy: timestamp, orderDirection: desc) {
      id
      to
      from
      data
      timestamp
    }
  }
`;
