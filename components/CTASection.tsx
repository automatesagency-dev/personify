import Button from "./ui/button/Button"
import { Typography } from "./ui/typography/Typography"

export const CTASection = () => {


  return (
    <section className="pb-20 px-6 ">
      <div className="py-10 md:py-20 px-6  max-w-6xl mx-auto bg-linear-to-b from-[#F7B758]/10 rounded-3xl via-[#B62161]/10 to-[#B62161]/10 dark:from-zinc-700 dark:via-zinc-800 dark:to-zinc-900 dark:shadow-[inset_0_-100px_100px_16px_rgba(0,0,0,0.35)] dark:shadow-zinc-900">
        <div className="max-w-4xl mx-auto text-center">
          <Typography variant="heading" className=" mb-6 leading-snug">
            Transform Your Personal Brand <br />Starting Today
          </Typography>
          <Typography variant="title" className=" mb-8 max-w-2xl mx-auto" >
            Not Everything Is Possible In Reality, But What If You Can Generate Your Image Anywhere, Dont Hesitate, And Transform Your Social Market To The Next Level.
          </Typography>
          <a href="https://docs.google.com/forms/d/e/1FAIpQLScoMDwkY20BYzFSSq6KTgEBwMKEM3j9OmCbcTbqTvIo2I9gFw/viewform"> 
          <Button> Join the Waitlist</Button>
          </a>
        </div>
      </div>
    </section>
  )
}