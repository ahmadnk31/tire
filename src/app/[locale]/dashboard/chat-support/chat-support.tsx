import { getTranslations } from "next-intl/server";
import { ChatSupportClient } from "@/components/dashboard/chat-support/chat-support-client";

export async function ChatSupport() {
  const t = await getTranslations("Dashboard.chatSupport");

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">{t("title")}</h2>
      </div>
      
      <div className="w-full">
        <ChatSupportClient />
      </div>
    </div>
  );
}
