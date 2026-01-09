import { createSchema } from 'graphql-yoga';
import { features, photos } from '@/lib/data';

const typeDefs = `
  type Feature {
    icon: String
    title: String
    description: String
  }

  type Query {
    features: [Feature]
    photos: [String]
  }
`;

const resolvers = {
    Query: {
        features: () => features,
        photos: () => photos,
    },
};

export const schema = createSchema({
    typeDefs,
    resolvers,
});
