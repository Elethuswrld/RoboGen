import { ScrollArea } from "@/components/ui/scroll-area";
import { Terminal, AlertCircle, CheckCircle, Info, AlertTriangle } from "lucide-react";

interface Log {
  time: number;
  level: string;
  message: string;
}

interface LogsPanelProps {
  logs: Log[];
}

const levelIcons: Record<string, React.ReactNode> = {
  info: <Info className="w-3 h-3 text-accent" />,
  success: <CheckCircle className="w-3 h-3 text-buy" />,
  warning: <AlertTriangle className="w-3 h-3 text-warning" />,
  error: <AlertCircle className="w-3 h-3 text-sell" />,
};

const levelColors: Record<string, string> = {
  info: "text-accent",
  success: "text-buy",
  warning: "text-warning",
  error: "text-sell",
};

export const LogsPanel = ({ logs }: LogsPanelProps) => {
  return (
    <div className="trading-panel h-full flex flex-col">
      <div className="trading-panel-header">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-primary" />
          <h3 className="font-semibold">Activity Log</h3>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1 font-mono text-xs">
          {logs.length === 0 ? (
            <p className="text-muted-foreground p-2">No activity yet...</p>
          ) : (
            logs.map((log, i) => (
              <div
                key={i}
                className="flex items-start gap-2 p-2 rounded hover:bg-secondary/30 animate-slide-up"
              >
                <span className="mt-0.5">{levelIcons[log.level] || levelIcons.info}</span>
                <span className="text-muted-foreground shrink-0">
                  {new Date(log.time).toLocaleTimeString()}
                </span>
                <span className={levelColors[log.level] || "text-foreground"}>
                  {log.message}
                </span>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
