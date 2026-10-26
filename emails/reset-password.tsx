import { Body, Container, Head, Heading, Html, Preview, Text } from "react-email";
import * as React from "react";

export default function ResetPassword({ url }: { url: string }) {
  return (
    <Html>
      <Head />
      <Preview>Reset your password</Preview>
      <Body style={{ backgroundColor: "#f6f9fc", fontFamily: "-apple-system, sans-serif" }}>
        <Container
          style={{
            backgroundColor: "#ffffff",
            margin: "0 auto",
            padding: "20px",
            borderRadius: "5px",
          }}
        >
          <Heading style={{ color: "#1f2937", fontSize: "24px", fontWeight: "bold" }}>
            Reset your password
          </Heading>
          <Text style={{ color: "#4b5563", fontSize: "16px" }}>
            Click the link below to reset your password:
          </Text>
          <Text style={{ color: "#2563eb", fontSize: "16px" }}>{url}</Text>
        </Container>
      </Body>
    </Html>
  );
}
