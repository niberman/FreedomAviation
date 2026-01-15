import { NormalizedFeedItem } from "../../types";
import { FeedItem } from "./FeedItem";

interface OpsFeedProps {
  items: NormalizedFeedItem[];
  isLoading: boolean;
}

export function OpsFeed({ items, isLoading }: OpsFeedProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-slate-900/50 animate-pulse rounded-xl border border-slate-800" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12 bg-slate-900/20 rounded-xl border border-dashed border-slate-800">
        <p className="text-slate-500 text-sm">No recent activity found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <FeedItem key={item.id} item={item} />
      ))}
    </div>
  );
}
