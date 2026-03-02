import React from "react";
import LocationSidebar from "./LocationSidebar";
import LocationTopBar from "./LocationTopBar";

type Props = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

export default function LocationLayout({ title, subtitle, children }: Props) {
  return (
    <div className="min-h-screen bg-tawi-bg text-tawi-charcoal">
      <div className="flex min-h-screen">
        <LocationSidebar />
        <div className="flex min-h-screen w-full flex-col md:pl-[280px]">
          <LocationTopBar title={title} subtitle={subtitle} roleLabel="Location manager" />
          {children}
        </div>
      </div>
    </div>
  );
}