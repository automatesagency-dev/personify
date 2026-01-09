
import Card from "./feacture-section/Card"
import { Typography } from "./ui/typography/Typography"
import { execute, parse } from 'graphql'
import { schema } from "@/lib/schema"

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

      const result = await execute({
         schema,
         document: parse(query)
      });

      if (result.errors) {
         console.error("GraphQL Errors:", result.errors);
         return [];
      }

      return (result.data as any)?.features || [];
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