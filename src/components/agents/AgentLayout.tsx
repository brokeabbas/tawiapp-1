import React from "react";
import AgentSidebar from "./AgentSidebar";
import AgentTopBar from "./AgentTopBar";

type Props = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

export default function AgentLayout({ title, subtitle, children }: Props) {
  return (
    <div className="min-h-screen bg-tawi-bg text-tawi-charcoal">
      <div className="flex min-h-screen">
        <AgentSidebar />
        <div className="flex min-h-screen w-full flex-col md:pl-[280px]">
          <AgentTopBar title={title} subtitle={subtitle} />
          {children}
        </div>
      </div>
    </div>
  );
}