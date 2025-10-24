# Usage Example
import { useTierStartingPrices } from "@/hooks/useTierStartingPrices";
const {loading,prices,data} = useTierStartingPrices();
if(loading)return<p>Loading...</p>;
return(
  <div>
    {data.tierList.map((tier:any)=>(
      <div key={tier.tier_id}>
        <h3>{tier.tier_name}</h3>
        <p>Starting at ${prices[tier.tier_id]}/mo</p>
      </div>
    ))}
  </div>
);
