import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import pilot1 from "@assets/stock_images/professional_pilot_s_0ce9d965.jpg";
import pilot2 from "@assets/stock_images/professional_pilot_s_544bb357.jpg";

const testimonials = [
  {
    name: "Sarah Mitchell",
    aircraft: "N847SR • SR22T",
    image: pilot1,
    quote:
      "Freedom Aviation transformed my flying experience. I spend zero time worrying about maintenance—just pure flying enjoyment.",
    rating: 5,
  },
  {
    name: "James Anderson",
    aircraft: "N123JA • Vision Jet",
    image: pilot2,
    quote:
      "The concierge service is unmatched. My aircraft is always ready when I am, and the team handles everything with precision.",
    rating: 5,
  },
];

export function Testimonials() {
  return (
    <div className="py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-semibold mb-4">
            Trusted by Owner-Pilots
          </h2>
          <p className="text-lg text-muted-foreground">
            See what our members say about their experience.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {testimonials.map((testimonial, idx) => (
            <Card key={idx}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage
                      src={testimonial.image}
                      alt={testimonial.name}
                    />
                    <AvatarFallback>
                      {testimonial.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-semibold">{testimonial.name}</h4>
                    <Badge
                      variant="secondary"
                      className="text-xs font-mono mt-1"
                    >
                      {testimonial.aircraft}
                    </Badge>
                  </div>
                </div>
                <p className="text-muted-foreground italic">
                  "{testimonial.quote}"
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
