import { useEffect, useState } from "react";
import { loadPricing } from "@/lib/pricing";
export function useTierStartingPrices() {
  const [data, setData] = useState<any>(null);
  useEffect(()=>{(async()=>setData(await loadPricing()))()},[]);
  if(!data) return {loading:true,prices:{}};
  const prices:Record<string,number> = {};
  for(const tier of data.tierList){
    const rows=Object.values(data.grid[tier.tier_id]) as any[];
    const minRow=rows.sort((a,b)=>a.min_hours-b.min_hours)[0];
    prices[tier.tier_id]=minRow?.base_price_for_band??0;
  }
  return {loading:false,prices,data};
}
