
import Card from "./feacture-section/Card"
import { Typography } from "./ui/typography/Typography"
import { getBaseUrl } from "@/lib/utils"

interface Feature {
   title: string;
   description: string;
   icon: string;
}

const getFeatures = async (): Promise<Feature[]> => {
   try {
      const query = `
      query {
        features {
          icon
          title
          description
        }
      }
    `;

      const res = await fetch(`${getBaseUrl()}/api/graphql`, {
         method: 'POST',
         headers: {
            'Content-Type': 'application/json',
         },
         body: JSON.stringify({ query }),
         next: { revalidate: 10 }
      });

      if (!res.ok) {
         throw new Error('Failed to fetch data');
      }

      const { data } = await res.json();
      return data.features;
   } catch (error) {
      console.error("Error fetching features:", error);
      return [];
   }
}

export const FeaturesSection = async () => {
   const features = await getFeatures();

   return (
      <section className="pb-20 px-6 bg-white dark:bg-zinc-950">
         <div className="max-w-6xl mx-auto">
            {/* Section Header */}
            <div className="py-20 px-6 bg-white dark:bg-zinc-950">
               <div className="max-w-6xl mx-auto">
                  <div className="text-center ">
                     <Typography className="mb-3">Why Choose Personify ?</Typography>
                     <Typography variant="heading" >Everything you need to build a powerful personal brand</Typography>
                  </div>
               </div>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {features.map((feature, index) => (
                  <Card key={index} feature={feature} />
               ))}
            </div>
         </div>
      </section>
   )
}