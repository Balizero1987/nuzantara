'use client'

import { useState } from 'react'
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    service: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Simulate form submission - replace with actual endpoint
    try {
      // In production, replace with actual form submission
      await new Promise(resolve => setTimeout(resolve, 2000))
      setSubmitStatus('success')
      setFormData({ name: '', email: '', phone: '', service: '', message: '' })
    } catch (error) {
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="bg-black batik-pattern min-h-screen">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-48 pb-16 px-4 md:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <img 
              src="/sticker/contact-communication-sticker.png" 
              alt="Contact Communication"
              className="w-32 h-32 mx-auto object-contain"
            />
          </div>
          <h1 className="text-white font-serif font-bold text-4xl md:text-5xl lg:text-6xl mb-6">
            <span className="text-red">Contact Us</span>
          </h1>
          <p className="text-white/70 font-sans text-lg md:text-xl mb-8 max-w-2xl mx-auto">
            Ready to start your journey in Bali? Get in touch with our team and we'll guide you through every step of the process.
          </p>
        </div>
      </section>

      {/* Contact Grid */}
      <section className="pb-24 px-4 md:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12">
            
            {/* Contact Form */}
            <div className="bg-navy/30 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
              <h2 className="text-white font-serif font-bold text-3xl mb-4">Send Us a Message</h2>
              <p className="text-white/70 mb-8">Fill out the form below and we'll get back to you within 24 hours.</p>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-cream text-sm font-semibold mb-2">
                    Full Name *
                  </label>
                  <input 
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    minLength={2}
                    maxLength={100}
                    className="w-full px-4 py-3 bg-black/50 border border-white/20 rounded-lg text-white focus:border-red focus:outline-none transition-colors"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label className="block text-cream text-sm font-semibold mb-2">
                    Email Address *
                  </label>
                  <input 
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    maxLength={254}
                    className="w-full px-4 py-3 bg-black/50 border border-white/20 rounded-lg text-white focus:border-red focus:outline-none transition-colors"
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <label className="block text-cream text-sm font-semibold mb-2">
                    Phone Number
                  </label>
                  <input 
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    pattern="[+]?[0-9\s\-()]{10,20}"
                    className="w-full px-4 py-3 bg-black/50 border border-white/20 rounded-lg text-white focus:border-red focus:outline-none transition-colors"
                    placeholder="+62 xxx xxxx xxxx"
                  />
                </div>

                <div>
                  <label className="block text-cream text-sm font-semibold mb-2">
                    Service Interested In *
                  </label>
                  <select 
                    name="service"
                    value={formData.service}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-black/50 border border-white/20 rounded-lg text-white focus:border-red focus:outline-none transition-colors"
                  >
                    <option value="">Select a service...</option>
                    <option value="visas">Visa Services</option>
                    <option value="company">Company Setup</option>
                    <option value="tax">Tax Consulting</option>
                    <option value="real-estate">Real Estate</option>
                    <option value="multiple">Multiple Services</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-cream text-sm font-semibold mb-2">
                    Message *
                  </label>
                  <textarea 
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    minLength={10}
                    maxLength={5000}
                    rows={5}
                    className="w-full px-4 py-3 bg-black/50 border border-white/20 rounded-lg text-white focus:border-red focus:outline-none transition-colors resize-none"
                    placeholder="Tell us about your needs..."
                  ></textarea>
                </div>

                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-red text-black px-8 py-4 font-serif font-bold rounded-full hover:bg-gold transition-all duration-300 hover:shadow-[0_0_30px_rgba(212,175,55,0.6)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </button>

                {submitStatus === 'success' && (
                  <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400">
                    Thank you for your message! We will get back to you within 24 hours.
                  </div>
                )}
                {submitStatus === 'error' && (
                  <div className="mt-4 p-4 bg-red/10 border border-red/30 rounded-lg text-red">
                    An error occurred. Please try again or contact us directly.
                  </div>
                )}
              </form>
            </div>

            {/* Contact Information */}
            <div className="space-y-6">
              {/* Office Location */}
              <a 
                href="https://maps.google.com/?q=Kerobokan+Bali" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block bg-navy/30 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-red/50 transition-all duration-300 group hover:transform hover:-translate-y-1"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 flex-shrink-0">
                    <img 
                      src="/logo/google-maps-logo.svg" 
                      alt="Office Location" 
                      className="w-full h-full object-contain group-hover:scale-110 transition-transform"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-gold font-serif font-bold text-xl mb-1">Office</h3>
                    <p className="text-white font-semibold">Kerobokan, Bali</p>
                    <p className="text-cream text-sm mt-1">Visit us by appointment</p>
                  </div>
                </div>
              </a>

              {/* Email */}
              <a 
                href="mailto:info@balizero.com"
                className="block bg-navy/30 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-red/50 transition-all duration-300 group hover:transform hover:-translate-y-1"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 flex-shrink-0">
                    <img 
                      src="/logo/gmail-logo.svg" 
                      alt="Email" 
                      className="w-full h-full object-contain group-hover:scale-110 transition-transform"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-gold font-serif font-bold text-xl mb-1">Email</h3>
                    <p className="text-white font-semibold">info@balizero.com</p>
                    <p className="text-cream text-sm mt-1">We'll respond within 24 hours</p>
                  </div>
                </div>
              </a>

              {/* WhatsApp */}
              <a 
                href="https://wa.me/6285904369574" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block bg-navy/30 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-red/50 transition-all duration-300 group hover:transform hover:-translate-y-1"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 flex-shrink-0">
                    <img 
                      src="/logo/whatsapp-logo.svg" 
                      alt="WhatsApp" 
                      className="w-full h-full object-contain group-hover:scale-110 transition-transform"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-gold font-serif font-bold text-xl mb-1">WhatsApp</h3>
                    <p className="text-white font-semibold">+62 859 0436 9574</p>
                    <p className="text-cream text-sm mt-1">Chat with us directly</p>
                  </div>
                </div>
              </a>

              {/* Instagram */}
              <a 
                href="https://instagram.com/balizero0" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block bg-navy/30 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-red/50 transition-all duration-300 group hover:transform hover:-translate-y-1"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 flex-shrink-0">
                    <img 
                      src="/logo/instagram-logo.svg" 
                      alt="Instagram" 
                      className="w-full h-full object-contain group-hover:scale-110 transition-transform"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-gold font-serif font-bold text-xl mb-1">Instagram</h3>
                    <p className="text-white font-semibold">@balizero0</p>
                    <p className="text-cream text-sm mt-1">Follow for updates</p>
                  </div>
                </div>
              </a>

              {/* Office Hours */}
              <div className="bg-gradient-to-br from-gold/10 to-red/5 rounded-2xl p-6 border border-gold/30">
                <h3 className="text-gold font-serif font-bold text-xl mb-4">Office Hours</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-white font-semibold">Monday - Friday:</span>
                    <span className="text-cream">9:00 AM - 5:00 PM</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white font-semibold">Saturday:</span>
                    <span className="text-cream">10:00 AM - 2:00 PM</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white font-semibold">Sunday:</span>
                    <span className="text-cream">Closed</span>
                  </div>
                </div>
                <p className="text-cream/70 text-sm mt-4 text-center">
                  WITA (Bali Time, UTC+8)
                </p>
              </div>
            </div>
          </div>

          {/* Map Section */}
          <div className="mt-16">
            <h2 className="text-white font-serif font-bold text-3xl mb-8 text-center">
              Find Us in Kerobokan
            </h2>
            <div className="bg-navy/30 backdrop-blur-sm rounded-2xl p-2 border border-white/10 h-[450px] flex items-center justify-center">
              <div className="text-center">
                <h3 className="text-gold font-serif font-bold text-2xl mb-2">Kerobokan, Bali</h3>
                <p className="text-cream">Exact location shared upon appointment</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}