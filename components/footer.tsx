import Link from 'next/link'

export function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="items-center h-20 w-full bg-ebena-lavender text-pompaca-purple px-4 py-4 mt-auto inset-shadow-sm inset-shadow-gray-500">
      <div className="flex flex-wrap justify-between text-sm max-w-full">
        <div>
          ©{year} Rio S., licensed under{" "}
          <a href="https://www.gnu.org/licenses/agpl-3.0.en.html" className="underline hover:no-underline">
            AGPL-3.0
          </a>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/terms"
            className="hover:underline"
          >Terms of Service</Link>
          <span>|</span>
          <Link
            href="/privacy"
            className="hover:underline"
          >Privacy Policy</Link>
          <span>|</span>
          <a href="https://github.com/rio-codes/tfo-creaturetracker" className="hover:underline">
            Github
          </a>
          <span>|</span>
          <a href="https://ko-fi.com/lyricism_" className="hover:underline">
            Buy Me a Coffee
          </a>
        </div>
      </div>
    </footer>
  )
}
