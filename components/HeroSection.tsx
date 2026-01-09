
import { PhotoGallery } from "./hero-section/PhotoGallery"
import { Subscribe } from "./hero-section/Subscribe"
import { Typography } from "./ui/typography/Typography"
import { getBaseUrl } from "@/lib/utils"

const getPhotos = async (): Promise<string[]> => {
   try {
      const query = `
       query {
         photos
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
         throw new Error('Failed to fetch photos');
      }

      const { data } = await res.json();
      return data.photos;
   } catch (error) {
      console.error("Error fetching photos:", error);
      return [];
   }
}

export const HeroSection = async () => {
   const photos = await getPhotos();

   return (
      <section className="relative pt-26 md:pt-32 pb-20 px-6 overflow-hidden bg-linear-to-br from-pink-50 via-purple-50 to-blue-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 rounded-b-4xl">
         {/* Gradient Overlay */}
         <div className="absolute inset-0 bg-[radial-linear(ellipse_at_top,_var(--tw-gradient-stops))] from-pink-200/20 via-transparent to-transparent dark:from-purple-900/20"></div>

         <div className="max-w-6xl mx-auto relative">
            <div className="flex items-center gap-2 justify-center mb-6">
               <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
               <Typography className="text-sm font-medium">AI That Makes You Stand Out</Typography>
            </div>
            <Typography variant="heading" className="text-4xl md:text-6xl mb-2 md:mb-6">Level Up Your Personal Brand</Typography>
            <Typography variant="subHeading" className="text-4xl md:text-6xl mb-2 md:mb-6">with Stunning AI Photos</Typography>
            <PhotoGallery photos={photos} />
            <Typography variant="paragraph" className="max-w-2xl mx-auto mb-8">
               Skip The Photoshoot Hassle! We Generate Highly Realistic Images Of You Anywhere. Office, Beach, Studio Photoshoot... You Name It. Take Your Social Media To The Next Level.
            </Typography>
            <Subscribe />
            <Typography variant="muted">
               Join 10,000+ Early-Birds Who Are Getting AI Photos
            </Typography>
         </div>
      </section>
   )
}