import Link from "next/link";
import { LocalizedText } from "@/components/LocalizedText";
import { LanguageSwitch } from "@/components/LanguageSwitch";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100">
      <header className="px-6 py-4 flex items-center justify-between border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
            <span className="text-emerald-400 font-bold">L</span>
          </div>
          <span className="font-bold text-lg tracking-tight">Latino&apos;s Trading</span>
        </div>
        <nav className="hidden md:flex items-center gap-6 text-sm text-slate-400">
          <Link href="#features" className="hover:text-emerald-400 transition-colors"><LocalizedText id="navFeatures" fallback="Features" /></Link>
          <Link href="#pricing" className="hover:text-emerald-400 transition-colors"><LocalizedText id="navPricing" fallback="Pricing" /></Link>
          <Link href="#about" className="hover:text-emerald-400 transition-colors"><LocalizedText id="navAbout" fallback="About" /></Link>
        </nav>
        <div className="flex items-center gap-3">
          <LanguageSwitch />
          <Link href="/auth/signin" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
            <LocalizedText id="navSignIn" fallback="Sign In" />
          </Link>
          <Link 
            href="/auth/signin" 
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-lg shadow-emerald-900/20"
          >
            <LocalizedText id="navGetStarted" fallback="Get Started" />
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        {/* Hero Section */}
        <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-900/20 via-slate-950 to-slate-950 -z-10" />
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/30 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-8 animate-fade-in-up">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            V2.0 is Live
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6 max-w-4xl bg-gradient-to-br from-white via-slate-200 to-slate-500 bg-clip-text text-transparent">
            <LocalizedText id="landingHero" fallback="Algorithmic Trading for Everyone" />
          </h1>
          
          <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl leading-relaxed">
            <LocalizedText id="landingSubhero" fallback="Build, backtest, and deploy automated trading strategies with ease." />
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <Link 
              href="/auth/signin" 
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-8 py-3.5 rounded-xl transition-all hover:scale-105 shadow-xl shadow-emerald-900/20 flex items-center justify-center gap-2"
            >
              <LocalizedText id="landingCtaPrimary" fallback="Start Trading Free" />
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
            <Link 
              href="/dashboard"
              className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold px-8 py-3.5 rounded-xl border border-slate-800 transition-all hover:border-slate-700 flex items-center justify-center"
            >
              <LocalizedText id="landingCtaSecondary" fallback="View Demo" />
            </Link>
          </div>

          {/* Abstract UI Mockup */}
          <div className="mt-20 relative w-full max-w-5xl aspect-video rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm shadow-2xl overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent z-10" />
            <div className="p-4 grid grid-cols-3 gap-4 h-full opacity-50 group-hover:opacity-75 transition-opacity duration-500">
               <div className="col-span-2 space-y-4">
                  <div className="h-48 rounded-lg bg-slate-800/50 animate-pulse" />
                  <div className="h-32 rounded-lg bg-slate-800/30" />
               </div>
               <div className="space-y-4">
                  <div className="h-20 rounded-lg bg-emerald-900/20 border border-emerald-500/20" />
                  <div className="h-20 rounded-lg bg-slate-800/30" />
                  <div className="h-full rounded-lg bg-slate-800/20" />
               </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="py-24 px-6 bg-slate-950 border-t border-slate-900">
           <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { titleKey: "feature1Title", descKey: "feature1Desc", icon: "⚡" },
                { titleKey: "feature2Title", descKey: "feature2Desc", icon: "📡" },
                { titleKey: "feature3Title", descKey: "feature3Desc", icon: "📊" }
              ].map((f, i) => (
                <div key={i} className="p-6 rounded-2xl bg-slate-900/30 border border-slate-800 hover:border-emerald-500/30 transition-colors group">
                   <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">{f.icon}</div>
                   <h3 className="text-xl font-bold text-white mb-2">
                       <LocalizedText id={f.titleKey as any} fallback="Feature" />
                   </h3>
                   <p className="text-slate-400 leading-relaxed">
                       <LocalizedText id={f.descKey as any} fallback="Description" />
                   </p>
                </div>
              ))}
           </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-24 px-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-slate-950 -z-20" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950 -z-10" />

          <div className="max-w-6xl mx-auto">
             <div className="text-center mb-16">
               <h2 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent mb-6">
                 <LocalizedText id="pricingTitle" fallback="Simple Pricing" />
               </h2>
               <p className="text-slate-400 max-w-2xl mx-auto text-lg">
                 <LocalizedText id="pricingSubtitle" fallback="Start small and scale as you grow. No hidden fees." />
               </p>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
               {/* Starter */}
               <div className="p-8 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all group backdrop-blur-sm">
                 <div className="mb-8">
                   <h3 className="text-xl font-semibold text-slate-300 mb-2">Starter</h3>
                   <div className="flex items-baseline gap-1">
                     <span className="text-4xl font-bold text-white">$0</span>
                     <span className="text-slate-500">/mo</span>
                   </div>
                   <p className="text-slate-500 text-sm mt-4">Perfect for testing strategies.</p>
                 </div>
                 <ul className="space-y-4 mb-8 text-sm text-slate-400">
                   <li className="flex items-center gap-3">
                     <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                     Simulation (Entrenamiento) Only
                   </li>
                   <li className="flex items-center gap-3">
                     <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                     1 Active Bot
                   </li>
                   <li className="flex items-center gap-3">
                     <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                     Basic Charts
                   </li>
                 </ul>
                 <Link href="/auth/signin" className="block w-full py-3 px-6 text-center rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors border border-slate-700">
                   Get Started
                 </Link>
               </div>

               {/* Pro */}
               <div className="p-8 rounded-3xl bg-emerald-950/20 border border-emerald-500/50 hover:border-emerald-500 transition-all group relative hover:-translate-y-2 duration-300 shadow-2xl shadow-emerald-900/10">
                 <div className="absolute top-0 right-0 p-3">
                    <span className="bg-emerald-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wide">Popular</span>
                 </div>
                 <div className="mb-8">
                   <h3 className="text-xl font-semibold text-emerald-400 mb-2">Pro</h3>
                   <div className="flex items-baseline gap-1">
                     <span className="text-4xl font-bold text-white">$20</span>
                     <span className="text-emerald-500/80">/mo</span>
                   </div>
                   <p className="text-slate-400 text-sm mt-4">For serious algo traders.</p>
                 </div>
                 <ul className="space-y-4 mb-8 text-sm text-slate-300">
                   <li className="flex items-center gap-3">
                     <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                     Live Trading
                   </li>
                   <li className="flex items-center gap-3">
                     <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                     10 Active Bots
                   </li>
                   <li className="flex items-center gap-3">
                     <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                     Priority Backtesting
                   </li>
                   <li className="flex items-center gap-3">
                     <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                     Webhook Access
                   </li>
                 </ul>
                 <Link href="/auth/signin" className="block w-full py-3 px-6 text-center rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-lg shadow-emerald-900/20">
                   Upgrade Now
                 </Link>
               </div>

               {/* Enterprise */}
               <div className="p-8 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all group backdrop-blur-sm">
                 <div className="mb-8">
                   <h3 className="text-xl font-semibold text-slate-300 mb-2">Enterprise</h3>
                   <div className="flex items-baseline gap-1">
                     <span className="text-4xl font-bold text-white">Custom</span>
                   </div>
                   <p className="text-slate-500 text-sm mt-4">For funds and heavy users.</p>
                 </div>
                 <ul className="space-y-4 mb-8 text-sm text-slate-400">
                   <li className="flex items-center gap-3">
                     <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                     Unlimited Bots
                   </li>
                   <li className="flex items-center gap-3">
                     <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                     Dedicated Infrastructure
                   </li>
                   <li className="flex items-center gap-3">
                     <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                     SLA & High Priority
                   </li>
                 </ul>
                 <button className="block w-full py-3 px-6 text-center rounded-xl bg-transparent hover:bg-slate-800 text-slate-300 border border-slate-700 transition-colors">
                   Contact Sales
                 </button>
               </div>
             </div>
          </div>
        </section>
      </main>

      <footer className="py-8 px-6 border-t border-slate-900 text-center text-slate-500 text-sm">
        <p>&copy; {new Date().getFullYear()} <LocalizedText id="footerRights" fallback="Latino's Trading Platform. All rights reserved." /></p>
      </footer>
    </div>
  );
}
