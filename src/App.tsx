// src/App.tsx
import React, { useState } from "react";

const App: React.FC = () => {
  const [isContactFormOpen, setIsContactFormOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setIsContactFormOpen(false);
      setFormData({ name: "", email: "", message: "" });
      setSubmitted(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-lg">F</div>
            <span className="text-xl font-bold">financly.ai</span>
          </div>
          <button
            onClick={() => setIsContactFormOpen(true)}
            className="px-6 py-2 bg-primary text-white font-semibold rounded-full hover:bg-primary-hover transition-colors"
          >
            Make an Offer
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-5xl mx-auto px-6 py-20 flex flex-col items-center text-center gap-8">
        <div className="space-y-4 max-w-3xl">
          <h1 className="text-6xl font-bold leading-tight text-balance">
            Premium Domain for Sale
          </h1>
          <p className="text-2xl font-semibold text-primary">
            financly.ai
          </p>
          <p className="text-lg text-neutral-600 leading-relaxed">
            A premium AI-powered financial domain perfect for fintech startups, investment platforms, or personal finance applications. Memorable, brandable, and perfectly positioned for the growing financial technology space.
          </p>
        </div>

        {/* Domain Stats */}
        <div className="grid grid-cols-3 gap-6 w-full my-8">
          <div className="bg-white p-6 rounded-2xl border border-neutral-200">
            <p className="text-sm text-neutral-600 font-semibold mb-2">DOMAIN</p>
            <p className="text-2xl font-bold">financly.ai</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-neutral-200">
            <p className="text-sm text-neutral-600 font-semibold mb-2">EXTENSION</p>
            <p className="text-2xl font-bold">.AI Domain</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-neutral-200">
            <p className="text-sm text-neutral-600 font-semibold mb-2">CATEGORY</p>
            <p className="text-2xl font-bold">Fintech</p>
          </div>
        </div>

        {/* Features */}
        <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-4 my-8">
          <div className="bg-gradient-to-br from-neutral-50 to-neutral-100 p-4 rounded-xl border border-neutral-200">
            <div className="text-sm font-semibold text-primary mb-1">✓ Brandable</div>
            <p className="text-xs text-neutral-600">Memorable and easy to pronounce</p>
          </div>
          <div className="bg-gradient-to-br from-neutral-50 to-neutral-100 p-4 rounded-xl border border-neutral-200">
            <div className="text-sm font-semibold text-primary mb-1">✓ Trending</div>
            <p className="text-xs text-neutral-600">.AI extension gaining popularity</p>
          </div>
          <div className="bg-gradient-to-br from-neutral-50 to-neutral-100 p-4 rounded-xl border border-neutral-200">
            <div className="text-sm font-semibold text-primary mb-1">✓ Premium</div>
            <p className="text-xs text-neutral-600">High-value investment opportunity</p>
          </div>
          <div className="bg-gradient-to-br from-neutral-50 to-neutral-100 p-4 rounded-xl border border-neutral-200">
            <div className="text-sm font-semibold text-primary mb-1">✓ Perfect Fit</div>
            <p className="text-xs text-neutral-600">Ideal for fintech or AI projects</p>
          </div>
        </div>

        {/* Call to Action */}
        <div className="flex flex-col sm:flex-row gap-4 mt-12">
          <button
            onClick={() => setIsContactFormOpen(true)}
            className="px-8 py-4 bg-primary text-white text-lg font-semibold rounded-full hover:bg-primary-hover transition-colors shadow-lg"
          >
            Contact to Purchase
          </button>
          <button className="px-8 py-4 bg-white text-primary text-lg font-semibold rounded-full border-2 border-primary hover:bg-primary-light transition-colors">
            Schedule a Call
          </button>
        </div>

        {/* Description Section */}
        <div className="w-full mt-16 space-y-8">
          <div className="bg-white p-8 rounded-2xl border border-neutral-200">
            <h2 className="text-2xl font-bold mb-4">Why financly.ai?</h2>
            <ul className="space-y-3 text-left">
              <li className="flex gap-3">
                <span className="text-primary font-bold">•</span>
                <span className="text-neutral-700">Strong brand association with finance and AI technology</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold">•</span>
                <span className="text-neutral-700">SEO-friendly domain with industry-relevant keywords</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold">•</span>
                <span className="text-neutral-700">Premium .AI extension adds credibility and innovation appeal</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold">•</span>
                <span className="text-neutral-700">Perfect for fintech startups, investment platforms, or AI consultancy</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold">•</span>
                <span className="text-neutral-700">Short, memorable, and easy to spell</span>
              </li>
            </ul>
          </div>

          <div className="bg-gradient-to-r from-primary to-primary-hover p-8 rounded-2xl text-white">
            <h2 className="text-2xl font-bold mb-3">Ready to Invest?</h2>
            <p className="mb-6 text-primary-light">
              Secure this premium domain today and launch your financial AI platform with a powerful brand identity.
            </p>
            <button
              onClick={() => setIsContactFormOpen(true)}
              className="px-6 py-3 bg-white text-primary font-semibold rounded-full hover:bg-neutral-100 transition-colors"
            >
              Get Started
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-neutral-900 text-neutral-400 py-8 mt-20 border-t border-neutral-800">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <p>© 2026 financly.ai | Premium Domain for Sale</p>
        </div>
      </footer>

      {/* Contact Modal */}
      {isContactFormOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            {submitted ? (
              <div className="text-center space-y-4">
                <div className="text-5xl">✓</div>
                <h3 className="text-2xl font-bold text-primary">Thank You!</h3>
                <p className="text-neutral-600">We've received your inquiry and will contact you soon.</p>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-bold mb-6">Make an Offer</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="your@email.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Message</label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                      rows={4}
                      placeholder="Tell us about your interest..."
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors"
                    >
                      Send Inquiry
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsContactFormOpen(false)}
                      className="flex-1 px-4 py-2 border border-neutral-200 text-neutral-700 font-semibold rounded-lg hover:bg-neutral-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
