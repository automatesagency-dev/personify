import { createSchema, createYoga } from 'graphql-yoga';
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

const schema = createSchema({
    typeDefs,
    resolvers,
});

const yoga = createYoga({
    schema,
    graphqlEndpoint: '/api/graphql',
    fetchAPI: { Response },
});

export { yoga as GET, yoga as POST };
