import { ReactNode } from "react";

interface DashboardHeaderProps {
  title: string;
  children?: ReactNode;
}

export function DashboardHeader({ title, children }: DashboardHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
      <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">{title}</h1>
      {children}
    </div>
  );
}