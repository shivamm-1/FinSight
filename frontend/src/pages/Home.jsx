import { Link } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  ChartNoAxesCombined,
  Wallet,
  ShieldCheck,
} from "lucide-react";

const features = [
  {
    icon: Wallet,
    title: "Revenue & Expenses",
    description:
      "Record and monitor business income and expenses in one place.",
  },
  {
    icon: ChartNoAxesCombined,
    title: "Profit & Cash Flow",
    description:
      "Understand profitability and track money moving through your business.",
  },
  {
    icon: BarChart3,
    title: "Financial Insights",
    description:
      "Explore margins, financial ratios, trends, and break-even analysis.",
  },
];

function Home() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="rounded-lg bg-blue-700 p-2 text-white">
              <BriefcaseBusiness size={21} />
            </div>
            <span className="text-xl font-bold tracking-tight">
              Fin<span className="text-blue-700">Sight</span>
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/login"
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 sm:px-4"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="rounded-lg bg-blue-700 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-800 sm:px-4"
            >
              Get Started
            </Link>
          </div>
        </nav>
      </header>

      <main>
        <section className="mx-auto grid max-w-7xl items-center gap-8 px-5 py-8 sm:px-6 md:grid-cols-2 md:gap-10 md:py-10 lg:gap-14 lg:py-12">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1.5 text-xs font-semibold text-blue-800 sm:text-sm">
              <ShieldCheck size={16} />
              Smarter financial decisions
            </div>

            <h1 className="max-w-2xl text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
              Understand your business.
              <span className="text-blue-700"> Grow with confidence.</span>
            </h1>

            <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
              FinSight helps small businesses organize financial records,
              understand profitability, monitor cash flow, and make informed
              business decisions.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-800"
              >
                Create Account <ArrowRight size={17} />
              </Link>
              <Link
                to="/login"
                className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Sign In
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Financial overview
                </p>
                <h2 className="mt-1 text-xl font-bold">
                  Your business, clearly.
                </h2>
              </div>
              <div className="rounded-xl bg-blue-100 p-3 text-blue-700">
                <ChartNoAxesCombined size={25} />
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Revenue</p>
                <p className="mt-1 text-xl font-bold text-slate-900">₹ —</p>
                <p className="mt-1 text-xs text-slate-500">Track your income</p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Expenses</p>
                <p className="mt-1 text-xl font-bold text-slate-900">₹ —</p>
                <p className="mt-1 text-xs text-slate-500">
                  Monitor your costs
                </p>
              </div>

              <div className="col-span-2 rounded-xl bg-blue-50 p-4">
                <p className="text-sm font-semibold text-blue-800">
                  Business insights
                </p>
                <p className="mt-1.5 text-sm font-semibold text-slate-800">
                  Profitability · Cash flow · Financial trends
                </p>
                <p className="mt-1.5 text-sm leading-6 text-slate-600">
                  Your actual financial figures will appear after you sign in
                  and enter your business data.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-slate-200 bg-white px-5 py-8 sm:px-6 md:py-10">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Everything you need to see the bigger picture
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
                Turn your financial records into information you can use.
              </p>
            </div>

            <div className="mt-7 grid gap-4 md:grid-cols-3">
              {features.map((feature) => {
                const Icon = feature.icon;

                return (
                  <article
                    key={feature.title}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-1 hover:shadow-md"
                  >
                    <div className="inline-flex rounded-lg bg-blue-100 p-2.5 text-blue-700">
                      <Icon size={23} />
                    </div>
                    <h3 className="mt-3 text-lg font-bold">{feature.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {feature.description}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-slate-50 px-5 py-4 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-1 text-xs text-slate-500 sm:flex-row sm:text-sm">
          <p>© {new Date().getFullYear()} FinSight</p>
          <p>Financial insights for small businesses.</p>
        </div>
      </footer>
    </div>
  );
}

export default Home;
