import Link from 'next/link'
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer'
import InstagramIcon from '@mui/icons-material/Instagram'
import TwitterIcon from '@mui/icons-material/Twitter'
import FacebookIcon from '@mui/icons-material/Facebook'
import YouTubeIcon from '@mui/icons-material/YouTube'
import PhoneIcon from '@mui/icons-material/Phone'
import EmailIcon from '@mui/icons-material/Email'
import LocationOnIcon from '@mui/icons-material/LocationOn'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-slate-800">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 bg-brand-500 rounded-lg flex items-center justify-center">
                <SportsSoccerIcon className="text-white" fontSize="small" />
              </div>
              <span className="text-xl font-bold text-white">Turffy</span>
            </div>
            <p className="text-sm leading-relaxed mb-5">
              Tamil Nadu&apos;s #1 sports turf booking platform. Book your favourite turf in
              seconds — no calls needed.
            </p>
            <div className="flex items-center gap-3">
              {[
                { icon: <InstagramIcon fontSize="small" />, href: '#' },
                { icon: <TwitterIcon fontSize="small" />, href: '#' },
                { icon: <FacebookIcon fontSize="small" />, href: '#' },
                { icon: <YouTubeIcon fontSize="small" />, href: '#' },
              ].map((social, i) => (
                <a
                  key={i}
                  href={social.href}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-brand-600 hover:text-white transition-all duration-200"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2.5">
              {[
                { label: 'Browse Turfs', href: '/turfs' },
                { label: 'Register as Owner', href: '/register?role=owner' },
                { label: 'How It Works', href: '/#how-it-works' },
                { label: 'Pricing', href: '/#pricing' },
                { label: 'Blog', href: '#' },
              ].map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm hover:text-brand-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Sports */}
          <div>
            <h3 className="text-white font-semibold mb-4">Sports</h3>
            <ul className="space-y-2.5">
              {[
                'Football',
                'Cricket',
                'Basketball',
                'Badminton',
                'Tennis',
                'Volleyball',
              ].map((sport) => (
                <li key={sport}>
                  <Link
                    href={`/turfs?sport=${sport.toLowerCase()}`}
                    className="text-sm hover:text-brand-400 transition-colors"
                  >
                    {sport} Turfs
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5">
                <LocationOnIcon fontSize="small" className="text-brand-400 mt-0.5 flex-shrink-0" />
                <span className="text-sm">
                  No. 12, Sports Hub Road,
                  <br />
                  Nungambakkam, Chennai,
                  <br />
                  Tamil Nadu 600034
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <PhoneIcon fontSize="small" className="text-brand-400" />
                <a href="tel:+914412345678" className="text-sm hover:text-brand-400 transition-colors">
                  +91 44 1234 5678
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <EmailIcon fontSize="small" className="text-brand-400" />
                <a href="mailto:support@turffy.in" className="text-sm hover:text-brand-400 transition-colors">
                  support@turffy.in
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            © {currentYear} Turffy. All rights reserved. Made with ♥ in Tamil Nadu.
          </p>
          <div className="flex items-center gap-6">
            {['Privacy Policy', 'Terms of Service', 'Refund Policy'].map((item) => (
              <Link
                key={item}
                href="#"
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                {item}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
