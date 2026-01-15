import { NormalizedFeedItem } from "../../types";
import { StagingCard } from "./StagingCard";
import { SquawkCard } from "./SquawkCard";
import { InstructionCard } from "./InstructionCard";
import { InvoiceCard } from "./InvoiceCard";

interface FeedItemProps {
  item: NormalizedFeedItem;
}

export function FeedItem({ item }: FeedItemProps) {
  switch (item.type) {
    case 'staging':
      return <StagingCard item={item} />;
    case 'squawk':
      return <SquawkCard item={item} />;
    case 'instruction':
      return <InstructionCard item={item} />;
    case 'invoice':
      return <InvoiceCard item={item} />;
    default:
      return null;
  }
}
