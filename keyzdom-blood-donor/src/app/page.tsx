"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Heart, MapPin, Bell, Shield, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.1 } },
};

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-text-primary">
      {/* Navbar */}
      <nav className="border-b border-border bg-surface/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-primary" fill="currentColor" />
            <span className="text-xl font-bold">Keyzdom</span>
          </Link>
          <div className="flex items-center gap-4">
            <a href="#how-it-works" className="text-text-secondary hover:text-text-primary transition-colors hidden sm:block">
              How It Works
            </a>
            <a href="#features" className="text-text-secondary hover:text-text-primary transition-colors hidden sm:block">
              For Hospitals
            </a>
            <ThemeToggle />
            <Link
              href="/login"
              className="text-text-secondary hover:text-text-primary transition-colors text-sm font-medium"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 py-20 text-center">
        <motion.div {...fadeUp}>
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Heart className="h-4 w-4" fill="currentColor" />
            Saving Lives Through Community
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-text-primary">
            Donate Blood.<br />
            <span className="text-primary">Save Lives.</span>
          </h1>
          <p className="text-xl text-text-secondary max-w-2xl mx-auto mb-8">
            When hospitals face critical shortages, Keyzdom connects them with nearby
            donors in real-time. Your blood type could be the difference between life and death.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="bg-primary hover:bg-primary-hover text-white px-8 py-3 rounded-lg font-medium transition-colors inline-flex items-center justify-center gap-2"
            >
              Become a Donor
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/signup"
              className="bg-surface border border-border hover:bg-primary/10 text-text-primary px-8 py-3 rounded-lg font-medium transition-colors"
            >
              For Hospitals
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section id="how-it-works" className="bg-surface border-y border-border">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-3xl font-bold text-center mb-12 text-text-primary"
          >
            How Keyzdom Works
          </motion.h2>
          <motion.div
            variants={stagger}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-8"
          >
            <motion.div variants={fadeUp}>
              <FeatureCard
                icon={<Bell className="h-6 w-6 text-primary" />}
                title="Real-Time Alerts"
                description="Hospitals post urgent requests. Nearby compatible donors receive instant notifications via push, SMS, and email."
              />
            </motion.div>
            <motion.div variants={fadeUp}>
              <FeatureCard
                icon={<MapPin className="h-6 w-6 text-success" />}
                title="Smart Matching"
                description="Our geo-spatial matching engine finds the closest compatible donors, expanding radius automatically if unfulfilled."
              />
            </motion.div>
            <motion.div variants={fadeUp}>
              <FeatureCard
                icon={<Shield className="h-6 w-6 text-warning" />}
                title="Verified & Secure"
                description="All hospitals and blood banks are admin-verified. Donor PII is protected and only shared after acceptance."
              />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Blood Types */}
      <section id="features" className="max-w-6xl mx-auto px-4 py-16">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-3xl font-bold text-center mb-8 text-text-primary"
        >
          Every Blood Type Matters
        </motion.h2>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-wrap justify-center gap-3"
        >
          {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((type, i) => (
            <motion.div
              key={type}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="bg-surface border border-border rounded-lg px-6 py-3 font-medium text-text-primary hover:border-primary hover:bg-primary/5 transition-all cursor-default"
            >
              {type}
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Stats */}
      <section className="bg-surface border-y border-border">
        <div className="max-w-6xl mx-auto px-4 py-16 grid md:grid-cols-4 gap-8 text-center">
          {[
            { value: "2,500+", label: "Donors" },
            { value: "150+", label: "Hospitals" },
            { value: "5,000+", label: "Lives Saved" },
            { value: "< 30 min", label: "Response Time" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <StatCard value={stat.value} label={stat.label} />
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-4 py-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-primary/5 border border-primary/20 rounded-2xl p-12"
        >
          <Heart className="h-12 w-12 text-primary mx-auto mb-4" fill="currentColor" />
          <h2 className="text-3xl font-bold text-text-primary mb-4">Ready to Save Lives?</h2>
          <p className="text-text-secondary max-w-xl mx-auto mb-8">
            Join thousands of donors who are making a difference in their communities.
            It takes less than 2 minutes to sign up.
          </p>
          <Link
            href="/signup"
            className="bg-primary hover:bg-primary-hover text-white px-8 py-3 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
          >
            Sign Up Now
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto px-4 py-8 text-center text-text-secondary text-sm border-t border-border">
        <p>&copy; 2026 Keyzdom Blood Donor. All rights reserved.</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-background border border-border rounded-xl p-6 hover:shadow-lg transition-shadow">
      <div className="w-12 h-12 bg-surface rounded-lg flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2 text-text-primary">{title}</h3>
      <p className="text-text-secondary">{description}</p>
    </div>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-3xl font-bold text-primary">{value}</div>
      <div className="text-text-secondary mt-1">{label}</div>
    </div>
  );
}
