// Landing is a client component (it reads auth state), but it renders on the
// server too, so the marketing copy is present in the initial HTML.
// `force-dynamic` was removed: nothing here varies per request.
export { default } from '../views/Landing'
