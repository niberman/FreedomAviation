import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { loadPricing } from "@/lib/pricing";
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(import.meta.env.VITE_SUPABASE_URL!, import.meta.env.VITE_SUPABASE_ANON_KEY!);
const fmtUSD=(n:number)=>n.toLocaleString(undefined,{style:"currency",currency:"USD",maximumFractionDigits:0});
export function FreedomConfigurator({open,onOpenChange}:{open:boolean;onOpenChange:(o:boolean)=>void}) {
  const [loading,setLoading]=useState(true);
  const [tierId,setTierId]=useState<string>("");
  const [hours,setHours]=useState<number>(12);
  const [data,setData]=useState<any>(null);
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState<string|null>(null);
  const [success,setSuccess]=useState<string|null>(null);
  useEffect(()=>{(async()=>{setLoading(true);const d=await loadPricing();setData(d);setTierId(d.tierList[0]?.tier_id??"");setLoading(false);})();},[]);
  const currentBand=useMemo(()=>data?.bandList.find((b:any)=>hours>=b.min_hours&&(b.max_hours==null||hours<=b.max_hours)),[data,hours]);
  const priceRow=useMemo(()=>data?.grid[tierId]?.[currentBand?.hour_band_id], [data,tierId,currentBand]);
  const svcInfo=useMemo(()=>data?.servicesByBand?.[tierId]?.[currentBand?.hour_band_id], [data,tierId,currentBand]);
  async function handleSelectPlan(){
    setSaving(true);setError(null);setSuccess(null);
    try{
      const {data:u}=await supabase.auth.getUser();const user=u?.user;if(!user)throw new Error("Sign in first");
      const payload={tier_id:tierId,hours_requested:hours,hour_band_id:currentBand?.hour_band_id,quoted_price:priceRow?.base_price_for_band??null};
      const {error:e}=await supabase.from("support_tickets").insert([{owner_id:user.id,subject:"Membership request",body:JSON.stringify(payload),status:"open"}]);
      if(e)throw e;setSuccess("Request sent!");setTimeout(()=>onOpenChange(false),900);
    }catch(e:any){setError(e?.message??"Error");}finally{setSaving(false);}
  }
  if(loading)return(<Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>Loading…</DialogTitle></DialogHeader></DialogContent></Dialog>);
  const tier=data.tierList.find((t:any)=>t.tier_id===tierId);
  return(
  <Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle>Freedom Configurator</DialogTitle>
      <DialogDescription>Live data from Supabase (no hardcoding)</DialogDescription>
    </DialogHeader>
    <div className="space-y-6 mt-4">
      <div className="space-y-2">
        <Label>Aircraft Tier</Label>
        <Select value={tierId} onValueChange={setTierId}>
          <SelectTrigger><SelectValue placeholder="Select tier" /></SelectTrigger>
          <SelectContent>{data.tierList.map((t:any)=><SelectItem key={t.tier_id} value={t.tier_id}>{t.tier_name}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="space-y-3">
        <Label>Estimated Hours / Month</Label>
        <Slider value={[hours]} onValueChange={(v)=>setHours(v[0])} min={0} max={60} step={1}/>
        <div className="flex justify-between text-xs text-muted-foreground"><span>0</span><span>{hours} hrs</span><span>60</span></div>
        {currentBand&&<Badge variant="secondary">{currentBand.hour_band_label}</Badge>}
      </div>
      <Card><CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div><p className="text-sm text-muted-foreground">Monthly Estimate</p>
          <p className="text-3xl font-bold">{priceRow?fmtUSD(priceRow.base_price_for_band):"—"}</p></div>
          <Badge>{tier?.tier_name}</Badge>
        </div>
        {svcInfo&&<div className="mt-2">
          <p className="text-xs font-semibold text-muted-foreground mb-2">Included at this level</p>
          <div className="grid gap-2">
            <div className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-primary"/>{svcInfo.readiness_text}</div>
            <div className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-primary"/>{svcInfo.details_per_month} full details / month</div>
            {svcInfo.avionics_updates&&<div className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-primary"/>Avionics DB updates</div>}
            {svcInfo.fluids_included&&<div className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-primary"/>Fluids (Oil, O₂, TKS)</div>}
          </div>
        </div>}
      </CardContent></Card>
      <div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">Live from DB</span>
      <Button onClick={handleSelectPlan} disabled={saving}>{saving?"Saving…":"Select Plan"}</Button></div>
      {error&&<p className="text-sm text-destructive">{error}</p>}
      {success&&<p className="text-sm text-green-600">{success}</p>}
    </div>
  </DialogContent></Dialog>);
}
