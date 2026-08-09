import { Link } from "wouter";
import { ArrowRight, PieChart, ShieldCheck, Zap } from "lucide-react";
import { motion } from "framer-motion";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 selection:bg-teal-500/30">
      <nav className="h-16 flex items-center justify-between px-6 lg:px-12 max-w-7xl mx-auto">
        <div className="flex items-center gap-2 font-bold text-xl text-teal-700 dark:text-teal-500">
          <img src="/logo.svg" alt="SpendWise" className="h-8 w-auto dark:invert" />
        </div>
        <div className="flex items-center gap-4">
          <Link href="/sign-in" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-teal-600 transition-colors">
            Log in
          </Link>
          <Link 
            href="/sign-up" 
            className="text-sm font-medium bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors shadow-sm"
          >
            Get Started
          </Link>
        </div>
      </nav>

      <main>
        <section className="pt-24 pb-32 px-6 lg:px-12 max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-100/50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 text-sm font-medium mb-6">
              <span className="flex h-2 w-2 rounded-full bg-teal-500"></span>
              Take control of your finances
            </div>
            <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-slate-900 dark:text-white leading-[1.1] mb-6">
              Track less. <br />
              <span className="text-teal-600 dark:text-teal-500">Live more.</span>
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-10 max-w-xl leading-relaxed">
              A personal expense tracker built for clarity and speed. See exactly where your money goes without the clutter. Deliberate, intelligent, and calm.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Link 
                href="/sign-up" 
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-teal-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-teal-700 transition-colors shadow-lg shadow-teal-900/20 text-lg"
              >
                Start tracking for free
                <ArrowRight className="h-5 w-5" />
              </Link>
              <p className="text-sm text-slate-500">No credit card required</p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-teal-500/20 to-emerald-500/5 rounded-3xl blur-3xl -z-10"></div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 lg:p-8">
              {/* Mock UI snippet */}
              <div className="space-y-6">
                <div className="flex justify-between items-end pb-6 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Budget remaining</p>
                    <p className="text-4xl font-bold text-slate-900 dark:text-white">Rs. 42,500</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Spent</p>
                    <p className="text-xl font-semibold text-slate-700 dark:text-slate-300">Rs. 57,500</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {[
                    { name: 'Groceries', amount: 'Rs. 12,400', progress: 65, color: 'bg-teal-500' },
                    { name: 'Utilities', amount: 'Rs. 8,200', progress: 40, color: 'bg-emerald-500' },
                    { name: 'Entertainment', amount: 'Rs. 15,000', progress: 85, color: 'bg-amber-500' }
                  ].map((cat, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-medium text-slate-700 dark:text-slate-300">{cat.name}</span>
                        <span className="text-slate-600 dark:text-slate-400">{cat.amount}</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full ${cat.color} rounded-full`} style={{ width: `${cat.progress}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        <section className="py-24 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Everything you need, nothing you don't</h2>
              <p className="text-slate-600 dark:text-slate-400 text-lg">We stripped away the noise so you can focus on the numbers that matter.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900/50 rounded-xl flex items-center justify-center text-teal-600 dark:text-teal-400 mb-6">
                  <Zap className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Lightning Fast Entry</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">Add transactions in seconds. No bloated forms or slow loading screens. Get in, record, get out.</p>
              </div>
              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900/50 rounded-xl flex items-center justify-center text-teal-600 dark:text-teal-400 mb-6">
                  <PieChart className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Instant Clarity</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">Your budget status is front and center. Colors tell you when you're close to your limits so you can adjust.</p>
              </div>
              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900/50 rounded-xl flex items-center justify-center text-teal-600 dark:text-teal-400 mb-6">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Private & Secure</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">Your financial data belongs to you. We use enterprise-grade security to keep your information safe.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-12 border-t border-slate-200 dark:border-slate-800 text-center text-slate-500 dark:text-slate-400 text-sm">
        <p>© {new Date().getFullYear()} SpendWise. All rights reserved.</p>
      </footer>
    </div>
  );
}