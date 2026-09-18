import logo from '../assets/boraduo-logo.png'

export function Logo({ className = 'h-9 w-auto lg:h-10' }: { className?: string }) {
  return <img src={logo} alt="BoraDuo" className={className} />
}
