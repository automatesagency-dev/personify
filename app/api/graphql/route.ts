import { createYoga } from 'graphql-yoga';
import { schema } from '@/lib/schema';

const yoga = createYoga({
    schema,
    graphqlEndpoint: '/api/graphql',
    fetchAPI: { Response },
});

export { yoga as GET, yoga as POST };
