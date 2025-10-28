"use client"

import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen" style={{
      fontFamily: 'Inter, sans-serif',
      background: '#090920',
      color: '#f5f5f5',
      lineHeight: '1.6',
      position: 'relative',
      overflowX: 'hidden'
    }}>
      {/* Batik Pattern Background */}
      <div style={{
        content: '""',
        position: 'fixed',
        inset: 0,
        backgroundImage: `
          radial-gradient(circle at 25% 25%, rgba(212, 175, 55, 0.04) 2%, transparent 0%),
          radial-gradient(circle at 75% 75%, rgba(232, 213, 183, 0.04) 2%, transparent 0%),
          radial-gradient(circle at 50% 50%, rgba(255, 0, 0, 0.02) 1%, transparent 0%)
        `,
        backgroundSize: '60px 60px, 80px 80px, 40px 40px',
        backgroundPosition: '0 0, 20px 20px, 40px 40px',
        pointerEvents: 'none',
        zIndex: 0,
        animation: 'batik-flow 8s ease-in-out infinite'
      }} />

      {/* Vignette Effect */}
      <div style={{
        content: '""',
        position: 'fixed',
        inset: 0,
        background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0, 0, 0, 0.3) 100%)',
        pointerEvents: 'none',
        zIndex: 1
      }} />

      {/* Main Container */}
      <div style={{
        position: 'relative',
        zIndex: 2,
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '0 2rem'
      }}>
        
        {/* HEADER */}
        <header style={{
          padding: '1.5rem 0',
          borderBottom: '1px solid rgba(232, 213, 183, 0.1)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Link href="/" style={{
              display: 'block',
              transition: 'transform 0.3s'
            }}>
              <img src="/logo/balizero-logo.png" alt="Bali Zero Logo" width="120" height="60" style={{
                height: '60px',
                width: 'auto'
              }} />
            </Link>
            
            <nav style={{
              display: 'flex',
              gap: '2.5rem',
              alignItems: 'center'
            }}>
              <Link href="/landing%20page/welcome-balizero-redesign.html" style={{
                color: '#e8d5b7',
                textDecoration: 'none',
                fontWeight: 500,
                fontSize: '0.95rem',
                transition: 'all 0.3s',
                position: 'relative'
              }}>HOME</Link>
              <Link href="/landing%20page/welcome-visas-page.html" style={{
                color: '#e8d5b7',
                textDecoration: 'none',
                fontWeight: 500,
                fontSize: '0.95rem',
                transition: 'all 0.3s'
              }}>VISAS</Link>
              <Link href="/landing%20page/welcome-company-page.html" style={{
                color: '#e8d5b7',
                textDecoration: 'none',
                fontWeight: 500,
                fontSize: '0.95rem',
                transition: 'all 0.3s'
              }}>COMPANY</Link>
              <Link href="/landing%20page/welcome-tax-page.html" style={{
                color: '#e8d5b7',
                textDecoration: 'none',
                fontWeight: 500,
                fontSize: '0.95rem',
                transition: 'all 0.3s'
              }}>TAX</Link>
              <Link href="/landing%20page/welcome-real-estate-page.html" style={{
                color: '#e8d5b7',
                textDecoration: 'none',
                fontWeight: 500,
                fontSize: '0.95rem',
                transition: 'all 0.3s'
              }}>REAL ESTATE</Link>
              <Link href="/landing%20page/welcome-team-page.html" style={{
                color: '#e8d5b7',
                textDecoration: 'none',
                fontWeight: 500,
                fontSize: '0.95rem',
                transition: 'all 0.3s'
              }}>TEAM</Link>
              <Link href="/landing%20page/welcome-contact-page.html" style={{
                color: '#e8d5b7',
                textDecoration: 'none',
                fontWeight: 500,
                fontSize: '0.95rem',
                transition: 'all 0.3s'
              }}>CONTACT</Link>
            </nav>
          </div>
        </header>

        {/* HERO SECTION */}
        <section style={{
          padding: '8rem 0 6rem',
          textAlign: 'center'
        }}>
          <p style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: '0.9rem',
            fontWeight: 700,
            letterSpacing: '3px',
            color: '#D4AF37',
            marginBottom: '2rem',
            textTransform: 'uppercase'
          }}>FROM ZERO TO INFINITY ∞</p>
          
          <h1 style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: 'clamp(2.5rem, 6vw, 5rem)',
            fontWeight: 900,
            lineHeight: '1.1',
            marginBottom: '2rem',
            color: '#f5f5f5'
          }}>
            Build Your <span style={{ color: '#FF0000' }}>Indonesian</span><br />
            Dream with Confidence
          </h1>
          
          <p style={{
            fontSize: '1.25rem',
            fontWeight: 300,
            color: 'rgba(245, 245, 245, 0.8)',
            maxWidth: '700px',
            margin: '0 auto',
            lineHeight: '1.8'
          }}>
            We simplify your journey in Bali: visas, business setup, taxes, and real estate — all under one roof.
          </p>
        </section>

        {/* SERVICES SECTION */}
        <section style={{
          padding: '4rem 0 6rem'
        }}>
          <h2 style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: '2.5rem',
            fontWeight: 700,
            textAlign: 'center',
            marginBottom: '4rem',
            color: '#f5f5f5'
          }}>Our Services</h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '2rem'
          }}>
            
            <Link href="/landing%20page/welcome-visas-page.html" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{
                background: 'linear-gradient(135deg, rgba(26, 31, 58, 0.4) 0%, rgba(9, 9, 32, 0.6) 100%)',
                border: '1px solid rgba(232, 213, 183, 0.1)',
                borderTop: '3px solid #FF0000',
                borderRadius: '8px',
                padding: '3rem 2rem',
                transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{
                  fontSize: '3rem',
                  marginBottom: '1.5rem',
                  width: '80px',
                  height: '80px',
                  margin: '0 auto 1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <img src="/sticker/visa-indonesian-sticker.png" alt="Visa Services" loading="lazy" width="80" height="80" style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    filter: 'drop-shadow(0 4px 12px rgba(212, 175, 55, 0.3))',
                    transition: 'transform 0.3s'
                  }} />
                </div>
                <h3 style={{
                  fontFamily: 'Playfair Display, serif',
                  fontSize: '1.75rem',
                  fontWeight: 700,
                  marginBottom: '1rem',
                  color: '#f5f5f5'
                }}>Visas & Immigration</h3>
                <p style={{
                  fontSize: '1rem',
                  fontWeight: 300,
                  color: 'rgba(245, 245, 245, 0.7)',
                  lineHeight: '1.7'
                }}>Stay and work in Bali with the right permits. We handle all paperwork and government processes.</p>
              </div>
            </Link>

            <Link href="/landing%20page/welcome-company-page.html" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{
                background: 'linear-gradient(135deg, rgba(26, 31, 58, 0.4) 0%, rgba(9, 9, 32, 0.6) 100%)',
                border: '1px solid rgba(232, 213, 183, 0.1)',
                borderTop: '3px solid #D4AF37',
                borderRadius: '8px',
                padding: '3rem 2rem',
                transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{
                  fontSize: '3rem',
                  marginBottom: '1.5rem',
                  width: '80px',
                  height: '80px',
                  margin: '0 auto 1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <img src="/sticker/company-indonesian-sticker.png" alt="Company Setup" loading="lazy" width="80" height="80" style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    filter: 'drop-shadow(0 4px 12px rgba(212, 175, 55, 0.3))',
                    transition: 'transform 0.3s'
                  }} />
                </div>
                <h3 style={{
                  fontFamily: 'Playfair Display, serif',
                  fontSize: '1.75rem',
                  fontWeight: 700,
                  marginBottom: '1rem',
                  color: '#f5f5f5'
                }}>Company Setup</h3>
                <p style={{
                  fontSize: '1rem',
                  fontWeight: 300,
                  color: 'rgba(245, 245, 245, 0.7)',
                  lineHeight: '1.7'
                }}>From licenses to structure — launch your business fast. PT PMA, CV, or representative office.</p>
              </div>
            </Link>

            <Link href="/landing%20page/welcome-tax-page.html" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{
                background: 'linear-gradient(135deg, rgba(26, 31, 58, 0.4) 0%, rgba(9, 9, 32, 0.6) 100%)',
                border: '1px solid rgba(232, 213, 183, 0.1)',
                borderTop: '3px solid #e8d5b7',
                borderRadius: '8px',
                padding: '3rem 2rem',
                transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{
                  fontSize: '3rem',
                  marginBottom: '1.5rem',
                  width: '80px',
                  height: '80px',
                  margin: '0 auto 1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <img src="/sticker/tax-indonesian-sticker.png" alt="Tax Consulting" loading="lazy" width="80" height="80" style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    filter: 'drop-shadow(0 4px 12px rgba(212, 175, 55, 0.3))',
                    transition: 'transform 0.3s'
                  }} />
                </div>
                <h3 style={{
                  fontFamily: 'Playfair Display, serif',
                  fontSize: '1.75rem',
                  fontWeight: 700,
                  marginBottom: '1rem',
                  color: '#f5f5f5'
                }}>Tax Consulting</h3>
                <p style={{
                  fontSize: '1rem',
                  fontWeight: 300,
                  color: 'rgba(245, 245, 245, 0.7)',
                  lineHeight: '1.7'
                }}>Navigate Indonesia's tax system with confidence. Compliance, optimization, and peace of mind.</p>
              </div>
            </Link>

            <Link href="/landing%20page/welcome-real-estate-page.html" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{
                background: 'linear-gradient(135deg, rgba(26, 31, 58, 0.4) 0%, rgba(9, 9, 32, 0.6) 100%)',
                border: '1px solid rgba(232, 213, 183, 0.1)',
                borderTop: '3px solid #FF0000',
                borderRadius: '8px',
                padding: '3rem 2rem',
                transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{
                  fontSize: '3rem',
                  marginBottom: '1.5rem',
                  width: '80px',
                  height: '80px',
                  margin: '0 auto 1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <img src="/sticker/realestate-indonesian-sticker.png" alt="Real Estate" loading="lazy" width="80" height="80" style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    filter: 'drop-shadow(0 4px 12px rgba(212, 175, 55, 0.3))',
                    transition: 'transform 0.3s'
                  }} />
                </div>
                <h3 style={{
                  fontFamily: 'Playfair Display, serif',
                  fontSize: '1.75rem',
                  fontWeight: 700,
                  marginBottom: '1rem',
                  color: '#f5f5f5'
                }}>Real Estate</h3>
                <p style={{
                  fontSize: '1rem',
                  fontWeight: 300,
                  color: 'rgba(245, 245, 245, 0.7)',
                  lineHeight: '1.7'
                }}>Secure property with legal clarity and guidance. Villa rentals, leases, and ownership structures.</p>
              </div>
            </Link>

          </div>
        </section>

        {/* TEAM SECTION */}
        <section style={{
          padding: '4rem 0 6rem',
          background: 'linear-gradient(180deg, rgba(26, 31, 58, 0.2) 0%, transparent 100%)'
        }}>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: '2.5rem',
              fontWeight: 700,
              marginBottom: '1.5rem',
              color: '#f5f5f5'
            }}>Work with Experts</h2>
            <p style={{
              fontSize: '1.125rem',
              color: 'rgba(245, 245, 245, 0.7)',
              marginBottom: '2rem'
            }}>Our team combines local knowledge with international experience.</p>
            <Link href="/landing%20page/welcome-team-page.html" style={{
              display: 'inline-block',
              background: '#FF0000',
              color: '#090920',
              padding: '1rem 3rem',
              fontFamily: 'Playfair Display, serif',
              fontSize: '1rem',
              fontWeight: 700,
              textDecoration: 'none',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
              letterSpacing: '0.5px'
            }}>Meet Our Team</Link>
          </div>
        </section>

        {/* CONTACT SECTION */}
        <section style={{ padding: '6rem 0 4rem' }}>
          <h2 style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: '2.5rem',
            fontWeight: 700,
            textAlign: 'center',
            marginBottom: '3rem',
            color: '#f5f5f5'
          }}>Get in Touch</h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '3rem'
          }}>
            <div style={{ textAlign: 'center' }}>
              <h3 style={{
                fontFamily: 'Playfair Display, serif',
                fontSize: '1.25rem',
                fontWeight: 700,
                color: '#D4AF37',
                marginBottom: '1rem'
              }}>Office</h3>
              <p style={{ color: 'rgba(245, 245, 245, 0.8)' }}>Kerobokan, Bali<br />Indonesia</p>
            </div>

            <div style={{ textAlign: 'center' }}>
              <h3 style={{
                fontFamily: 'Playfair Display, serif',
                fontSize: '1.25rem',
                fontWeight: 700,
                color: '#D4AF37',
                marginBottom: '1rem'
              }}>Email</h3>
              <Link href="mailto:info@balizero.com" style={{
                color: 'rgba(245, 245, 245, 0.8)',
                textDecoration: 'none',
                fontWeight: 300,
                transition: 'color 0.3s'
              }}>info@balizero.com</Link>
            </div>

            <div style={{ textAlign: 'center' }}>
              <h3 style={{
                fontFamily: 'Playfair Display, serif',
                fontSize: '1.25rem',
                fontWeight: 700,
                color: '#D4AF37',
                marginBottom: '1rem'
              }}>WhatsApp</h3>
              <Link href="https://wa.me/6285904369574" style={{
                color: 'rgba(245, 245, 245, 0.8)',
                textDecoration: 'none',
                fontWeight: 300,
                transition: 'color 0.3s'
              }}>+62 859 0436 9574</Link>
            </div>

            <div style={{ textAlign: 'center' }}>
              <h3 style={{
                fontFamily: 'Playfair Display, serif',
                fontSize: '1.25rem',
                fontWeight: 700,
                color: '#D4AF37',
                marginBottom: '1rem'
              }}>Instagram</h3>
              <Link href="https://instagram.com/balizero0" style={{
                color: 'rgba(245, 245, 245, 0.8)',
                textDecoration: 'none',
                fontWeight: 300,
                transition: 'color 0.3s'
              }}>@balizero0</Link>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer style={{
          borderTop: '1px solid rgba(232, 213, 183, 0.1)',
          padding: '3rem 0',
          textAlign: 'center',
          marginTop: '4rem'
        }}>
          <p style={{
            color: 'rgba(245, 245, 245, 0.5)',
            fontSize: '0.9rem'
          }}>© 2025 Bali Zero. All rights reserved.</p>
        </footer>

      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Inter:wght@300;400;500;600;700&display=swap');
        
        @keyframes batik-flow {
          0%, 100% { opacity: 0.03; }
          50% { opacity: 0.06; }
        }

        div:hover img {
          transform: scale(1.1);
        }

        a:hover {
          color: #D4AF37 !important;
        }

        div[style*="cursor: pointer"]:hover {
          transform: translateY(-8px);
          border-color: rgba(255, 0, 0, 0.3);
          box-shadow: 0 20px 60px rgba(255, 0, 0, 0.2);
        }

        a[style*="background: #FF0000"]:hover {
          background: #D4AF37 !important;
          box-shadow: 0 0 30px rgba(212, 175, 55, 0.6);
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  )
}