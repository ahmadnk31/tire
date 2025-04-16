import { Metadata } from "next";
import { ChatSupport } from "./chat-support";

export const metadata: Metadata = {
  title: "Customer Support Chat",
  description: "Admin interface for customer support chat management",
};

export default function ChatSupportPage() {
  return <ChatSupport />;
}
