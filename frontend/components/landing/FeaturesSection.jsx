import { FeatureCard } from './FeatureCard';
import { Typography } from './Typography';

const features = [
  {
    icon: '/Icons/Professional Potrails.svg',
    title: 'Professional Portraits',
    description: 'Corporate Headshots and Professional Photos That Enhance Your LinkedIn And Resume.',
  },
  {
    icon: '/Icons/Social Media Content.svg',
    title: 'Social Media Content',
    description: 'Engaging And Unique Images For Instagram, Facebook, And Twitter Every Day.',
  },
  {
    icon: '/Icons/UniqueThemes.svg',
    title: '50+ Unique Themes',
    description: 'Create Your Photos In Any Location - Desert, Underwater, Mountains, Or City.',
  },
  {
    icon: '/Icons/Instant Generation.svg',
    title: 'Instant Generation',
    description: 'Your Realistic Images Are Ready In Just One Click - No Waiting Required.',
  },
  {
    icon: '/Icons/Anytime, Anywhere.svg',
    title: 'Anytime, Anywhere',
    description: 'Hard To Travel In Reality? Go Anywhere With AI - Airplane, Space, Or Ocean.',
  },
  {
    icon: '/Icons/Highly Realistic.svg',
    title: 'Highly Realistic',
    description: 'AI-Powered Technology That Creates Images So Realistic They\'re Hard To Distinguish.',
  },
];

export function FeaturesSection() {
  return (
    <section className="py-20 px-6 bg-white dark:bg-zinc-950">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <Typography className="mb-3">Why Choose Personify?</Typography>
          <Typography variant="heading">
            Everything you need to build a powerful personal brand
          </Typography>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <FeatureCard key={index} feature={feature} />
          ))}
        </div>
      </div>
    </section>
  );
}
