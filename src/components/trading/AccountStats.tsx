import { TrendingUp, TrendingDown, Wallet, PiggyBank, Shield, BarChart3 } from "lucide-react";
import type { AccountInfo } from "@/types/trading";

interface AccountStatsProps {
  account: AccountInfo;
}

export const AccountStats = ({ account }: AccountStatsProps) => {
  const isProfitable = account.profit >= 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      <div className="stat-card">
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          <Wallet className="w-4 h-4" />
          <span className="text-xs font-medium">Balance</span>
        </div>
        <p className="text-xl font-bold font-mono">
          ${account.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
        </p>
      </div>

      <div className="stat-card">
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          <BarChart3 className="w-4 h-4" />
          <span className="text-xs font-medium">Equity</span>
        </div>
        <p className="text-xl font-bold font-mono">
          ${account.equity.toLocaleString("en-US", { minimumFractionDigits: 2 })}
        </p>
      </div>

      <div className="stat-card">
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          {isProfitable ? (
            <TrendingUp className="w-4 h-4 text-buy" />
          ) : (
            <TrendingDown className="w-4 h-4 text-sell" />
          )}
          <span className="text-xs font-medium">P/L</span>
        </div>
        <p className={`text-xl font-bold font-mono ${isProfitable ? "price-up" : "price-down"}`}>
          {isProfitable ? "+" : ""}${account.profit.toFixed(2)}
        </p>
      </div>

      <div className="stat-card">
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          <Shield className="w-4 h-4" />
          <span className="text-xs font-medium">Margin</span>
        </div>
        <p className="text-xl font-bold font-mono">
          ${account.margin.toFixed(2)}
        </p>
      </div>

      <div className="stat-card">
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          <PiggyBank className="w-4 h-4" />
          <span className="text-xs font-medium">Free Margin</span>
        </div>
        <p className="text-xl font-bold font-mono">
          ${account.freeMargin.toLocaleString("en-US", { minimumFractionDigits: 2 })}
        </p>
      </div>

      <div className="stat-card">
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          <BarChart3 className="w-4 h-4" />
          <span className="text-xs font-medium">Margin Level</span>
        </div>
        <p className="text-xl font-bold font-mono text-primary">
          {account.marginLevel.toFixed(0)}%
        </p>
      </div>
    </div>
  );
};
