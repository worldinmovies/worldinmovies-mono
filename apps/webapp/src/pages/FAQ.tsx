import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useSEO } from "@/hooks/useSEO";

interface FAQEntry {
  question: string;
  answer: string;
}

const FAQS: FAQEntry[] = [
  {
    question: "What is World in Movies?",
    answer:
      "World in Movies is a platform dedicated to discovering, tracking, and celebrating the greatest films from every corner of the globe. We curate and rank world cinema masterpieces from over 50 countries, helping film enthusiasts explore international cinema beyond their native language.",
  },
  {
    question: "How are the movies ranked and filtered?",
    answer:
      "Movies are ranked using a weighted rating that blends multiple sources, including IMDb and The Movie Database (TMDb). You can explore films by country of origin, genre, and year through our country-based filtering system, which surfaces the highest-quality titles from each region.",
  },
  {
    question: "Can I import my watchlist from Trakt.tv?",
    answer:
      "Yes! Visit the Import page, connect your Trakt.tv account, and we automatically pull your ratings and watched titles. This helps you consolidate your film tracking in one place while preserving your history.",
  },
  {
    question: "Do I need an account to use World in Movies?",
    answer:
      "No account is required to browse and discover films. However, keeping a watchlist lets you save movies you want to see and track the ones you have already seen, so you can pick up where you left off.",
  },
  {
    question: "What countries are covered?",
    answer:
      "World in Movies covers cinema from over 50 countries, with comprehensive coverage of major film-producing nations like Japan, France, India, Italy, South Korea, Mexico, and Brazil, and we continuously expand to include more voices from underrepresented regions.",
  },
  {
    question: "Is my data safe and private?",
    answer:
      "We collect only the minimum information necessary to provide our services. Your watchlist and viewing history are never sold or shared with third parties without your consent. For full details, see our Privacy Policy.",
  },
  {
    question: "What browsers and devices are supported?",
    answer:
      "World in Movies works on all modern browsers — Chrome, Firefox, Safari, and Edge — and is optimized for phones and tablets. Native mobile experiences are available for iOS and Android.",
  },
  {
    question: "Do you use tracking cookies?",
    answer:
      "We use only the essential storage needed to keep your watchlist and basic functionality working. We do not run advertising trackers or sell your data. See our Privacy Policy for the full details.",
  },
  {
    question: "How do I report a bug or suggest a feature?",
    answer:
      "We welcome feedback! Open an issue in our GitHub repository (worldinmovies/worldinmovies-mono) or reach out through the contact options on our About page.",
  },
];

const buildFAQStructuredData = (): Record<string, unknown> => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map(({ question, answer }) => ({
    "@type": "Question",
    name: question,
    acceptedAnswer: {
      "@type": "Answer",
      text: answer,
    },
  })),
});

const FAQ = () => {
  useSEO({
    title: "FAQ",
    description:
      "Frequently asked questions about World in Movies — how we rank world cinema, importing your Trakt.tv watchlist, and more.",
    keywords: "faq, world cinema, international films, trakt import, movie watchlist",
    canonicalUrl: "https://worldinmovies.com/faq",
    structuredData: buildFAQStructuredData(),
  });

  return (
    <main className="min-h-screen bg-background">
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-6 bg-gradient-accent bg-clip-text text-transparent">
              Frequently Asked Questions
            </h1>
            <p className="text-xl text-cinema-silver max-w-2xl mx-auto">
              Everything you need to know about discovering world cinema with World in Movies.
            </p>
          </div>

          <Accordion type="multiple" className="w-full">
            {FAQS.map(({ question, answer }) => (
              <AccordionItem key={question} value={question}>
                <AccordionTrigger>{question}</AccordionTrigger>
                <AccordionContent className="text-foreground/90">{answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    </main>
  );
};

export default FAQ;